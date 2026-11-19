<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Sélection des projets</h1>
        <div class="subtitle">
          Cours {{ session.currentYear }} · {{ plural(selectedCount, 'projet sélectionné', 'projets sélectionnés') }} sur {{ admin.projects.length }}.
          Les projets sélectionnés sont ouverts dans la répartition.
        </div>
      </div>
      <v-select v-model="sort" :items="sortItems" label="Trier par" density="compact" hide-details style="max-width: 240px" />
    </header>

    <div class="layout">
      <aside class="teachers surface-card" aria-label="Enseignants">
        <div class="teachers-head">
          <span class="font-weight-bold">Enseignants</span>
          <span v-if="withoutSelection" class="text-caption warn-tag">{{ withoutSelection }} sans projet sélectionné</span>
        </div>
        <v-list density="compact" nav class="py-1">
          <v-list-item :active="ownerFilter === null" color="primary" title="Tous les enseignants" @click="ownerFilter = null" />
          <v-list-item
            v-for="t in teacherRows"
            :key="t.id"
            :active="ownerFilter === t.id"
            color="primary"
            @click="ownerFilter = ownerFilter === t.id ? null : t.id"
          >
            <v-list-item-title class="text-body-2 font-weight-medium">{{ t.name }}</v-list-item-title>
            <template #append>
              <span class="count" :class="{ 'count--warn': t.proposed && !t.selected, 'count--none': !t.proposed }">
                {{ t.selected }}/{{ t.proposed }}
              </span>
            </template>
          </v-list-item>
        </v-list>
        <div class="text-caption muted px-4 pb-3">Sélectionnés / proposés cette année</div>
      </aside>

      <div class="min-w-0">
        <v-row v-if="!admin.projects.length && loading">
          <v-col v-for="n in 6" :key="n" cols="12" md="6" xl="4"><div class="surface-card pa-2"><v-skeleton-loader type="article" class="bg-transparent" /></div></v-col>
        </v-row>
        <EmptyState v-else-if="!visible.length" class="surface-card" title="Aucun projet" text="Aucun projet proposé pour ce cours ou cet enseignant." />
        <v-row v-else>
          <v-col v-for="p in visible" :key="p.id" cols="12" md="6" xl="4">
            <article class="sel-card" :class="{ 'sel-card--on': p.selected }" data-testid="selection-card">
              <div class="d-flex align-start ga-2">
                <button type="button" class="sel-title text-left" @click="openId = p.id">{{ p.title }}</button>
                <v-spacer />
                <v-icon v-if="p.isLocked" icon="mdi-lock-outline" size="18" class="muted" aria-label="Verrouillé" />
              </div>
              <div class="text-body-2 muted mb-2">{{ p.ownerName }} · #{{ p.id }}</div>
              <DomainBadges :domains="p.domains" size="small" />
              <div class="stats">
                <div class="stat" title="Étudiants qui ont choisi ce projet en priorité 1 à 3 / au total">
                  <span class="stat-value tabular">{{ p.preferredCount(3) }} <span class="muted">/ {{ p.preferredCount(5) }}</span></span>
                  <span class="stat-label">choix (1-3 / total)</span>
                </div>
                <div class="stat" title="Choix dont l'orientation correspond à un domaine du projet (ancien algorithme : correspondances)">
                  <span class="stat-value tabular">{{ p.matchedCount(3) }} <span class="muted">/ {{ p.matchedCount(5) }}</span></span>
                  <span class="stat-label">correspondances</span>
                </div>
              </div>
              <div class="d-flex align-center">
                <v-switch
                  :model-value="p.selected"
                  :loading="busy === p.id"
                  :label="p.selected ? 'Sélectionné' : 'Non sélectionné'"
                  :aria-label="`Sélectionner le projet ${p.title}`"
                  @update:model-value="(v) => toggle(p, v)"
                />
                <v-spacer />
                <v-btn variant="text" size="small" prepend-icon="mdi-eye-outline" @click="openId = p.id">Détail</v-btn>
              </div>
            </article>
          </v-col>
        </v-row>
      </div>
    </div>

    <ProjectDetailDialog :project-id="openId" :project="openProject" @close="openId = null" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import EmptyState from '@/components/common/EmptyState.vue'
import DomainBadges from '@/components/projects/DomainBadges.vue'
import ProjectDetailDialog from '@/components/projects/ProjectDetailDialog.vue'
import { useAdminStore } from '@/stores/admin'
import { useNotifyStore } from '@/stores/notify'
import { useSessionStore } from '@/stores/session'
import { plural } from '@/utils/text'

const session = useSessionStore()
const admin = useAdminStore()
const notify = useNotifyStore()

const loading = ref(false)
const busy = ref(null)
const ownerFilter = ref(null)
const openId = ref(null)
const sort = ref('popular')
const sortItems = [
  { title: 'Les plus choisis', value: 'popular' },
  { title: 'Titre', value: 'title' },
  { title: 'Enseignant', value: 'owner' },
]

const collator = new Intl.Collator('fr', { sensitivity: 'base' })
const selectedCount = computed(() => admin.projects.filter((p) => p.selected).length)
const openProject = computed(() => admin.projectById.get(openId.value) || null)

const teacherRows = computed(() => {
  const rows = admin.teachers.map((t) => {
    const own = admin.projects.filter((p) => p.owner_id === t.id)
    return { id: t.id, name: `${t.lastname} ${t.firstname}`.trim(), proposed: own.length, selected: own.filter((p) => p.selected).length }
  })
  return rows.sort((a, b) => Number(b.proposed > 0) - Number(a.proposed > 0) || collator.compare(a.name, b.name))
})
const withoutSelection = computed(() => teacherRows.value.filter((t) => t.proposed && !t.selected).length)

const visible = computed(() => {
  const list = admin.projects.filter((p) => ownerFilter.value === null || p.owner_id === ownerFilter.value)
  if (sort.value === 'title') return list.sort((a, b) => collator.compare(a.title, b.title))
  if (sort.value === 'owner') return list.sort((a, b) => collator.compare(a.owner?.lastname || '', b.owner?.lastname || ''))
  return list.sort((a, b) => b.preferredCount(5) - a.preferredCount(5) || b.preferredCount(3) - a.preferredCount(3))
})

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([admin.fetchProjects(), admin.users.length ? null : admin.fetchUsers()])
  } catch (error) {
    notify.error(error, 'Chargement impossible')
  } finally {
    loading.value = false
  }
})

async function toggle(p, value) {
  busy.value = p.id
  try {
    await admin.setProjectSelected(p.id, !!value)
  } catch (error) {
    notify.error(error, "La sélection n'a pas été modifiée")
  } finally {
    busy.value = null
  }
}
</script>

<style scoped>
.layout { display: grid; grid-template-columns: 280px minmax(0, 1fr); gap: 20px; align-items: start; }
.teachers { position: sticky; top: 80px; max-height: calc(100vh - 100px); overflow-y: auto; }
.teachers-head { display: flex; flex-direction: column; gap: 4px; padding: 14px 16px 6px; }
.warn-tag { color: rgb(var(--v-theme-warning)); font-weight: 600; }
.count { font-size: 0.78rem; font-weight: 700; padding: 1px 8px; border-radius: 999px; background: rgb(var(--v-theme-surface-light)); }
.count--warn { background: rgba(var(--v-theme-warning), 0.12); color: rgb(var(--v-theme-warning)); }
.count--none { opacity: 0.5; }
.sel-card {
  height: 100%; display: flex; flex-direction: column; gap: 4px; padding: 16px 18px 8px;
  background: rgb(var(--v-theme-surface)); border-radius: 14px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.sel-card--on { border-color: rgba(var(--v-theme-primary), 0.4); }
.sel-title { font: inherit; font-weight: 650; font-size: 1rem; color: inherit; background: none; border: none; padding: 0; cursor: pointer; }
.sel-title:hover { text-decoration: underline; }
.stats { display: flex; gap: 24px; margin: 12px 0 4px; }
.stat { display: flex; flex-direction: column; }
.stat-value { font-size: 1.15rem; font-weight: 700; }
.stat-label { font-size: 0.75rem; color: rgba(var(--v-theme-on-surface), 0.6); }
@media (max-width: 960px) {
  .layout { grid-template-columns: 1fr; }
  .teachers { position: static; max-height: 320px; }
}
</style>
