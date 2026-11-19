<template>
  <div>
    <div class="legend text-body-2 mb-3">
      <span class="legend-item"><span class="cell-pill cell-pill--base">Base</span> l'orientation couvre le domaine</span>
      <span class="legend-item"><span class="cell-pill cell-pill--enlarged">Élargi</span> seulement en élargissant</span>
      <span class="legend-item"><span class="cell-pill cell-pill--none">—</span> non</span>
      <span class="muted">Cliquez sur une case pour changer.</span>
    </div>

    <v-skeleton-loader v-if="loading" type="table" class="bg-transparent" />
    <v-alert v-else-if="loadError" type="error" variant="tonal">{{ loadError }}</v-alert>
    <div v-else class="table-wrap">
      <table class="mapping" aria-label="Correspondance domaines et orientations">
        <thead>
          <tr>
            <th scope="col" class="text-left">Domaine</th>
            <th
              v-for="o in columns"
              :key="o.id"
              scope="col"
              :class="{ 'col-dim': !isActive(o) }"
              :title="isActive(o) ? o.name : `${o.name} (ne participe pas cette année)`"
            >
              {{ o.acronym }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.domain_id">
            <th scope="row" class="text-left">
              <span class="d-inline-flex align-center ga-2">
                <v-icon :icon="domainIconOf(row.domain_id)" :color="domainColor(row.domain_id, dark)" size="18" />
                {{ row.name }}
              </span>
            </th>
            <td v-for="o in columns" :key="o.id" :class="{ 'col-dim': !isActive(o) }">
              <button
                type="button"
                class="cell-pill"
                :class="`cell-pill--${cellState(row, o.id) || 'none'}`"
                :aria-label="`${row.name} – ${o.acronym} : ${stateLabel(cellState(row, o.id))}. Changer.`"
                :data-testid="`map-${row.domain_id}-${o.acronym}`"
                @click="cycle(row, o.id)"
              >
                {{ cellText(cellState(row, o.id)) }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="d-flex align-center flex-wrap ga-2 mt-4">
      <span class="text-body-2 muted">Utilisé par le calcul de la répartition et par le tableau (couverture des domaines).</span>
      <v-spacer />
      <v-btn variant="text" :disabled="!dirty || saving" @click="reset">Annuler les modifications</v-btn>
      <v-btn color="primary" variant="flat" :disabled="!dirty" :loading="saving" data-testid="save-mapping" @click="save">
        Enregistrer la correspondance
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useDark } from '@/composables/useDark'
import { useAdminStore } from '@/stores/admin'
import { useNotifyStore } from '@/stores/notify'
import { useSessionStore } from '@/stores/session'
import { ACTIVE_ORIENTATIONS, domainColor } from '@/utils/palette'

const admin = useAdminStore()
const session = useSessionStore()
const notify = useNotifyStore()
const dark = useDark()

const rows = ref([])
const loading = ref(false)
const loadError = ref('')
const saving = ref(false)

const isActive = (o) => ACTIVE_ORIENTATIONS.includes(o.acronym)
// Orientations qui participent d'abord, les autres atténuées à la fin.
const columns = computed(() =>
  session.orientations.slice().sort((a, b) => Number(isActive(b)) - Number(isActive(a)) || a.acronym.localeCompare(b.acronym)),
)

function domainIconOf(id) {
  const d = session.domains.find((x) => x.id === id)
  return d ? d.icon : 'mdi-shape-outline'
}

function fromStore() {
  rows.value = admin.mapping.map((r) => ({ domain_id: r.domain_id, name: r.name, base: [...r.base], enlarged: [...r.enlarged] }))
}

const dirty = computed(() => {
  const norm = (list) => JSON.stringify(list.map((r) => [r.domain_id, [...r.base].sort(), [...r.enlarged].sort()]))
  return norm(rows.value) !== norm(admin.mapping)
})

function cellState(row, oid) {
  if (row.base.includes(oid)) return 'base'
  if (row.enlarged.includes(oid)) return 'enlarged'
  return null
}

function stateLabel(s) {
  return { base: 'couvert (base)', enlarged: 'couvert en élargissant' }[s] || 'non couvert'
}

function cellText(s) {
  return { base: 'Base', enlarged: 'Élargi' }[s] || '—'
}

// Cycle : non → base → élargi → non.
function cycle(row, oid) {
  const s = cellState(row, oid)
  row.base = row.base.filter((x) => x !== oid)
  row.enlarged = row.enlarged.filter((x) => x !== oid)
  if (!s) row.base.push(oid)
  else if (s === 'base') row.enlarged.push(oid)
}

function reset() {
  fromStore()
}

async function save() {
  saving.value = true
  try {
    await admin.saveMapping(rows.value)
    fromStore()
    notify.success('La correspondance domaines → orientations est enregistrée.')
  } catch (error) {
    notify.error(error, "La correspondance n'a pas été enregistrée")
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await admin.fetchMapping()
    fromStore()
  } catch (error) {
    loadError.value = error.userMessage
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.legend { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 18px; }
.legend-item { display: inline-flex; align-items: center; gap: 6px; }
.table-wrap { overflow-x: auto; }
.mapping { border-collapse: separate; border-spacing: 0; width: 100%; min-width: 640px; }
.mapping th, .mapping td { padding: 6px; text-align: center; border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.mapping thead th { font-size: 0.8rem; font-weight: 700; letter-spacing: 0.03em; color: rgba(var(--v-theme-on-surface), 0.75); }
.mapping tbody th { font-weight: 600; white-space: nowrap; padding-right: 16px; }
.mapping tr:last-child th, .mapping tr:last-child td { border-bottom: none; }
.col-dim { opacity: 0.45; }
.cell-pill {
  min-width: 64px; height: 30px; padding: 0 10px; border-radius: 8px;
  font: inherit; font-size: 0.8rem; font-weight: 600; cursor: pointer;
  border: 1px solid transparent; transition: background 0.15s, border-color 0.15s;
  display: inline-flex; align-items: center; justify-content: center;
}
.legend .cell-pill { min-width: 0; height: 24px; cursor: default; }
.cell-pill--base { background: rgba(var(--v-theme-primary), 0.09); color: rgb(var(--v-theme-primary)); border-color: rgba(var(--v-theme-primary), 0.25); }
.cell-pill--enlarged { background: transparent; color: rgb(var(--v-theme-info)); border: 1px dashed rgba(var(--v-theme-info), 0.6); }
.cell-pill--none { background: transparent; color: rgba(var(--v-theme-on-surface), 0.35); border-color: rgba(var(--v-border-color), 0.1); }
button.cell-pill:hover { border-color: rgba(var(--v-theme-on-surface), 0.35); }
</style>
