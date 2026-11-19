<template>
  <div class="page">
    <!-- Téléphone, étudiant : avancement des choix en barre fine collante -->
    <router-link v-if="session.user.isStudent && xs" to="/my-projects" class="choices-mini" aria-label="Mes choix">
      <span class="mini-segs" aria-hidden="true">
        <span v-for="(p, i) in prefs.slots" :key="i" class="mini-seg" :class="{ 'mini-seg--on': p }"></span>
      </span>
      <span class="font-weight-bold">{{ prefs.count }}/5 choix</span>
      <v-spacer />
      <span class="mini-link">Mes choix <v-icon icon="mdi-chevron-right" size="16" /></span>
    </router-link>

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

    <!-- Étudiant (bureau) : avancement des choix -->
    <div v-if="session.user.isStudent && !xs" class="choices-summary surface-card mb-5">
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
        <v-btn variant="outlined" to="/my-projects" append-icon="mdi-arrow-right">Classer mes choix</v-btn>
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

    <!-- Aucun projet cette année : seulement le choix de l'année (archives), pas de filtres inutiles -->
    <div v-if="!showFilters && session.user.isTeacher && session.years.length > 1" class="d-flex justify-end mb-4">
      <v-select
        :model-value="session.year"
        :items="yearItems"
        :item-props="(item) => ({ subtitle: item.subtitle })"
        label="Cours"
        density="compact"
        hide-details
        class="year-select year-select--alone"
        @update:model-value="onYear"
      />
    </div>

    <!-- Filtres (masqués tant qu'il n'y a aucun projet) -->
    <div v-if="showFilters" class="filters surface-card mb-5">
      <div class="filters-row">
        <v-text-field
          v-model="query"
          class="search"
          :placeholder="xs ? 'Rechercher…' : 'Rechercher un projet, un responsable…'"
          prepend-inner-icon="mdi-magnify"
          density="compact"
          hide-details
          clearable
          aria-label="Rechercher un projet"
        />
        <v-btn
          v-if="xs"
          variant="outlined"
          :prepend-icon="filtersOpen ? 'mdi-chevron-up' : 'mdi-tune-variant'"
          :aria-expanded="filtersOpen"
          data-testid="toggle-filters"
          @click="filtersOpen = !filtersOpen"
        >
          Filtres{{ activeFilterCount ? ` (${activeFilterCount})` : '' }}
        </v-btn>
        <template v-if="!xs || filtersOpen">
          <v-btn-toggle v-model="scope" mandatory density="compact" variant="outlined" divided class="scope-toggle">
            <v-btn value="all">Tous</v-btn>
            <v-btn value="mine">{{ session.user.isStudent ? 'Dans mes choix' : 'Les miens' }}</v-btn>
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
          <v-select v-model="sort" :items="sortItems" label="Trier par" density="compact" hide-details class="sort-select" />
        </template>
      </div>
      <div v-if="!xs || filtersOpen" class="domain-filter-wrap">
        <div class="domain-filter" role="group" aria-label="Filtrer par domaine">
          <span class="text-body-2 muted mr-1 flex-none">Domaines</span>
          <button
            v-for="d in sortedDomains"
            :key="d.id"
            type="button"
            class="domain-toggle"
            :class="{ 'domain-toggle--on': selectedDomains.includes(d.id) }"
            :aria-pressed="selectedDomains.includes(d.id)"
            @click="toggleDomain(d.id)"
          >
            <v-icon :icon="selectedDomains.includes(d.id) ? 'mdi-check' : domainIcon(d)" :color="selectedDomains.includes(d.id) ? undefined : domainColor(d, dark)" size="16" />{{ d.name }}
          </button>
          <v-btn v-if="filtersActive" variant="text" size="small" prepend-icon="mdi-filter-remove-outline" class="flex-none" @click="resetFilters">
            Effacer les filtres
          </v-btn>
        </div>
      </div>
    </div>

    <div v-if="!loadingList && projects.all.length" class="d-flex align-center mb-3 text-body-2 muted" aria-live="polite">
      {{ resultLabel }}
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
        <v-btn v-if="filtersActive" variant="outlined" @click="resetFilters">Effacer les filtres</v-btn>
        <v-btn
          v-else-if="session.user.isTeacher && session.canEditProjects && session.isCurrentYear"
          color="primary"
          variant="flat"
          prepend-icon="mdi-plus"
          to="/new-project"
        >
          Nouveau projet
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
import { useDisplay } from 'vuetify'
import EmptyState from '@/components/common/EmptyState.vue'
import ProjectCard from '@/components/projects/ProjectCard.vue'
import ProjectDetailDialog from '@/components/projects/ProjectDetailDialog.vue'
import { useDark } from '@/composables/useDark'
import { useNotifyStore } from '@/stores/notify'
import { usePreferencesStore } from '@/stores/preferences'
import { useProjectsStore } from '@/stores/projects'
import { useSessionStore } from '@/stores/session'
import { domainColor, domainIcon, sortDomains } from '@/utils/palette'
import { matchesQuery, plural } from '@/utils/text'

const session = useSessionStore()
const projects = useProjectsStore()
const prefs = usePreferencesStore()
const notify = useNotifyStore()
const route = useRoute()
const router = useRouter()
const dark = useDark()
const { xs } = useDisplay()
const filtersOpen = ref(false)

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
const activeFilterCount = computed(() => selectedDomains.value.length + (scope.value !== 'all' ? 1 : 0))
const showFilters = computed(() => projects.all.length > 0 || filtersActive.value || loadingList.value)
const sortedDomains = computed(() => sortDomains(session.domains))

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
  if (session.user.isTeacher && session.isCurrentYear) return session.canEditProjects ? 'Proposez le premier projet de ce cours.' : 'Les projets du cours apparaîtront ici.'
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
  width: 30px; height: 30px; border-radius: var(--radius-control); display: grid; place-items: center;
  font-size: 0.8rem; font-weight: 700;
  border: 1.5px dashed rgba(var(--v-border-color), 0.3); color: var(--text-secondary);
}
.slot-dot--on { border: none; background: var(--sel); color: rgb(var(--v-theme-surface)); }
.choices-mini {
  position: sticky; top: 64px; z-index: 4; display: flex; align-items: center; gap: 10px;
  margin: -16px calc(-1 * var(--page-gutter)) 12px; padding: 8px var(--page-gutter);
  background: rgba(var(--v-theme-surface), 0.96); backdrop-filter: blur(6px);
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  color: inherit; text-decoration: none; font-size: 0.88rem;
}
.mini-segs { display: flex; gap: 3px; }
.mini-seg { width: 16px; height: 6px; border-radius: 3px; background: rgba(var(--v-border-color), 0.16); }
.mini-seg--on { background: var(--sel); }
.mini-link { display: inline-flex; align-items: center; color: var(--link); font-weight: 600; }
.filters { padding: 14px 16px; display: flex; flex-direction: column; gap: 12px; }
.filters-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.search { flex: 1 1 280px; min-width: 200px; }
.year-select { flex: 0 0 140px; }
.year-select--alone { flex: none; width: 160px; }
.sort-select { flex: 0 0 180px; }
.scope-toggle { height: 40px !important; }
.flex-none { flex: none; }
.domain-filter { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.domain-toggle {
  display: inline-flex; align-items: center; gap: 6px;
  height: 32px; padding: 0 12px; border-radius: 999px;
  font: inherit; font-size: 0.85rem; font-weight: 550; cursor: pointer;
  color: rgb(var(--v-theme-on-surface));
  background: transparent;
  border: 1px solid rgba(var(--v-border-color), 0.18);
  transition: background 0.15s, border-color 0.15s;
}
.domain-toggle:hover { border-color: rgba(var(--v-border-color), 0.4); }
/* Filtre actif : bord neutre foncé et coche (même code de sélection partout) */
.domain-toggle--on { border: 1.5px solid var(--sel); background: rgba(var(--v-theme-selected), 0.07); padding: 0 11.5px; }
@media (max-width: 600px) {
  /* Domaines sur une ligne défilante, avec un fondu qui signale la suite */
  .domain-filter-wrap { margin: 0 -16px; }
  .domain-filter {
    flex-wrap: nowrap; overflow-x: auto; padding: 0 16px 4px; scrollbar-width: none;
    mask-image: linear-gradient(to right, #000 calc(100% - 64px), transparent);
    -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 64px), transparent);
  }
  .domain-toggle { flex: none; }
  .search { flex: 1 1 160px; min-width: 0; }
  .year-select, .sort-select { flex: 1 1 140px; }
  .scope-toggle { width: 100%; }
  .scope-toggle .v-btn { flex: 1; }
}
</style>
