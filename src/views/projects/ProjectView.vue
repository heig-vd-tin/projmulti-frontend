<template>
  <div class="page" :class="sideLayout ? 'page--side' : 'page--narrow'" data-testid="project-detail">
    <div :class="{ 'side-layout': sideLayout }">
      <div class="head-col">
        <!-- Retour à la liste d'origine (filtres compris) et navigation dans cette liste -->
        <nav class="top-nav" aria-label="Navigation entre les projets">
          <v-btn variant="text" size="small" prepend-icon="mdi-arrow-left" class="ml-n3" @click="goBack">{{ nav.label }}</v-btn>
          <v-spacer />
          <template v-if="position">
            <v-btn
              icon="mdi-chevron-left"
              variant="text"
              size="small"
              :disabled="!prev"
              :aria-label="prev ? `Projet précédent : ${prev.title}` : 'Pas de projet précédent'"
              data-testid="prev-project"
              @click="go(prev)"
            />
            <span class="position tabular" aria-live="polite">{{ position.index + 1 }} / {{ position.total }}</span>
            <v-btn
              icon="mdi-chevron-right"
              variant="text"
              size="small"
              :disabled="!next"
              :aria-label="next ? `Projet suivant : ${next.title}` : 'Pas de projet suivant'"
              data-testid="next-project"
              @click="go(next)"
            />
          </template>
        </nav>

        <header class="detail-head">
          <div v-if="base" class="eyebrow">
            Cours {{ base.year || session.currentYear }}
            <span v-if="pastYear" class="tag ml-1">archive · lecture seule</span>
            <span v-if="!base.proposed" class="tag tag--draft ml-1"><v-icon icon="mdi-eye-off-outline" size="14" />Brouillon · invisible pour les étudiants</span>
          </div>
          <h1 class="detail-title">
            <template v-if="base">
              {{ base.title }}
              <RankBadge v-if="myRank" :rank="myRank" pill class="title-rank" />
            </template>
            <v-skeleton-loader v-else-if="!error" type="heading" class="bg-transparent" />
          </h1>
          <div v-if="base && base.owner" class="owner">
            <v-avatar size="28" color="secondary" variant="tonal"><span class="text-caption font-weight-bold">{{ ownerInitials }}</span></v-avatar>
            <span class="font-weight-medium">{{ base.ownerName }}</span>
            <a v-if="base.owner.email" :href="`mailto:${base.owner.email}`" class="text-body-2 owner-mail">{{ base.owner.email }}</a>
          </div>
        </header>

        <v-alert v-if="error && !base" type="error" variant="tonal" class="mb-4">
          {{ error }}
          <template #append>
            <v-btn variant="text" to="/all-projects">Voir les projets</v-btn>
          </template>
        </v-alert>

      </div>
      <div class="body-col">
        <article v-if="base || loading" class="surface-card detail-body">
          <template v-if="base">
            <div class="d-flex flex-wrap align-center ga-2 mb-4">
              <DomainBadges :domains="base.domains" mode="chips" />
              <template v-if="session.user.isAdmin">
                <span class="tag" :class="{ 'tag--ok': base.selected }">
                  <v-icon :icon="base.selected ? 'mdi-check-circle-outline' : 'mdi-circle-outline'" size="15" />
                  {{ base.selected ? 'Sélectionné' : 'Non sélectionné' }}
                </span>
                <span v-if="base.isLocked" class="tag"><v-icon icon="mdi-lock-outline" size="15" />Verrouillé</span>
              </template>
            </div>
            <p class="lead">{{ base.short_description }}</p>
          </template>

          <!-- Étudiant, écran moyen ou téléphone : le choix dans le texte (sur grand écran, panneau à droite) -->
          <PriorityPicker v-if="session.user.isStudent && base && !sideLayout" :project="base" :next="next" class="my-5" @next="go(next)" />

          <section class="mt-5" aria-label="Description du projet">
            <div v-if="loading" aria-busy="true">
              <v-skeleton-loader type="paragraph, image, paragraph" class="bg-transparent" />
            </div>
            <v-alert v-else-if="error" type="error" variant="tonal" density="comfortable">{{ error }}</v-alert>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div v-else-if="hasDescription" class="rich-content" v-html="safeHtml"></div>
            <div v-else class="muted font-italic">Pas de description détaillée.</div>
          </section>
        </article>

        <!-- En fin de lecture : passer directement au projet voisin -->
        <div v-if="base && (prev || next)" class="neighbours">
          <button v-if="prev" type="button" class="neighbour" @click="go(prev)">
            <span class="neighbour-label"><v-icon icon="mdi-chevron-left" size="16" />Précédent</span>
            <span class="neighbour-title">{{ prev.title }}</span>
          </button>
          <span v-else></span>
          <button v-if="next" type="button" class="neighbour neighbour--next" @click="go(next)">
            <span class="neighbour-label">Suivant<v-icon icon="mdi-chevron-right" size="16" /></span>
            <span class="neighbour-title">{{ next.title }}</span>
          </button>
        </div>

        <div v-if="base && !sideLayout" class="action-bar">
          <!-- Étudiant : où en est ce projet dans ses choix, et décider en fin de lecture -->
          <template v-if="session.user.isStudent">
            <RankBadge v-if="myRank" :rank="myRank" pill />
            <span v-else class="text-body-2 muted d-none d-sm-inline">Pas encore dans vos choix</span>
            <v-btn
              :variant="myRank ? 'text' : 'flat'"
              :color="myRank ? undefined : 'primary'"
              :prepend-icon="myRank ? 'mdi-swap-vertical' : 'mdi-plus'"
              data-testid="open-choice-sheet"
              @click="sheet = true"
            >
              {{ myRank ? 'Changer de place' : 'Ajouter à mes choix' }}
            </v-btn>
          </template>
          <v-switch
            v-if="session.user.isAdmin && isCurrent && base.proposed"
            :model-value="base.selected"
            :loading="selecting"
            :label="xs ? 'Sélectionné' : 'Sélectionné pour la répartition'"
            class="flex-grow-0 mr-2"
            hide-details
            @update:model-value="toggleSelected"
          />
          <v-spacer />
          <v-btn
            v-if="session.user.isStudent"
            icon="mdi-file-pdf-box"
            variant="text"
            :loading="exporting"
            aria-label="Exporter en PDF"
            title="Exporter en PDF"
            @click="exportPdf"
          />
          <v-btn v-else variant="text" prepend-icon="mdi-file-pdf-box" :loading="exporting" @click="exportPdf">
            {{ xs ? 'PDF' : 'Exporter en PDF' }}
          </v-btn>
          <v-btn v-if="canDuplicate && existingCopy" variant="outlined" prepend-icon="mdi-check" :to="copyLink" data-testid="already-duplicated">
            Déjà repris pour {{ session.currentYear }}
          </v-btn>
          <v-btn v-else-if="canDuplicate" variant="flat" color="primary" prepend-icon="mdi-content-copy" :loading="duplicating" @click="duplicate">
            Reprendre pour {{ session.currentYear }}
          </v-btn>
          <v-btn v-if="canEdit" variant="flat" color="primary" prepend-icon="mdi-pencil-outline" :to="`/edit-project/${projectId}`">
            Modifier
          </v-btn>
        </div>
      </div>

      <!-- Étudiant, grand écran : panneau de choix qui reste visible pendant la lecture -->
      <aside v-if="sideLayout" class="side-col" aria-label="Mes choix">
        <div class="side-panel surface-card">
          <PriorityPicker :project="base" orientation="vertical" :next="next" @next="go(next)" />
          <v-divider class="my-3" />
          <v-btn block variant="text" prepend-icon="mdi-file-pdf-box" :loading="exporting" @click="exportPdf">Exporter en PDF</v-btn>
        </div>
      </aside>
    </div>

    <!-- Étudiant, écran moyen ou téléphone : le même choix en liste verticale, depuis la barre du bas -->
    <v-bottom-sheet v-if="session.user.isStudent && base && !sideLayout" v-model="sheet" inset max-width="520">
      <v-card class="sheet-card">
        <div class="d-flex align-center mb-2">
          <span class="text-body-2 muted text-truncate">{{ base.title }}</span>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small" aria-label="Fermer" @click="sheet = false" />
        </div>
        <PriorityPicker :project="base" orientation="vertical" :next="next" @next="sheet = false; go(next)" />
      </v-card>
    </v-bottom-sheet>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import DomainBadges from '@/components/projects/DomainBadges.vue'
import PriorityPicker from '@/components/projects/PriorityPicker.vue'
import RankBadge from '@/components/projects/RankBadge.vue'
import { useAdminStore } from '@/stores/admin'
import { useNotifyStore } from '@/stores/notify'
import { usePreferencesStore } from '@/stores/preferences'
import { useProjectNavStore } from '@/stores/projectNav'
import { useProjectsStore } from '@/stores/projects'
import { useSessionStore } from '@/stores/session'
import { displayHtml, isEmptyHtml } from '@/utils/html'
import { initials } from '@/utils/text'

const props = defineProps({ id: { type: String, required: true } })

const session = useSessionStore()
const projects = useProjectsStore()
const admin = useAdminStore()
const prefs = usePreferencesStore()
const nav = useProjectNavStore()
const notify = useNotifyStore()
const router = useRouter()
const { xs, width } = useDisplay()

const projectId = computed(() => Number(props.id))
const full = ref(null)
const loading = ref(true)
const error = ref('')
const exporting = ref(false)
const duplicating = ref(false)
const selecting = ref(false)
const sheet = ref(false)

// Projet déjà en mémoire (listes, sans description) : affiché tout de suite, avec ses données à jour.
const listed = computed(() => {
  const id = projectId.value
  return (
    projects.all.find((p) => p.id === id) ||
    projects.owned.find((p) => p.id === id) ||
    admin.projectById.get(id) ||
    prefs.items.find((p) => p.id === id) ||
    null
  )
})
const base = computed(() => listed.value || full.value)
// Étudiant : rang de ce projet dans ses choix ; panneau latéral sur grand écran (≥ 1100 px).
const myRank = computed(() => (session.user.isStudent && base.value ? prefs.priorityOf(base.value.id) : null))
const sideLayout = computed(() => session.user.isStudent && !!base.value && width.value >= 1100)
const ownerInitials = computed(() => initials(base.value && base.value.owner))
const isCurrent = computed(() => !base.value || !base.value.year || base.value.year === session.currentYear)
const pastYear = computed(() => !isCurrent.value)
const isOwner = computed(() => base.value && session.user.isTeacher && base.value.owner_id === session.user.id)
// L'admin peut tout faire (comme côté serveur) ; le prof seulement sur ses projets, en phase de saisie.
const canManage = computed(() => session.user.isAdmin || (isOwner.value && session.canEditProjects))
const canEdit = computed(() => base.value && canManage.value && isCurrent.value)
const canDuplicate = computed(() => base.value && canManage.value && !isCurrent.value)
const description = computed(() => (full.value ? full.value.description : null))
const hasDescription = computed(() => !isEmptyHtml(description.value))
const safeHtml = computed(() => displayHtml(description.value))

// Copie déjà faite cette année (« Reprendre » déjà utilisé) : retrouvée par source_id.
const existingCopy = computed(() => {
  if (!base.value) return null
  const pool = [...projects.owned, ...admin.projects, ...(session.isCurrentYear ? projects.all : [])]
  return pool.find((p) => p.source_id === base.value.id && p.year === session.currentYear) || null
})
const copyLink = computed(() => existingCopy.value && copyTarget(existingCopy.value.id))

function copyTarget(id) {
  return session.canEditProjects ? `/edit-project/${id}` : `/project/${id}`
}

// Liste parcourue : celle d'où l'on vient, sinon (lien direct) le catalogue trié par titre.
const sequence = computed(() => {
  if (nav.items.some((p) => p.id === projectId.value)) return nav.items
  const collator = new Intl.Collator('fr', { sensitivity: 'base' })
  return [...projects.all].sort((a, b) => collator.compare(a.title, b.title)).map((p) => ({ id: p.id, title: p.title }))
})
const position = computed(() => {
  const index = sequence.value.findIndex((p) => p.id === projectId.value)
  return index === -1 || sequence.value.length < 2 ? null : { index, total: sequence.value.length }
})
const prev = computed(() => (position.value && position.value.index > 0 ? sequence.value[position.value.index - 1] : null))
const next = computed(() => (position.value ? sequence.value[position.value.index + 1] || null : null))

onMounted(async () => {
  window.addEventListener('keydown', onKey)
  try {
    full.value = await projects.fetchFull(projectId.value)
  } catch (e) {
    error.value = e.userMessage || 'Projet introuvable.'
  } finally {
    loading.value = false
  }
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

// Flèches gauche / droite du clavier : projet précédent / suivant (pas pendant une saisie).
function onKey(e) {
  if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.defaultPrevented) return
  const t = e.target
  if (t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return
  if (document.querySelector('.v-overlay--active:not(.v-snackbar)')) return
  if (e.key === 'ArrowLeft' && prev.value) go(prev.value)
  else if (e.key === 'ArrowRight' && next.value) go(next.value)
}

// « replace » : Retour ramène à la liste, pas au projet précédent.
function go(p) {
  router.replace({ name: 'project', params: { id: String(p.id) } })
}

function goBack() {
  const back = window.history.state && window.history.state.back
  if (back && back === nav.back) router.back()
  else router.push(nav.back || '/all-projects')
}

async function exportPdf() {
  // Le téléchargement ne doit pas laisser le bouton dans l'état « focus » (fond gris).
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  exporting.value = true
  try {
    await projects.exportPdf(base.value)
  } catch (e) {
    notify.error(e, 'Export PDF impossible')
  } finally {
    exporting.value = false
  }
}

async function duplicate() {
  duplicating.value = true
  try {
    const copy = await projects.duplicate(base.value.id)
    await router.push(`/edit-project/${copy.id}`)
    notify.success(`« ${copy.title} » a été ajouté au cours ${copy.year}. Vous pouvez le modifier.`, 'Projet repris')
  } catch (e) {
    const copyId = e.status === 409 && e.response.data && e.response.data.project_id
    if (copyId) {
      // Déjà repris (par exemple dans un autre onglet) : on ouvre la copie existante.
      await projects.fetchOwned().catch(() => {})
      await router.push(copyTarget(copyId))
      notify.info(e.userMessage)
    } else {
      notify.error(e, 'Impossible de reprendre le projet')
    }
  } finally {
    duplicating.value = false
  }
}

async function toggleSelected(value) {
  selecting.value = true
  try {
    await admin.setProjectSelected(base.value.id, !!value)
    if (full.value) full.value.selected = !!value
  } catch (e) {
    notify.error(e, 'La sélection n’a pas été modifiée')
  } finally {
    selecting.value = false
  }
}
</script>

<style scoped>
/* Étudiant, grand écran : colonne de lecture (~72 caractères) et panneau collant à droite */
.page--side > .side-layout { display: grid; grid-template-columns: minmax(0, 720px) 300px; column-gap: 32px; }
/* En-tête au-dessus ; la carte de choix commence à la hauteur de la carte de description */
.page--side .head-col { grid-column: 1; grid-row: 1; }
.page--side .body-col { grid-column: 1; grid-row: 2; }
.side-col { grid-column: 2; grid-row: 2; align-self: start; position: sticky; top: calc(var(--v-layout-top, 64px) + 16px); }
.side-panel { padding: 16px; }
.title-rank { vertical-align: middle; margin-left: 8px; position: relative; top: -3px; }
.sheet-card { padding: 12px 16px 20px; }
.top-nav { display: flex; align-items: center; gap: 4px; margin-bottom: 8px; }
.position { font-size: 0.85rem; color: var(--text-secondary); min-width: 52px; text-align: center; }
.detail-head { margin-bottom: 20px; }
.eyebrow { display: flex; align-items: center; font-size: 0.78rem; font-weight: 600; letter-spacing: 0.02em; color: var(--text-secondary); margin-bottom: 4px; }
.detail-title { font-size: 1.6rem; font-weight: 700; line-height: 1.25; letter-spacing: -0.02em; margin: 0 0 12px; }
.owner { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.owner-mail { text-decoration: none; color: var(--link); }
.owner-mail:hover { text-decoration: underline; }
.detail-body { padding: 24px 28px 32px; }
.lead { font-size: 1.05rem; line-height: 1.55; margin: 0; color: rgba(var(--v-theme-on-surface), 0.88); }
.neighbours { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px; }
.neighbour {
  display: flex; flex-direction: column; gap: 2px; min-width: 0; padding: 12px 16px;
  font: inherit; text-align: left; cursor: pointer; color: inherit;
  background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-border-color), 0.18); border-radius: var(--radius-control);
  transition: border-color 0.15s;
}
.neighbour:hover { border-color: rgba(var(--v-border-color), 0.4); }
.neighbour--next { text-align: right; align-items: flex-end; }
.neighbour-label { display: inline-flex; align-items: center; font-size: 0.8rem; color: var(--text-secondary); }
.neighbour-title { font-weight: 600; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.action-bar {
  /* Au-dessus de la barre de navigation du bas (téléphone) */
  position: sticky; bottom: var(--v-layout-bottom, 0px); z-index: 3; margin-top: 20px;
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 12px 16px;
  background: rgba(var(--v-theme-background), 0.94); backdrop-filter: blur(6px);
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
@media (max-width: 600px) {
  .detail-title { font-size: 1.3rem; }
  .detail-body { padding: 16px; }
  .neighbours { grid-template-columns: 1fr; }
  .neighbour--next { grid-row: 1; }
  .action-bar { padding: 10px 12px; }
}
</style>
