<template>
  <div class="page page--narrow">
    <header class="page-header">
      <div>
        <v-btn variant="text" size="small" prepend-icon="mdi-arrow-left" class="ml-n3 mb-1" @click="goBack">Retour</v-btn>
        <h1>{{ editing ? 'Modifier le projet' : 'Nouveau projet' }}</h1>
        <div class="subtitle">
          Cours {{ editing && original ? original.year : session.currentYear }}
          <template v-if="editing && original"> · {{ original.ownerName }}</template>
        </div>
      </div>
      <v-btn v-if="editing && original" variant="outlined" prepend-icon="mdi-eye-outline" data-testid="view-project" @click="viewProject">
        Voir le projet
      </v-btn>
    </header>

    <div v-if="loadingProject" class="surface-card pa-4"><v-skeleton-loader type="heading, text, text, image" class="bg-transparent" /></div>

    <v-alert v-else-if="blocker" type="info" variant="tonal" icon="mdi-lock-outline" class="mb-4">
      {{ blocker }}
      <template #append>
        <v-btn variant="text" to="/all-projects">Voir les projets</v-btn>
      </template>
    </v-alert>

    <form v-else class="d-flex flex-column ga-5" novalidate @submit.prevent="submit(false)">
      <section class="surface-card pa-5 pa-sm-6">
        <h2 class="section-title">Présentation</h2>
        <p class="section-hint">Le titre et le résumé court apparaissent sur la carte du projet vue par les étudiants.</p>
        <v-text-field
          ref="titleField"
          v-model="title"
          label="Titre du projet"
          :counter="TITLE_MAX"
          :maxlength="TITLE_MAX"
          :error-messages="showErrors && !title.trim() ? ['Le titre est obligatoire.'] : []"
          persistent-counter
          class="mb-2"
          data-testid="title"
        />
        <v-text-field
          v-model="shortDescription"
          label="Résumé court"
          hint="Une phrase qui donne envie : objectif ou réalisation principale."
          :counter="SHORT_MAX"
          :maxlength="SHORT_MAX"
          :error-messages="showErrors && !shortDescription.trim() ? ['Le résumé court est obligatoire.'] : []"
          persistent-counter
          data-testid="short"
        />
      </section>

      <section class="surface-card pa-5 pa-sm-6" :class="{ 'section--error': showErrors && !domainIds.length }">
        <h2 class="section-title">Domaines</h2>
        <p class="section-hint">Compétences nécessaires : la répartition cherche un étudiant par domaine. Au moins un domaine.</p>
        <div class="domain-picks" role="group" aria-label="Domaines du projet">
          <button
            v-for="d in sortedDomains"
            :key="d.id"
            type="button"
            class="domain-pick"
            :class="{ 'domain-pick--on': domainIds.includes(d.id) }"
            :aria-pressed="domainIds.includes(d.id)"
            @click="toggleDomain(d.id)"
          >
            <v-icon :icon="domainIcon(d)" :color="domainColor(d, dark)" size="20" />
            <span class="pick-name">{{ d.name }}</span>
            <span class="pick-box" aria-hidden="true"><v-icon v-if="domainIds.includes(d.id)" icon="mdi-check" size="16" /></span>
          </button>
        </div>
        <div v-if="showErrors && !domainIds.length" class="text-error text-body-2 mt-2">Sélectionnez au moins un domaine.</div>
      </section>

      <section class="surface-card pa-5 pa-sm-6">
        <h2 class="section-title">Description détaillée</h2>
        <p class="section-hint">Contexte, objectifs, cahier des charges, images. Exportable en PDF.</p>
        <RichEditor ref="editor" v-model="description" :disabled="!!saving" @image-error="notify.warning">
          <template #footer>
            <span :class="{ 'text-error': tooBig }">Taille : {{ formatBytes(descriptionSize) }} / {{ MAX_MB }} Mo</span>
          </template>
        </RichEditor>
      </section>

      <section class="surface-card pa-5 pa-sm-6" :class="{ 'section--draft': !proposed }">
        <h2 class="section-title">Visibilité</h2>
        <p class="section-hint">
          Vous pouvez saisir plusieurs idées en brouillon, puis proposer seulement celles que vous voulez soumettre.
          Un brouillon n'est visible que par vous et le responsable du cours : les étudiants ne le voient pas et il n'entre pas dans la sélection.
        </p>
        <v-switch
          v-model="proposed"
          color="primary"
          inset
          hide-details
          :label="proposed ? 'Proposé aux étudiants' : 'Brouillon (non visible par les étudiants)'"
          data-testid="proposed"
        />
      </section>

      <v-alert v-if="formErrors.length" ref="errorBox" type="warning" variant="tonal" icon="mdi-alert-outline" data-testid="form-errors" tabindex="-1">
        <div class="font-weight-bold mb-1">Le projet n'est pas encore enregistré :</div>
        <ul class="pl-5"><li v-for="(e, i) in formErrors" :key="i">{{ e }}</li></ul>
      </v-alert>

      <!-- Barre d'actions : état de l'enregistrement toujours visible, et une sortie claire -->
      <div class="action-bar">
        <span class="save-status" :class="`save-status--${status.kind}`" aria-live="polite" data-testid="save-status">
          <v-icon :icon="status.icon" size="18" />
          <span :class="{ 'd-none d-sm-inline': status.kind === 'idle' }">{{ status.text }}</span>
        </span>
        <v-spacer />
        <template v-if="dirty || !editing">
          <v-btn v-if="!xs" variant="text" :disabled="!!saving" data-testid="cancel" @click="goBack">Annuler</v-btn>
          <v-btn type="submit" variant="outlined" :loading="saving === 'stay'" :disabled="!!saving" title="Enregistrer et continuer (Ctrl+S)" data-testid="submit">
            Enregistrer
          </v-btn>
          <v-btn color="primary" variant="flat" prepend-icon="mdi-check" :loading="saving === 'close'" :disabled="!!saving" data-testid="submit-close" @click="submit(true)">
            {{ xs ? 'Terminer' : 'Enregistrer et fermer' }}
          </v-btn>
        </template>
        <!-- Tout est enregistré : rien à annuler, on ferme -->
        <v-btn v-else color="primary" variant="flat" prepend-icon="mdi-check" data-testid="close" @click="goBack">Fermer</v-btn>
      </div>
    </form>
  </div>
</template>

<script>
// Nouveau projet créé avec « Enregistrer » : la page se recharge en mode « modifier » et garde l'heure.
let lastCreated = null
</script>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import RichEditor from '@/components/editor/RichEditor.vue'
import { useDark } from '@/composables/useDark'
import { useConfirmStore } from '@/stores/confirm'
import { useNotifyStore } from '@/stores/notify'
import { useProjectsStore } from '@/stores/projects'
import { useSessionStore } from '@/stores/session'
import { byteSize } from '@/utils/html'
import { domainColor, domainIcon, sortDomains } from '@/utils/palette'
import { formatBytes } from '@/utils/text'

const TITLE_MAX = 100
const SHORT_MAX = 100
// Le serveur refuse une description de plus de 25 Mo.
const MAX_MB = 25

const props = defineProps({ id: { type: String, default: null } })

const session = useSessionStore()
const projects = useProjectsStore()
const notify = useNotifyStore()
const confirm = useConfirmStore()
const router = useRouter()
const dark = useDark()
const { xs } = useDisplay()

const editing = computed(() => !!props.id)
const original = ref(null)
const loadingProject = ref(false)
const loadError = ref('')
const title = ref('')
const shortDescription = ref('')
const domainIds = ref([])
const description = ref('')
const proposed = ref(true)
const saving = ref(false)
const showErrors = ref(false)
const serverError = ref('')
const editor = ref(null)
const errorBox = ref(null)
const snapshot = ref('')
let leaving = false

const descriptionSize = computed(() => byteSize(description.value))
const sortedDomains = computed(() => sortDomains(session.domains))
// Liste à jour de ce qui manque (après une première tentative), plus l'erreur du serveur.
const formErrors = computed(() => (showErrors.value ? [...check(), serverError.value].filter(Boolean) : []))
const tooBig = computed(() => descriptionSize.value > MAX_MB * 1024 * 1024)

const blocker = computed(() => {
  if (loadError.value) return loadError.value
  if (!session.canEditProjects) return 'La saisie des projets est fermée : vous pouvez consulter et exporter vos projets, mais plus les modifier.'
  if (editing.value && original.value) {
    const u = session.user
    if (!u.isAdmin && original.value.owner_id !== u.id) return "Vous n'êtes pas le responsable de ce projet."
    if (original.value.year && original.value.year !== session.currentYear) {
      return `Ce projet appartient au cours ${original.value.year}. Ouvrez-le dans la liste et cliquez sur « Reprendre pour ${session.currentYear} » pour le reprendre cette année.`
    }
  }
  return ''
})

const state = () => JSON.stringify([title.value, shortDescription.value, [...domainIds.value].sort(), description.value, proposed.value])
const dirty = computed(() => state() !== snapshot.value)
// Heure du dernier enregistrement (gardée quand un nouveau projet passe en mode « modifier »).
const savedAt = ref(lastCreated && lastCreated.id === Number(props.id) ? lastCreated.at : null)
const status = computed(() => {
  if (saving.value) return { kind: 'busy', icon: 'mdi-cloud-upload-outline', text: 'Enregistrement…' }
  if (dirty.value) return { kind: 'dirty', icon: 'mdi-circle-medium', text: 'Modifications non enregistrées' }
  if (savedAt.value) return { kind: 'saved', icon: 'mdi-cloud-check-outline', text: `Enregistré à ${savedAt.value}` }
  return { kind: 'idle', icon: 'mdi-check', text: editing.value ? 'Aucune modification' : 'Nouveau projet' }
})

onMounted(async () => {
  if (editing.value) {
    loadingProject.value = true
    try {
      // Projet complet : la liste n'a pas la description.
      const p = await projects.fetchFull(props.id)
      original.value = p
      title.value = p.title || ''
      shortDescription.value = p.short_description || ''
      domainIds.value = p.domains.map((d) => d.id)
      description.value = p.description || ''
      proposed.value = p.proposed
    } catch (error) {
      loadError.value = error.userMessage || 'Projet introuvable.'
    } finally {
      loadingProject.value = false
    }
  }
  // L'éditeur normalise le HTML au chargement : l'état « propre » est pris après.
  await nextTick()
  setTimeout(() => {
    if (editor.value) description.value = editor.value.getHtml()
    snapshot.value = state()
  }, 300)
})

function toggleDomain(id) {
  const i = domainIds.value.indexOf(id)
  if (i === -1) domainIds.value.push(id)
  else domainIds.value.splice(i, 1)
}

function check() {
  const errors = []
  if (!title.value.trim()) errors.push('Le titre est obligatoire.')
  if (!shortDescription.value.trim()) errors.push('Le résumé court est obligatoire.')
  if (!domainIds.value.length) errors.push('Sélectionnez au moins un domaine.')
  if (tooBig.value) {
    errors.push(`La description pèse ${formatBytes(descriptionSize.value)} (maximum ${MAX_MB} Mo) : réduisez la taille ou le nombre des images.`)
  }
  return errors
}

async function revealErrors() {
  await nextTick()
  const el = errorBox.value && errorBox.value.$el
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.focus({ preventScroll: true })
  }
}

// close : « Enregistrer et fermer » ; sinon on reste sur la page (bouton Enregistrer, Entrée, Ctrl+S).
async function submit(close) {
  if (saving.value) return
  if (editor.value) description.value = editor.value.getHtml()
  showErrors.value = true
  serverError.value = ''
  if (editor.value && editor.value.busy) {
    notify.info('Les images sont en cours de réduction : réessayez dans une seconde.')
    return
  }
  if (check().length) {
    await revealErrors()
    return
  }
  saving.value = close ? 'close' : 'stay'
  const payload = {
    id: editing.value ? Number(props.id) : -1,
    title: title.value.trim(),
    short_description: shortDescription.value.trim(),
    description: description.value,
    tags: original.value ? original.value.tags.map((t) => t.id) : [],
    proposed: proposed.value,
    domains: domainIds.value.map((id) => {
      const old = original.value && original.value.domains.find((d) => d.id === id)
      return { id, importance: old && old.pivot ? old.pivot.importance : 1 }
    }),
  }
  try {
    const saved = editing.value ? await projects.edit(payload) : await projects.create(payload)
    snapshot.value = state()
    showErrors.value = false
    savedAt.value = new Date().toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' })
    const message = editing.value
      ? 'Les modifications sont enregistrées.'
      : proposed.value ? 'Le projet est créé et proposé aux étudiants.' : 'Le brouillon est créé : il reste invisible pour les étudiants.'
    if (close) {
      leaving = true
      goBack()
      notify.success(message, `« ${saved.title} »`)
    } else if (!editing.value) {
      // Nouveau projet : on reste, en mode « modifier » (les enregistrements suivants le mettent à jour).
      notify.success(message)
      lastCreated = { id: saved.id, at: savedAt.value }
      leaving = true
      router.replace({ name: 'project-edit', params: { id: String(saved.id) } })
    }
  } catch (error) {
    serverError.value = error.userMessage
    await revealErrors()
    notify.error(error, "Le projet n'a pas été enregistré")
  } finally {
    saving.value = false
  }
}

// Venu de la page du projet : on y retourne (sans empiler l'historique).
function viewProject() {
  const target = `/project/${props.id}`
  if (window.history.state && window.history.state.back === target) router.back()
  else router.push(target)
}

// Retour d'où l'on vient (Mes projets, page du projet, catalogue).
function goBack() {
  if (window.history.state && window.history.state.back) router.back()
  else router.push(session.user.isTeacher ? '/my-projects' : '/all-projects')
}

// Ctrl+S / Cmd+S : enregistrer sans quitter. Fermer l'onglet avec des modifications : alerte du navigateur.
function onKey(e) {
  if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 's') {
    e.preventDefault()
    if (!blocker.value && !loadingProject.value) submit(false)
  }
}
function onBeforeUnload(e) {
  if (dirty.value && !leaving) {
    e.preventDefault()
    e.returnValue = ''
  }
}
window.addEventListener('keydown', onKey)
window.addEventListener('beforeunload', onBeforeUnload)
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('beforeunload', onBeforeUnload)
})

onBeforeRouteLeave(async () => {
  if (leaving || blocker.value || loadingProject.value || !dirty.value) return true
  return confirm.ask({
    title: 'Quitter sans enregistrer ?',
    text: 'Vos modifications seront perdues.',
    confirmText: 'Quitter',
    cancelText: 'Rester',
    color: 'error',
    icon: 'mdi-content-save-alert-outline',
  })
})
</script>

<style scoped>
.section-title { font-size: 1.05rem; font-weight: 700; margin: 0 0 2px; }
.section-hint { margin: 0 0 16px; color: var(--text-secondary); font-size: 0.9rem; }
.section--draft { border-color: rgba(var(--v-theme-warning), 0.5) !important; }
.section--error { border-color: rgba(var(--v-theme-error), 0.6) !important; }
.domain-picks { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(190px, calc(50% - 5px)), 1fr)); gap: 10px; }
/* Un seul style « coché » : bord neutre foncé et coche ; la couleur du domaine reste sur l'icône. */
.domain-pick {
  display: flex; align-items: center; gap: 10px; padding: 12px 12px 12px 14px; border-radius: var(--radius-control);
  font: inherit; font-weight: 550; text-align: left; cursor: pointer; color: rgb(var(--v-theme-on-surface));
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), 0.18);
  transition: border-color 0.15s, background 0.15s;
}
.domain-pick:hover { border-color: rgba(var(--v-border-color), 0.4); }
.domain-pick--on { border: 2px solid var(--sel); padding: 11px 11px 11px 13px; background: rgba(var(--v-theme-selected), 0.05); }
.pick-name { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pick-box {
  flex: none; width: 20px; height: 20px; border-radius: 5px; display: grid; place-items: center;
  border: 1.5px solid rgba(var(--v-border-color), 0.35);
}
.domain-pick--on .pick-box { background: var(--sel); border-color: var(--sel); color: rgb(var(--v-theme-surface)); }
.save-status { display: inline-flex; align-items: center; gap: 6px; font-size: 0.875rem; color: var(--text-secondary); min-width: 0; }
.save-status--dirty { color: rgb(var(--v-theme-warning)); font-weight: 600; }
.save-status--saved { color: rgb(var(--v-theme-success)); font-weight: 600; }
.action-bar {
  position: sticky; bottom: 0; z-index: 3;
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 12px 16px;
  background: rgba(var(--v-theme-background), 0.94); backdrop-filter: blur(6px);
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
@media (max-width: 600px) {
  .domain-pick { padding: 10px; gap: 8px; font-size: 0.9rem; }
  .domain-pick--on { padding: 9px; }
}
/* Téléphone : une colonne, pour lire le nom entier et garder la coche */
@media (max-width: 440px) {
  .domain-picks { grid-template-columns: 1fr; gap: 8px; }
}
</style>
