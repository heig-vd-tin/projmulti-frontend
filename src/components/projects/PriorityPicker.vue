<template>
  <section class="priority-picker" :class="`pp--${orientation}`" :aria-labelledby="titleId">
    <div class="pp-head">
      <h3 :id="titleId" class="pp-title">
        <template v-if="current">Votre choix n°{{ current }}</template>
        <template v-else>Ajouter à mes choix</template>
      </h3>
      <span v-if="orientation === 'vertical'" class="text-caption muted">Choisissez une place, de 1 à 5.</span>
    </div>

    <!-- Horizontal (dans le texte) : 5 cases, l'axe « meilleur → dernier » dessous -->
    <template v-if="orientation === 'horizontal'">
      <div class="pp-slots" role="group" aria-label="Place du projet dans vos choix">
        <button
          v-for="n in MAX_CHOICES"
          :key="n"
          type="button"
          class="pp-slot"
          :class="slotClass(n)"
          :disabled="prefs.saving"
          :aria-pressed="current === n"
          :aria-label="slotLabel(n)"
          :data-testid="`priority-${n}`"
          @click="pick(n)"
        >
          <RankBadge :rank="n" :empty="!filled(n)" size="md" />
          <span class="pp-sub text-truncate">{{ slotText(n) }}</span>
          <v-icon v-if="current === n" icon="mdi-check-circle" size="18" class="pp-check" />
        </button>
      </div>
      <div class="pp-axis" aria-hidden="true">
        <span><v-icon icon="mdi-arrow-left" size="14" />Meilleur choix</span>
        <span class="pp-axis-line"></span>
        <span>Dernier choix<v-icon icon="mdi-arrow-right" size="14" /></span>
      </div>
    </template>

    <!-- Vertical (panneau latéral, feuille du bas) : 1 en haut, titre complet de l'occupant -->
    <ol v-else class="pp-rows" aria-label="Place du projet dans vos choix">
      <li v-for="n in MAX_CHOICES" :key="n">
        <button
          type="button"
          class="pp-row"
          :class="slotClass(n)"
          :disabled="prefs.saving"
          :aria-pressed="current === n"
          :aria-label="slotLabel(n)"
          :data-testid="`priority-${n}`"
          @click="pick(n)"
        >
          <RankBadge :rank="n" :empty="!filled(n)" size="md" />
          <span class="pp-row-text">
            <span class="pp-row-caption">
              <template v-if="n === 1">Meilleur choix</template>
              <template v-else-if="n === MAX_CHOICES">Dernier choix</template>
              <template v-else>Choix n°{{ n }}</template>
            </span>
            <span class="pp-row-title line-clamp-2">{{ rowText(n) }}</span>
          </span>
          <v-icon v-if="current === n" icon="mdi-check-circle" size="20" class="pp-check" />
        </button>
      </li>
    </ol>

    <div class="pp-foot">
      <span class="text-body-2 muted pp-msg" aria-live="polite">
        <template v-if="savedMessage"><span class="saved"><v-icon icon="mdi-check" size="16" /> {{ savedMessage }}</span></template>
        <template v-else-if="current">Choisissez une autre place pour le déplacer (échange avec le projet qui l'occupe).</template>
        <template v-else-if="prefs.isFull">Vos 5 choix sont faits : choisir une place remplace le projet qui l'occupe.</template>
        <template v-else>Il vous reste {{ MAX_CHOICES - prefs.count }} choix.</template>
      </span>
      <v-spacer />
      <v-btn v-if="savedMessage && next" variant="tonal" size="small" append-icon="mdi-arrow-right" data-testid="picker-next" @click="$emit('next')">
        Projet suivant
      </v-btn>
      <v-btn v-else-if="current" variant="text" size="small" prepend-icon="mdi-close" :loading="prefs.saving" @click="removeIt">
        Retirer de mes choix
      </v-btn>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, useId } from 'vue'
import RankBadge from '@/components/projects/RankBadge.vue'
import { useConfirmStore } from '@/stores/confirm'
import { useNotifyStore } from '@/stores/notify'
import { MAX_CHOICES, usePreferencesStore } from '@/stores/preferences'

const props = defineProps({
  project: { type: Object, required: true },
  orientation: { type: String, default: 'horizontal' },
  // Projet suivant de la liste parcourue : proposé après un choix enregistré.
  next: { type: Object, default: null },
})
defineEmits(['next'])

const prefs = usePreferencesStore()
const notify = useNotifyStore()
const confirm = useConfirmStore()
const titleId = `pp-title-${useId()}`

const current = computed(() => prefs.priorityOf(props.project.id))
// Confirmation dans le bloc même (une notification masquerait la barre du bas).
const savedMessage = ref('')
let savedTimer = null
function confirmSaved(text) {
  savedMessage.value = text
  clearTimeout(savedTimer)
  savedTimer = setTimeout(() => { savedMessage.value = '' }, 6000)
}
onBeforeUnmount(() => clearTimeout(savedTimer))

function occupantOf(n) {
  const p = prefs.occupant(n)
  return p && p.id !== props.project.id ? p : null
}
const filled = (n) => current.value === n || !!occupantOf(n)

function slotClass(n) {
  return { 'pp--current': current.value === n, 'pp--taken': !!occupantOf(n), 'pp--free': !filled(n) }
}
function slotText(n) {
  if (current.value === n) return 'Ce projet'
  const o = occupantOf(n)
  return o ? o.title : 'Libre'
}
function rowText(n) {
  if (current.value === n) return 'Ce projet'
  const o = occupantOf(n)
  return o ? o.title : 'Libre : placer ce projet ici'
}
function slotLabel(n) {
  if (current.value === n) return `Choix n°${n} : ce projet`
  const o = occupantOf(n)
  return o ? `Choix n°${n}, actuellement « ${o.title} »` : `Choix n°${n}, libre`
}

async function pick(n) {
  if (current.value === n) return
  const other = occupantOf(n)
  try {
    if (other && !current.value) {
      const ok = await confirm.ask({
        title: `Remplacer votre choix n°${n} ?`,
        text: `« ${other.title} » sera retiré de vos choix et remplacé par « ${props.project.title} ».`,
        confirmText: 'Remplacer',
        icon: 'mdi-swap-horizontal',
      })
      if (!ok) return
      await prefs.choose(props.project.id, n, { replace: true })
    } else {
      await prefs.choose(props.project.id, n)
    }
    confirmSaved(`Enregistré : votre choix n°${n}.`)
  } catch (error) {
    notify.error(error, "Le choix n'a pas été enregistré")
    prefs.fetch().catch(() => {})
  }
}

async function removeIt() {
  try {
    await prefs.remove(props.project.id)
    confirmSaved('Retiré de vos choix.')
  } catch (error) {
    notify.error(error, "Le choix n'a pas pu être retiré")
  }
}
</script>

<style scoped>
.pp--horizontal { padding: 16px; border-radius: var(--radius-card); background: rgb(var(--v-theme-surface-light)); }
.pp-head { display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px 12px; margin-bottom: 12px; }
.pp--vertical .pp-head { flex-direction: column; gap: 2px; }
.pp-title { font-size: 1rem; font-weight: 700; margin: 0; }
.saved { display: inline-flex; align-items: center; gap: 4px; color: rgb(var(--v-theme-success)); font-weight: 600; }

/* Horizontal */
.pp-slots { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
.pp-slot {
  position: relative; display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 10px 6px 8px; border-radius: var(--radius-control); min-width: 0;
  background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-border-color), 0.14);
  color: inherit; cursor: pointer; font: inherit; transition: border-color 0.15s, background 0.15s;
}
.pp-slot.pp--free { background: transparent; border-style: dashed; border-color: rgba(var(--v-border-color), 0.3); }
.pp-sub { font-size: 0.72rem; max-width: 100%; color: var(--text-secondary); }
.pp-axis { display: flex; align-items: center; gap: 8px; margin-top: 8px; font-size: 0.75rem; color: var(--text-secondary); }
.pp-axis > span:not(.pp-axis-line) { display: inline-flex; align-items: center; gap: 2px; white-space: nowrap; }
.pp-axis-line { flex: 1; border-top: 1px dotted rgba(var(--v-border-color), 0.35); }

/* Vertical */
.pp-rows { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
.pp-row {
  width: 100%; display: flex; align-items: center; gap: 12px; padding: 8px 10px; min-height: 56px;
  border-radius: var(--radius-control); text-align: left;
  background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-border-color), 0.14);
  color: inherit; cursor: pointer; font: inherit; transition: border-color 0.15s, background 0.15s;
}
.pp-row.pp--free { background: transparent; border-style: dashed; border-color: rgba(var(--v-border-color), 0.3); }
.pp-row-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.pp-row-caption { font-size: 0.72rem; font-weight: 600; color: var(--text-secondary); }
.pp-row-title { font-size: 0.88rem; font-weight: 550; line-height: 1.3; }
.pp-row.pp--free .pp-row-title { font-weight: 400; color: var(--text-secondary); }

/* Commun : survol, projet courant (convention « sélectionné » de l'app : bord neutre foncé) */
.pp-slot:hover:not(:disabled), .pp-row:hover:not(:disabled) { border-color: rgba(var(--v-border-color), 0.5); }
.pp-slot:disabled, .pp-row:disabled { opacity: 0.6; cursor: progress; }
.pp-slot.pp--current, .pp-row.pp--current { border: 2px solid var(--sel); background: rgba(var(--v-theme-selected), 0.06); }
.pp-slot.pp--current { padding: 9px 5px 7px; }
.pp-row.pp--current { padding: 7px 9px; }
.pp-slot.pp--current .pp-sub { color: rgb(var(--v-theme-on-surface)); font-weight: 650; }
.pp-check { color: var(--sel); }
.pp-slot .pp-check { position: absolute; top: 4px; right: 4px; }

.pp-foot { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.pp--vertical .pp-msg { flex: 1 1 100%; }
@media (max-width: 480px) {
  .pp-slots { gap: 6px; }
  .pp-sub { display: none; }
  .pp-slot { padding: 8px 4px; }
  .pp-slot.pp--current { padding: 7px 3px; }
  .pp-slot .pp-check { top: 2px; right: 2px; }
}
</style>
