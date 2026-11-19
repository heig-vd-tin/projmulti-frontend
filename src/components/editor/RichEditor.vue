<template>
  <div class="rich-editor" :class="{ 'rich-editor--disabled': disabled, 'rich-editor--error': error }">
    <div ref="host" class="editor-host">
      <div ref="editorEl"></div>
      <!-- Image sélectionnée : redimensionnement et alignement -->
      <div v-if="overlay" class="img-overlay" :style="overlayStyle" aria-hidden="true">
        <div class="img-handle" title="Glisser pour redimensionner" @pointerdown.prevent="startResize"></div>
        <div class="img-size">{{ overlay.width }} px</div>
      </div>
      <div v-if="overlay" class="img-toolbar" :style="toolbarStyle" role="toolbar" aria-label="Image sélectionnée">
        <button v-for="s in SIZES" :key="s.label" type="button" class="itb itb--text" :title="s.title" @mousedown.prevent @click="setWidthRatio(s.ratio)">{{ s.label }}</button>
        <span class="itb-sep" aria-hidden="true"></span>
        <button
          v-for="a in ALIGNS"
          :key="a.icon"
          type="button"
          class="itb"
          :title="a.title"
          :aria-label="a.title"
          @mousedown.prevent
          @click="setAlign(a.value)"
        >
          <v-icon :icon="a.icon" size="18" />
        </button>
        <span class="itb-sep" aria-hidden="true"></span>
        <button type="button" class="itb" title="Supprimer l'image" aria-label="Supprimer l'image" @mousedown.prevent @click="deleteImage">
          <v-icon icon="mdi-delete-outline" size="18" />
        </button>
      </div>
    </div>
    <div class="editor-footer text-caption">
      <span v-if="busy" class="d-inline-flex align-center ga-1"><v-progress-circular indeterminate size="12" width="2" /> Réduction des images…</span>
      <span v-else>Images réduites automatiquement (1600 px, JPEG). Cliquez sur une image pour la redimensionner.</span>
      <v-spacer />
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
import 'quill/dist/quill.snow.css'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { IMAGE_ALIGN_STYLES, TOOLBAR, TOOLBAR_LABELS, setupQuill } from '@/components/editor/quillSetup'
import { restoreSpaces } from '@/utils/html'
import { fileToDataUrl, shrinkImage } from '@/utils/images'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Décrivez le projet : contexte, objectifs, cahier des charges, images…' },
  disabled: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'image-error'])

const Quill = setupQuill()
const Delta = Quill.import('delta')
const IMAGE_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const SIZES = [
  { label: 'S', ratio: 0.33, title: 'Petite (un tiers de la largeur)' },
  { label: 'M', ratio: 0.5, title: 'Moyenne (la moitié)' },
  { label: 'L', ratio: 0.75, title: 'Grande (trois quarts)' },
  { label: '100 %', ratio: 1, title: 'Toute la largeur' },
]
const ALIGNS = [
  { icon: 'mdi-format-float-left', value: 'left', title: 'À gauche, texte autour' },
  { icon: 'mdi-format-float-center', value: 'center', title: 'Centrée' },
  { icon: 'mdi-format-float-right', value: 'right', title: 'À droite, texte autour' },
  { icon: 'mdi-format-float-none', value: null, title: 'Dans le texte' },
]

const host = ref(null)
const editorEl = ref(null)
const quill = shallowRef(null)
const overlay = ref(null) // { img, top, left, width, height }
const busy = ref(false)
let lastEmitted = null
let emitTimer = null
let scanTimer = null
// Images déjà traitées (empreinte de la source) : les images existantes ne sont pas retouchées.
const known = new Set()

const srcKey = (src) => `${src.length}:${src.slice(-64)}`

function currentHtml() {
  const q = quill.value
  if (!q) return props.modelValue
  if (q.getLength() <= 1 && !q.root.querySelector('img')) return ''
  return restoreSpaces(q.getSemanticHTML())
}

function emitNow() {
  clearTimeout(emitTimer)
  lastEmitted = currentHtml()
  emit('update:modelValue', lastEmitted)
  return lastEmitted
}

function setContent(html) {
  const q = quill.value
  q.setContents(q.clipboard.convert({ html: html || '', text: '' }), 'silent')
  q.history.clear()
  known.clear()
  q.root.querySelectorAll('img').forEach((img) => known.add(srcKey(img.getAttribute('src') || '')))
  lastEmitted = html || ''
}

async function insertFiles(index, files, replaceLength = 0) {
  const q = quill.value
  busy.value = true
  try {
    if (replaceLength) q.deleteText(index, replaceLength, 'user')
    let at = index
    for (const file of files) {
      if (!IMAGE_MIME.includes(file.type)) continue
      try {
        const original = await fileToDataUrl(file)
        const { src } = await shrinkImage(original)
        known.add(srcKey(src))
        q.insertEmbed(at, 'image', src, 'user')
        at += 1
      } catch {
        emit('image-error', `L'image « ${file.name} » n'a pas pu être lue.`)
      }
    }
    q.setSelection(at, 0, 'silent')
  } finally {
    busy.value = false
  }
}

function chooseImage() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = IMAGE_MIME.join(',')
  input.multiple = true
  input.onchange = () => {
    const q = quill.value
    const range = q.getSelection(true) || { index: q.getLength(), length: 0 }
    insertFiles(range.index, Array.from(input.files || []), range.length)
  }
  input.click()
}

// Images collées en HTML (copie depuis Word, une page web...) : réduites après coup.
async function shrinkPastedImages() {
  const q = quill.value
  if (!q) return
  const pending = [...q.root.querySelectorAll('img')].filter((img) => {
    const src = img.getAttribute('src') || ''
    return src.startsWith('data:') && !known.has(srcKey(src))
  })
  if (!pending.length) return
  busy.value = true
  try {
    for (const img of pending) {
      const src = img.getAttribute('src')
      known.add(srcKey(src))
      let result
      try {
        result = await shrinkImage(src)
      } catch {
        continue
      }
      if (!result.changed || !img.isConnected) continue
      const blot = Quill.find(img)
      if (!blot) continue
      const index = q.getIndex(blot)
      const formats = blot.formats ? blot.formats() : {}
      known.add(srcKey(result.src))
      q.updateContents(new Delta().retain(index).delete(1).insert({ image: result.src }, formats), 'user')
    }
  } finally {
    busy.value = false
  }
}

/* ---------- Image sélectionnée : redimensionnement ---------- */
function contentWidth() {
  const root = quill.value.root
  const cs = getComputedStyle(root)
  return root.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
}

function placeOverlay(img) {
  if (!img || !img.isConnected) {
    overlay.value = null
    return
  }
  const h = host.value.getBoundingClientRect()
  const r = img.getBoundingClientRect()
  overlay.value = { img, top: r.top - h.top, left: r.left - h.left, width: Math.round(r.width), height: Math.round(r.height) }
}

const overlayStyle = computed(() => overlay.value && {
  top: `${overlay.value.top}px`, left: `${overlay.value.left}px`,
  width: `${overlay.value.width}px`, height: `${overlay.value.height}px`,
})
// Barre de l'image posée sur l'image elle-même (coin haut gauche) pour ne pas cacher le texte ;
// sous l'image si celle-ci est trop petite.
const toolbarStyle = computed(() => {
  if (!overlay.value) return null
  const o = overlay.value
  const inside = o.width >= 330 && o.height >= 90
  return {
    top: `${inside ? o.top + 8 : o.top + o.height + 8}px`,
    left: `${Math.max(o.left + (inside ? 8 : 0), 8)}px`,
  }
})

function formatImage(formats) {
  const img = overlay.value && overlay.value.img
  const q = quill.value
  const blot = img && Quill.find(img)
  if (!blot) return
  q.formatText(q.getIndex(blot), 1, formats, 'user')
  requestAnimationFrame(() => placeOverlay(img))
}

function setWidthRatio(ratio) {
  formatImage({ width: String(Math.round(contentWidth() * ratio)), height: false })
}

function setAlign(where) {
  formatImage({ style: where ? IMAGE_ALIGN_STYLES[where] : false })
}

function deleteImage() {
  const img = overlay.value && overlay.value.img
  const blot = img && Quill.find(img)
  if (!blot) return
  quill.value.deleteText(quill.value.getIndex(blot), 1, 'user')
  overlay.value = null
}

function startResize(event) {
  const img = overlay.value && overlay.value.img
  if (!img) return
  const startX = event.clientX
  const startW = img.getBoundingClientRect().width
  const maxW = contentWidth()
  const onMove = (e) => {
    const w = Math.round(Math.min(maxW, Math.max(40, startW + (e.clientX - startX))))
    img.style.width = `${w}px`
    placeOverlay(img)
  }
  const onUp = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    const w = Math.round(img.getBoundingClientRect().width)
    img.style.removeProperty('width')
    formatImage({ width: String(w), height: false })
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}

function onRootClick(e) {
  if (props.disabled) return
  if (e.target && e.target.tagName === 'IMG') placeOverlay(e.target)
  else overlay.value = null
}

function onWindowChange() {
  if (overlay.value) placeOverlay(overlay.value.img)
}

/* ---------- Cycle de vie ---------- */
onMounted(() => {
  const q = new Quill(editorEl.value, {
    theme: 'snow',
    placeholder: props.placeholder,
    modules: {
      toolbar: { container: TOOLBAR, handlers: { image: chooseImage } },
      uploader: { mimetypes: IMAGE_MIME, handler: (range, files) => insertFiles(range.index, files, range.length) },
      clipboard: {},
    },
  })
  quill.value = q
  setContent(props.modelValue)
  q.enable(!props.disabled)

  // Libellés accessibles en français
  const toolbar = q.getModule('toolbar').container
  toolbar.setAttribute('aria-label', 'Mise en forme de la description')
  toolbar.querySelectorAll('button').forEach((b) => {
    const cls = [...b.classList].find((c) => c.startsWith('ql-'))
    const label = TOOLBAR_LABELS[`${cls}:${b.value}`] || TOOLBAR_LABELS[cls]
    if (label) {
      b.setAttribute('aria-label', label)
      b.setAttribute('title', label)
    }
  })
  toolbar.querySelectorAll('.ql-picker').forEach((p) => {
    const cls = [...p.classList].find((c) => c.startsWith('ql-') && c !== 'ql-picker' && !c.startsWith('ql-color-picker') && c !== 'ql-icon-picker')
    const label = TOOLBAR_LABELS[cls]
    const btn = p.querySelector('.ql-picker-label')
    if (label && btn) {
      btn.setAttribute('aria-label', label)
      btn.setAttribute('title', label)
    }
  })

  q.on('text-change', (_delta, _old, source) => {
    clearTimeout(emitTimer)
    emitTimer = setTimeout(emitNow, 250)
    if (overlay.value) requestAnimationFrame(() => placeOverlay(overlay.value && overlay.value.img))
    if (source === 'user') {
      clearTimeout(scanTimer)
      scanTimer = setTimeout(shrinkPastedImages, 150)
    }
  })
  q.root.addEventListener('click', onRootClick)
  q.root.addEventListener('keydown', () => { overlay.value = null })
  window.addEventListener('resize', onWindowChange)
})

onBeforeUnmount(() => {
  clearTimeout(emitTimer)
  clearTimeout(scanTimer)
  window.removeEventListener('resize', onWindowChange)
})

watch(() => props.modelValue, (html) => {
  if (quill.value && html !== lastEmitted) setContent(html)
})

watch(() => props.disabled, (d) => {
  if (quill.value) quill.value.enable(!d)
  if (d) overlay.value = null
})

defineExpose({
  // HTML exact au moment de l'enregistrement (sans attendre le délai de mise à jour).
  getHtml: emitNow,
  busy,
  focus: () => quill.value && quill.value.focus(),
})
</script>

<style>
.rich-editor { border: 1px solid rgba(var(--v-border-color), 0.24); border-radius: var(--radius-control); background: rgb(var(--v-theme-surface)); }
/* Focus en bleu (2 px), distinct de l'état d'erreur en rouge */
.rich-editor:focus-within { border-color: var(--focus-ring); box-shadow: 0 0 0 1px var(--focus-ring); }
.rich-editor--error { border-color: rgb(var(--v-theme-error)); }
.rich-editor .editor-host { position: relative; }
.rich-editor .ql-toolbar.ql-snow {
  position: sticky; top: 64px; z-index: 2;
  border: none; border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface)); border-radius: var(--radius-control) var(--radius-control) 0 0; padding: 8px 10px;
  font-family: var(--app-font);
}
.rich-editor .ql-container.ql-snow { border: none; font-family: var(--app-font); font-size: 0.975rem; }
.rich-editor .ql-editor { min-height: 320px; line-height: 1.65; padding: 16px 20px; color: rgb(var(--v-theme-on-surface)); }
.rich-editor .ql-editor.ql-blank::before { color: var(--text-hint); font-style: normal; left: 20px; }
.rich-editor .ql-editor img { max-width: 100%; height: auto; cursor: pointer; }
.rich-editor .ql-editor h1 { font-size: 1.5rem; } .rich-editor .ql-editor h2 { font-size: 1.25rem; } .rich-editor .ql-editor h3 { font-size: 1.1rem; }
.rich-editor .ql-snow .ql-stroke { stroke: rgba(var(--v-theme-on-surface), 0.75); }
.rich-editor .ql-snow .ql-fill { fill: rgba(var(--v-theme-on-surface), 0.75); }
.rich-editor .ql-snow .ql-picker { color: rgba(var(--v-theme-on-surface), 0.8); }
.rich-editor .ql-snow .ql-picker-options { background: rgb(var(--v-theme-surface)); border-radius: 8px; }
.rich-editor .ql-snow.ql-toolbar button:hover .ql-stroke, .rich-editor .ql-snow.ql-toolbar button.ql-active .ql-stroke { stroke: var(--focus-ring); }
.rich-editor .ql-snow.ql-toolbar button:hover .ql-fill, .rich-editor .ql-snow.ql-toolbar button.ql-active .ql-fill { fill: var(--focus-ring); }
.rich-editor .ql-snow.ql-toolbar button:hover, .rich-editor .ql-snow.ql-toolbar button.ql-active,
.rich-editor .ql-snow .ql-picker-label:hover, .rich-editor .ql-snow .ql-picker-label.ql-active { color: var(--focus-ring); }
.rich-editor .ql-snow .ql-tooltip { z-index: 5; border-radius: 8px; background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface)); box-shadow: 0 6px 20px rgba(0,0,0,.15); border-color: rgba(var(--v-border-color), 0.2); }
.rich-editor .ql-snow .ql-tooltip input[type=text] { background: rgb(var(--v-theme-surface)); color: inherit; border-radius: 6px; }
/* Textes de l'info-bulle des liens en français */
.rich-editor .ql-snow .ql-tooltip::before { content: 'Lien :'; }
.rich-editor .ql-snow .ql-tooltip[data-mode='link']::before { content: 'Adresse du lien :'; }
.rich-editor .ql-snow .ql-tooltip a.ql-action::after { content: 'Modifier'; }
.rich-editor .ql-snow .ql-tooltip a.ql-remove::before { content: 'Retirer'; }
.rich-editor .ql-snow .ql-tooltip.ql-editing a.ql-action::after { content: 'Enregistrer'; }
.rich-editor .ql-snow .ql-picker.ql-header .ql-picker-label::before,
.rich-editor .ql-snow .ql-picker.ql-header .ql-picker-item::before { content: 'Texte'; }
.rich-editor .ql-snow .ql-picker.ql-header .ql-picker-label[data-value='1']::before,
.rich-editor .ql-snow .ql-picker.ql-header .ql-picker-item[data-value='1']::before { content: 'Titre 1'; }
.rich-editor .ql-snow .ql-picker.ql-header .ql-picker-label[data-value='2']::before,
.rich-editor .ql-snow .ql-picker.ql-header .ql-picker-item[data-value='2']::before { content: 'Titre 2'; }
.rich-editor .ql-snow .ql-picker.ql-header .ql-picker-label[data-value='3']::before,
.rich-editor .ql-snow .ql-picker.ql-header .ql-picker-item[data-value='3']::before { content: 'Titre 3'; }
.rich-editor--disabled .ql-toolbar { opacity: 0.5; pointer-events: none; }
.rich-editor .img-overlay { position: absolute; border: 2px solid var(--focus-ring); border-radius: 4px; pointer-events: none; z-index: 3; }
.rich-editor .img-handle {
  position: absolute; right: -7px; bottom: -7px; width: 14px; height: 14px; border-radius: 4px;
  background: var(--focus-ring); border: 2px solid rgb(var(--v-theme-surface)); cursor: nwse-resize; pointer-events: auto; touch-action: none;
}
.rich-editor .img-size {
  position: absolute; right: 6px; bottom: 6px; padding: 1px 6px; border-radius: 6px; font-size: 0.72rem;
  background: rgba(20, 23, 28, 0.75); color: #fff;
}
.rich-editor .img-toolbar {
  position: absolute; z-index: 4; display: flex; align-items: center; gap: 2px; padding: 3px;
  background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-border-color), 0.16);
  border-radius: var(--radius-control); box-shadow: 0 6px 18px -6px rgba(0, 0, 0, 0.25);
}
.rich-editor .itb {
  min-width: 30px; height: 30px; padding: 0 6px; border-radius: 7px; border: none; background: transparent;
  display: inline-grid; place-items: center; cursor: pointer; color: rgba(var(--v-theme-on-surface), 0.8);
  font: inherit; font-size: 0.8rem; font-weight: 650;
}
.rich-editor .itb:hover { background: rgb(var(--v-theme-surface-light)); color: rgb(var(--v-theme-on-surface)); }
.rich-editor .itb-sep { width: 1px; height: 18px; margin: 0 3px; background: rgba(var(--v-border-color), 0.16); }
.rich-editor .editor-footer {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 8px 14px;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  color: var(--text-secondary);
}
</style>
