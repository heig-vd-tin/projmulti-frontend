<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>{{ heading }}</h1>
        <div class="subtitle">{{ subtitle }}</div>
      </div>
      <div class="d-flex align-center flex-wrap ga-2">
        <v-btn
          v-if="session.user.isTeacher && session.canEditProjects && session.isCurrentYear && (projects.all.length || loadingList)"
          color="primary"
          variant="flat"
          prepend-icon="mdi-plus"
          to="/new-project"
        >
          Nouveau projet
        </v-btn>
      </div>
    </header>

    <!-- Étudiant : avancement des choix -->
    <div v-if="session.user.isStudent" class="choices-summary surface-card mb-5">
      <div class="d-flex align-center ga-4 flex-wrap">
        <div class="slots" aria-hidden="true">
          <span v-for="(p, i) in prefs.slots" :key="i" class="slot-dot" :class="{ 'slot-dot--on': p }">{{ i + 1 }}</span>
        </div>
        <div class="min-w-0 flex-grow-1">
          <div class="font-weight-bold">
            {{ prefs.count === 0 ? 'Aucun choix pour le moment' : `${prefs.count} choix sur 5` }}
          </div>
          <div class="text-body-2 muted">
            Ouvrez un projet pour l'ajouter à vos choix et lui donner une priorité (1 = meilleur choix).
          </div>
        </div>
        <v-btn variant="tonal" color="primary" to="/my-projects" append-icon="mdi-arrow-right">Mes choix</v-btn>
      </div>
    </div>

    <v-alert
      v-if="session.user.isTeacher && !session.isCurrentYear"
      class="page-banner"
      type="info"
      variant="tonal"
      icon="mdi-archive-outline"
      density="comfortable"
    >
      Projets du cours {{ session.year }} (lecture seule). Pour reprendre un de vos projets cette année,
      ouvrez-le et cliquez sur « Reprendre pour {{ session.currentYear }} ».
    </v-alert>

    <!-- Filtres -->
    <div class="filters surface-card mb-5">
      <div class="filters-row">
        <v-text-field
          v-model="query"
          class="search"
          placeholder="Rechercher un projet, un responsable…"
          prepend-inner-icon="mdi-magnify"
          density="compact"
          hide-details
          clearable
          aria-label="Rechercher un projet"
        />
        <v-btn-toggle v-model="scope" mandatory density="compact" variant="outlined" divided class="scope-toggle" color="primary">
          <v-btn value="all">Tous</v-btn>
          <v-btn value="mine">{{ session.user.isStudent ? 'Mes choix' : 'Mes projets' }}</v-btn>
          <v-btn v-if="session.user.isAdmin" value="selected">Sélectionnés</v-btn>
        </v-btn-toggle>
        <v-select
          v-if="session.user.isTeacher"
          :model-value="session.year"
          :items="yearItems"
          :item-props="(item) => ({ subtitle: item.subtitle })"
          label="Cours"
          density="compact"
          hide-details
          class="year-select"
          :loading="projects.loading"
          @update:model-value="onYear"
        />
        <v-select
          v-model="sort"
          :items="sortItems"
          label="Trier par"
          density="compact"
          hide-details
          class="sort-select"
        />
      </div>
      <div class="domain-filter" role="group" aria-label="Filtrer par domaine">
        <span class="text-body-2 muted mr-1">Domaines</span>
        <button
          v-for="d in session.domains"
          :key="d.id"
          type="button"
          class="domain-toggle"
          :class="{ 'domain-toggle--on': selectedDomains.includes(d.id) }"
          :style="domainStyle(d)"
          :aria-pressed="selectedDomains.includes(d.id)"
          @click="toggleDomain(d.id)"
        >
          <v-icon :icon="d.icon" size="16" />{{ d.name }}
        </button>
        <v-btn v-if="filtersActive" variant="text" size="small" prepend-icon="mdi-filter-remove-outline" @click="resetFilters">
          Effacer les filtres
        </v-btn>
      </div>
    </div>

    <div class="d-flex align-center mb-3 text-body-2 muted" aria-live="polite">
      <template v-if="!loadingList && projects.all.length">{{ resultLabel }}</template>
    </div>

    <v-row v-if="loadingList" dense>
      <v-col v-for="n in 6" :key="n" cols="12" sm="6" lg="4">
        <div class="surface-card pa-2"><v-skeleton-loader type="article, chip" class="bg-transparent" /></div>
      </v-col>
    </v-row>

    <EmptyState
      v-else-if="!filtered.length"
      class="surface-card"
      :icon="filtersActive ? 'mdi-filter-off-outline' : 'mdi-folder-open-outline'"
      :title="filtersActive ? 'Aucun projet ne correspond à vos filtres' : 'Aucun projet pour le moment'"
      :text="emptyText"
    >
      <template #actions>
        <v-btn v-if="filtersActive" variant="tonal" @click="resetFilters">Effacer les filtres</v-btn>
        <v-btn
          v-else-if="session.user.isTeacher && session.canEditProjects && session.isCurrentYear"
          color="primary"
          variant="flat"
          prepend-icon="mdi-plus"
          to="/new-project"
        >
          Proposer un projet
        </v-btn>
      </template>
    </EmptyState>

    <v-row v-else>
      <v-col v-for="p in filtered" :key="p.id" cols="12" sm="6" lg="4" xxl="3">
        <ProjectCard :project="p" @open="openProject" />
      </v-col>
    </v-row>

    <ProjectDetailDialog :project-id="openId" :project="openProjectObj" @close="closeProject" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EmptyState from '@/components/common/EmptyState.vue'
import ProjectCard from '@/components/projects/ProjectCard.vue'
import ProjectDetailDialog from '@/components/projects/ProjectDetailDialog.vue'
import { useDark } from '@/composables/useDark'
import { useNotifyStore } from '@/stores/notify'
import { usePreferencesStore } from '@/stores/preferences'
import { useProjectsStore } from '@/stores/projects'
import { useSessionStore } from '@/stores/session'
import { domainColor } from '@/utils/palette'
import { matchesQuery, plural } from '@/utils/text'

const session = useSessionStore()
const projects = useProjectsStore()
const prefs = usePreferencesStore()
const notify = useNotifyStore()
const route = useRoute()
const router = useRouter()
const dark = useDark()

const query = ref('')
const scope = ref('all')
const selectedDomains = ref([])
const sort = ref('title')

const sortItems = [
  { title: 'Titre (A → Z)', value: 'title' },
  { title: 'Responsable', value: 'owner' },
  { title: 'Plus récents', value: 'recent' },
]

const yearItems = computed(() => session.years.map((y) => ({ title: `${y}`, value: y, subtitle: y === session.currentYear ? 'en cours' : 'archive, lecture seule' })))
const loadingList = computed(() => projects.loading && !projects.all.length)

const heading = computed(() => (session.user.isStudent ? 'Choisir mes projets' : `Projets du cours ${session.year || ''}`))
const subtitle = computed(() => {
  if (session.user.isStudent) return `Cours ${session.currentYear} · parcourez les projets proposés et choisissez-en 5.`
  if (!session.isCurrentYear) return 'Archive des projets proposés cette année-là.'
  return 'Projets proposés par les enseignantes et enseignants.'
})

const filtersActive = computed(() => !!query.value || selectedDomains.value.length > 0 || scope.value !== 'all')

const filtered = computed(() => {
  const me = session.user
  const list = projects.all.filter((p) => {
    if (selectedDomains.value.length && !p.domains.some((d) => selectedDomains.value.includes(d.id))) return false
    if (scope.value === 'mine') {
      if (me.isStudent && !prefs.priorityOf(p.id)) return false
      if (me.isTeacher && p.owner_id !== me.id) return false
    }
    if (scope.value === 'selected' && !p.selected) return false
    return matchesQuery(query.value, p.title, p.short_description, p.ownerName, ...p.domains.map((d) => d.name))
  })
  const collator = new Intl.Collator('fr', { sensitivity: 'base' })
  if (scope.value === 'mine' && me.isStudent) return list.sort((a, b) => prefs.priorityOf(a.id) - prefs.priorityOf(b.id))
  if (sort.value === 'owner') return list.sort((a, b) => collator.compare(a.owner?.lastname || '', b.owner?.lastname || '') || collator.compare(a.title, b.title))
  if (sort.value === 'recent') return list.sort((a, b) => b.id - a.id)
  return list.sort((a, b) => collator.compare(a.title, b.title))
})

const resultLabel = computed(() => {
  const n = filtered.value.length
  const total = projects.all.length
  return n === total ? plural(n, 'projet') : `${plural(n, 'projet')} sur ${total}`
})

const emptyText = computed(() => {
  if (filtersActive.value) return 'Modifiez la recherche ou retirez des filtres pour voir plus de projets.'
  if (session.user.isTeacher && session.isCurrentYear) return session.canEditProjects ? 'Soyez le premier à proposer un projet pour ce cours.' : 'Les projets du cours apparaîtront ici.'
  return 'Les projets proposés apparaîtront ici.'
})

const openId = computed(() => (route.query.p ? Number(route.query.p) : null))
const openProjectObj = computed(() => projects.all.find((p) => p.id === openId.value) || null)

function openProject(p) {
  router.push({ query: { ...route.query, p: p.id } })
}

function closeProject() {
  const { p: _p, ...rest } = route.query
  router.replace({ query: rest })
}

function toggleDomain(id) {
  const i = selectedDomains.value.indexOf(id)
  if (i === -1) selectedDomains.value.push(id)
  else selectedDomains.value.splice(i, 1)
}

function resetFilters() {
  query.value = ''
  selectedDomains.value = []
  scope.value = 'all'
}

function domainStyle(d) {
  const c = domainColor(d, dark.value)
  return { '--dc': c }
}

async function onYear(year) {
  try {
    await projects.changeYear(year)
  } catch (error) {
    notify.error(error, 'Chargement impossible')
  }
}
</script>

<style scoped>
.choices-summary { padding: 16px 20px; }
.slots { display: flex; gap: 6px; }
.slot-dot {
  width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center;
  font-size: 0.8rem; font-weight: 700;
  border: 1.5px dashed rgba(var(--v-border-color), 0.25); color: rgba(var(--v-theme-on-surface), 0.45);
}
.slot-dot--on { border: 1.5px solid rgba(var(--v-theme-primary), 0.35); background: rgba(var(--v-theme-primary), 0.1); color: rgb(var(--v-theme-primary)); }
.filters { padding: 14px 16px; display: flex; flex-direction: column; gap: 12px; }
.filters-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.search { flex: 1 1 280px; min-width: 220px; }
.year-select { flex: 0 0 140px; }
.sort-select { flex: 0 0 180px; }
.scope-toggle { height: 40px !important; }
.domain-filter { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.domain-toggle {
  display: inline-flex; align-items: center; gap: 6px;
  height: 32px; padding: 0 12px; border-radius: 999px;
  font: inherit; font-size: 0.85rem; font-weight: 550; cursor: pointer;
  color: rgba(var(--v-theme-on-surface), 0.8);
  background: transparent;
  border: 1px solid rgba(var(--v-border-color), 0.16);
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.domain-toggle .v-icon { color: var(--dc); }
.domain-toggle:hover { border-color: var(--dc); }
.domain-toggle--on {
  color: var(--dc); border-color: color-mix(in srgb, var(--dc) 45%, transparent);
  background: color-mix(in srgb, var(--dc) 11%, transparent);
}
@media (max-width: 600px) {
  /* Domaines sur une ligne défilante pour garder la liste visible sur téléphone */
  .domain-filter { flex-wrap: nowrap; overflow-x: auto; margin: 0 -16px; padding: 0 16px 4px; scrollbar-width: none; }
  .domain-toggle { flex: none; }
  .year-select, .sort-select { flex: 1 1 140px; }
  .scope-toggle { width: 100%; }
  .scope-toggle .v-btn { flex: 1; }
}
</style>
