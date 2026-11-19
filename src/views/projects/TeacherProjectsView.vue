<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Mes projets</h1>
        <div class="subtitle">Vos projets de toutes les années, avec les étudiants qui y sont affectés.</div>
      </div>
      <v-btn v-if="session.canEditProjects" color="primary" variant="flat" prepend-icon="mdi-plus" to="/new-project">
        Nouveau projet
      </v-btn>
    </header>

    <div v-if="loading && !projects.owned.length" class="d-flex flex-column ga-3">
      <div v-for="n in 3" :key="n" class="surface-card pa-2"><v-skeleton-loader type="list-item-three-line" class="bg-transparent" /></div>
    </div>

    <EmptyState
      v-else-if="!projects.owned.length"
      class="surface-card"
      icon="mdi-folder-plus-outline"
      title="Vous n'avez pas encore proposé de projet"
      :text="session.canEditProjects ? 'Décrivez votre projet : titre, résumé court, domaines et description détaillée.' : 'La saisie des projets est fermée pour le moment.'"
    >
      <template v-if="session.canEditProjects" #actions>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" to="/new-project">Proposer un projet</v-btn>
      </template>
    </EmptyState>

    <section v-for="group in groups" :key="group.year" class="mb-8">
      <div class="year-head">
        <h2>Cours {{ group.year }}</h2>
        <span v-if="group.year === session.currentYear" class="year-tag year-tag--current">en cours</span>
        <span v-else class="year-tag">archive · lecture seule</span>
        <span class="muted text-body-2">{{ plural(group.items.length, 'projet') }}</span>
      </div>
      <div class="d-flex flex-column ga-3">
        <article v-for="p in group.items" :key="p.id" class="mine-card surface-card" data-testid="owned-project">
          <div class="mine-main min-w-0">
            <h3 class="mine-title">{{ p.title }}</h3>
            <p class="mine-short">{{ p.short_description }}</p>
            <DomainBadges :domains="p.domains" mode="chips" />
          </div>
          <div class="mine-side">
            <div class="text-caption font-weight-bold muted mb-1">Étudiants affectés</div>
            <ul v-if="p.assigned_users.length" class="students">
              <li v-for="u in p.assigned_users" :key="u.id">
                <span class="font-weight-medium">{{ u.firstname }} {{ u.lastname }}</span>
                <span v-if="u.orientation" class="ori">{{ u.orientation.acronym }}</span>
                <a v-if="u.email" :href="`mailto:${u.email}`" class="muted text-caption d-block text-truncate">{{ u.email }}</a>
              </li>
            </ul>
            <div v-else class="text-body-2 muted">Aucun pour le moment</div>
          </div>
          <div class="mine-actions">
            <v-btn variant="text" prepend-icon="mdi-eye-outline" @click="openId = p.id">Voir</v-btn>
            <v-btn variant="text" prepend-icon="mdi-file-pdf-box" :loading="exporting === p.id" @click="exportPdf(p)">PDF</v-btn>
            <v-btn
              v-if="p.year === session.currentYear && session.canEditProjects"
              variant="tonal"
              color="primary"
              prepend-icon="mdi-pencil-outline"
              :to="`/edit-project/${p.id}`"
            >
              Modifier
            </v-btn>
            <v-btn
              v-if="p.year !== session.currentYear && session.canEditProjects"
              variant="tonal"
              color="primary"
              prepend-icon="mdi-content-copy"
              :loading="duplicating === p.id"
              @click="duplicate(p)"
            >
              Reprendre pour {{ session.currentYear }}
            </v-btn>
          </div>
        </article>
      </div>
    </section>

    <ProjectDetailDialog :project-id="openId" :project="openProject" @close="openId = null" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import EmptyState from '@/components/common/EmptyState.vue'
import DomainBadges from '@/components/projects/DomainBadges.vue'
import ProjectDetailDialog from '@/components/projects/ProjectDetailDialog.vue'
import { useNotifyStore } from '@/stores/notify'
import { useProjectsStore } from '@/stores/projects'
import { useSessionStore } from '@/stores/session'
import { plural } from '@/utils/text'

const session = useSessionStore()
const projects = useProjectsStore()
const notify = useNotifyStore()
const router = useRouter()

const loading = ref(false)
const openId = ref(null)
const exporting = ref(null)
const duplicating = ref(null)

const openProject = computed(() => projects.owned.find((p) => p.id === openId.value) || null)
const groups = computed(() => {
  const byYear = new Map()
  for (const p of projects.owned) {
    const y = p.year || session.currentYear
    if (!byYear.has(y)) byYear.set(y, [])
    byYear.get(y).push(p)
  }
  return [...byYear.entries()].sort((a, b) => b[0] - a[0]).map(([year, items]) => ({ year, items }))
})

onMounted(async () => {
  loading.value = true
  try {
    await projects.fetchOwned()
  } catch (error) {
    notify.error(error, 'Chargement impossible')
  } finally {
    loading.value = false
  }
})

async function exportPdf(p) {
  exporting.value = p.id
  try {
    await projects.exportPdf(p)
  } catch (error) {
    notify.error(error, 'Export PDF impossible')
  } finally {
    exporting.value = null
  }
}

async function duplicate(p) {
  duplicating.value = p.id
  try {
    const copy = await projects.duplicate(p.id)
    notify.success(`« ${copy.title} » a été ajouté au cours ${copy.year}. Vous pouvez le modifier.`, 'Projet repris')
    router.push(`/edit-project/${copy.id}`)
  } catch (error) {
    notify.error(error, 'Impossible de reprendre le projet')
  } finally {
    duplicating.value = null
  }
}
</script>

<style scoped>
.year-head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.year-head h2 { font-size: 1.1rem; font-weight: 700; margin: 0; }
.year-tag { font-size: 0.75rem; font-weight: 600; padding: 2px 10px; border-radius: 999px; background: rgb(var(--v-theme-surface-light)); color: rgba(var(--v-theme-on-surface), 0.7); }
.year-tag--current { background: rgba(var(--v-theme-success), 0.1); color: rgb(var(--v-theme-success)); }
.mine-card { display: grid; grid-template-columns: minmax(0, 1fr) 260px; grid-template-areas: 'main side' 'actions actions'; gap: 12px 24px; padding: 18px 20px 12px; }
.mine-main { grid-area: main; }
.mine-side { grid-area: side; }
.mine-actions { grid-area: actions; display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); padding-top: 10px; }
.mine-title { font-size: 1.05rem; font-weight: 650; margin: 0 0 4px; }
.mine-short { margin: 0 0 12px; color: rgba(var(--v-theme-on-surface), 0.82); }
.students { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; font-size: 0.9rem; }
.ori { margin-left: 6px; font-size: 0.72rem; font-weight: 600; padding: 1px 6px; border-radius: 6px; background: rgb(var(--v-theme-surface-light)); }
@media (max-width: 760px) {
  .mine-card { grid-template-columns: 1fr; grid-template-areas: 'main' 'side' 'actions'; }
}
</style>
