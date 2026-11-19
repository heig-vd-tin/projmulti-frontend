<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Statistiques</h1>
        <div class="subtitle">Cours {{ session.currentYear }} · état actuel des projets, des choix et de la répartition.</div>
      </div>
      <v-btn variant="text" prepend-icon="mdi-refresh" :loading="loading" @click="load">Actualiser</v-btn>
    </header>

    <div class="tiles mb-6">
      <div v-for="t in tiles" :key="t.label" class="tile surface-card">
        <div class="tile-label">{{ t.label }}</div>
        <div class="tile-value tabular">{{ t.value }}<span v-if="t.of !== undefined" class="tile-of"> / {{ t.of }}</span></div>
        <div v-if="t.hint" class="tile-hint">{{ t.hint }}</div>
      </div>
    </div>

    <v-row>
      <v-col cols="12" md="6">
        <section class="surface-card pa-5 h-100">
          <h2 class="section-title">Rang obtenu par les étudiants affectés</h2>
          <p class="section-hint">
            Rang du projet affecté dans les choix de l'étudiant.
            <template v-if="meanRank">Rang moyen : <strong>{{ meanRank }}</strong>.</template>
          </p>
          <BarList :items="rankItems" :total="assigned.length" label="Rang obtenu" />
        </section>
      </v-col>
      <v-col cols="12" md="6">
        <section class="surface-card pa-5 h-100">
          <h2 class="section-title">Étudiants par orientation</h2>
          <p class="section-hint">Étudiants inscrits sur la plateforme (exclus compris).</p>
          <BarList :items="orientationItems" :total="admin.students.length" label="Étudiants par orientation" />
        </section>
      </v-col>
      <v-col cols="12">
        <section class="surface-card pa-5">
          <h2 class="section-title">Besoins par domaine</h2>
          <p class="section-hint">Un étudiant par domaine demandé et par projet ; étudiants dont l'orientation couvre le domaine (correspondance des réglages).</p>
          <div class="table-wrap">
            <table class="stats-table">
              <thead>
                <tr>
                  <th class="text-left">Domaine</th>
                  <th>Projets sélectionnés qui le demandent</th>
                  <th>Tous les projets</th>
                  <th>Étudiants (base)</th>
                  <th>Étudiants (en élargissant)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in domainRows" :key="row.id">
                  <th class="text-left">
                    <span class="d-inline-flex align-center ga-2">
                      <v-icon :icon="row.icon" :color="domainColor(row.id, dark)" size="18" />{{ row.name }}
                    </span>
                  </th>
                  <td class="tabular">{{ row.selected }}</td>
                  <td class="tabular">{{ row.all }}</td>
                  <td class="tabular">{{ row.base }}</td>
                  <td class="tabular">{{ row.enlarged }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import BarList from '@/components/common/BarList.vue'
import { useDark } from '@/composables/useDark'
import { useAdminStore } from '@/stores/admin'
import { useNotifyStore } from '@/stores/notify'
import { useSessionStore } from '@/stores/session'
import { domainColor } from '@/utils/palette'

const session = useSessionStore()
const admin = useAdminStore()
const notify = useNotifyStore()
const dark = useDark()
const loading = ref(false)

const active = computed(() => admin.students.filter((s) => !s.excluded))
const assigned = computed(() => active.value.filter((s) => s.assignedProjectId))
const teachersWithProjects = computed(() => new Set(admin.projects.map((p) => p.owner_id)).size)

const tiles = computed(() => [
  { label: 'Projets proposés', value: admin.projects.length },
  { label: 'Projets sélectionnés', value: admin.projects.filter((p) => p.selected).length, of: admin.projects.length },
  { label: 'Enseignants', value: teachersWithProjects.value, hint: `avec un projet · ${admin.teachers.length} au total` },
  { label: 'Étudiants inscrits', value: admin.students.length, hint: `${admin.students.filter((s) => s.preferences.length >= 5).length} avec 5 choix` },
  { label: 'Étudiants affectés', value: assigned.value.length, of: active.value.length },
  { label: 'Exclus', value: admin.students.filter((s) => s.excluded).length },
])

const rankItems = computed(() => {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, out: 0 }
  for (const s of assigned.value) {
    const r = s.rankOf(s.assignedProjectId)
    counts[r || 'out'] += 1
  }
  return [1, 2, 3, 4, 5].map((r) => ({ label: `Choix ${r}`, value: counts[r] })).concat([{ label: 'Hors choix', value: counts.out }])
})

const meanRank = computed(() => {
  const ranks = assigned.value.map((s) => s.rankOf(s.assignedProjectId)).filter(Boolean)
  return ranks.length ? (ranks.reduce((a, b) => a + b, 0) / ranks.length).toFixed(2).replace('.', ',') : ''
})

const orientationItems = computed(() =>
  session.orientations
    .map((o) => ({ label: o.acronym, value: admin.students.filter((s) => s.orientation_id === o.id).length, hint: o.name }))
    .filter((i) => i.value > 0)
    .sort((a, b) => b.value - a.value),
)

const domainRows = computed(() =>
  session.domains.map((d) => {
    const m = admin.mapping.find((r) => r.domain_id === d.id) || { base: [], enlarged: [] }
    return {
      id: d.id,
      name: d.name,
      icon: d.icon,
      selected: admin.projects.filter((p) => p.selected && p.domains.some((x) => x.id === d.id)).length,
      all: admin.projects.filter((p) => p.domains.some((x) => x.id === d.id)).length,
      base: active.value.filter((s) => m.base.includes(s.orientation_id)).length,
      enlarged: active.value.filter((s) => m.base.includes(s.orientation_id) || m.enlarged.includes(s.orientation_id)).length,
    }
  }),
)

async function load() {
  loading.value = true
  try {
    await Promise.all([admin.refresh(), admin.fetchUsers(), admin.fetchMapping()])
  } catch (error) {
    notify.error(error, 'Chargement impossible')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; }
.tile { padding: 16px 18px; }
.tile-label { font-size: 0.82rem; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.66); }
.tile-value { font-size: 1.9rem; font-weight: 700; letter-spacing: -0.02em; line-height: 1.2; margin-top: 4px; }
.tile-of { font-size: 1rem; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.5); }
.tile-hint { font-size: 0.78rem; color: rgba(var(--v-theme-on-surface), 0.6); margin-top: 2px; }
.section-title { font-size: 1.05rem; font-weight: 700; margin: 0 0 2px; }
.section-hint { margin: 0 0 16px; color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity)); font-size: 0.9rem; }
.table-wrap { overflow-x: auto; }
.stats-table { width: 100%; border-collapse: collapse; min-width: 620px; }
.stats-table th, .stats-table td { padding: 10px 12px; border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); text-align: right; }
.stats-table thead th { font-size: 0.78rem; font-weight: 700; color: rgba(var(--v-theme-on-surface), 0.66); }
.stats-table tbody th { font-weight: 600; }
.stats-table tr:last-child th, .stats-table tr:last-child td { border-bottom: none; }
</style>
