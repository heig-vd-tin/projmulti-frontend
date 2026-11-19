<template>
  <div class="page page--wide board-page">
    <header class="page-header mb-4">
      <div>
        <h1>Répartition des étudiants</h1>
        <div class="subtitle">Cours {{ session.currentYear }} · glissez-déposez les étudiants entre les projets ; cliquez sur un étudiant pour voir ses choix.</div>
      </div>
      <div class="d-flex align-center flex-wrap ga-2">
        <v-btn color="primary" variant="flat" prepend-icon="mdi-auto-fix" data-testid="open-solve" @click="openSolve">Calculer la répartition</v-btn>

        <v-menu location="bottom end">
          <template #activator="{ props: p }">
            <v-btn v-bind="p" variant="outlined" prepend-icon="mdi-folder-outline" append-icon="mdi-chevron-down" data-testid="file-menu">Fichier</v-btn>
          </template>
          <v-list density="compact" nav min-width="300">
            <v-list-item prepend-icon="mdi-content-save-outline" title="Sauvegarder la répartition (.prjmult)" @click="saveDialog = true" />
            <v-list-item prepend-icon="mdi-folder-open-outline" title="Charger une répartition (.prjmult)" @click="fileInput.click()" />
            <v-divider class="my-1" />
            <v-list-item prepend-icon="mdi-file-delimited-outline" title="Exporter la répartition (CSV)" data-testid="export-assignment" @click="exportAssignment" />
            <v-list-item prepend-icon="mdi-account-multiple-outline" title="Exporter les étudiants inscrits (CSV)" data-testid="export-students" @click="exportStudents" />
          </v-list>
        </v-menu>

        <v-menu location="bottom end">
          <template #activator="{ props: p }">
            <v-btn v-bind="p" variant="outlined" prepend-icon="mdi-history" append-icon="mdi-chevron-down">Ancien algorithme</v-btn>
          </template>
          <v-list density="compact" nav min-width="300">
            <v-list-item v-for="(a, key) in LEGACY_ACTIONS" :key="key" :prepend-icon="a.icon" :title="a.title" @click="runLegacy(key)" />
          </v-list>
        </v-menu>

        <v-menu location="bottom end" :close-on-content-click="false">
          <template #activator="{ props: p }">
            <v-btn v-bind="p" variant="outlined" prepend-icon="mdi-tune-variant" append-icon="mdi-chevron-down">Affichage</v-btn>
          </template>
          <v-card min-width="300" class="pa-3" border>
            <v-switch v-model="showName" label="Afficher les noms" data-testid="toggle-names" />
            <v-switch v-model="showAllProjects" label="Afficher les projets non sélectionnés" class="mt-2" />
            <v-select v-model="projectSort" :items="projectSortItems" label="Ordre des projets" density="compact" hide-details class="mt-4" />
          </v-card>
        </v-menu>

        <v-btn icon variant="text" aria-label="Aide du tableau de répartition" @click="helpDialog = true">
          <v-icon icon="mdi-help-circle-outline" />
          <v-tooltip activator="parent">Aide et légende</v-tooltip>
        </v-btn>
        <input ref="fileInput" type="file" accept=".prjmult,application/json,text/plain" class="d-none" data-testid="load-file" @change="readFile" />
      </div>
    </header>

    <!-- Indicateurs en direct -->
    <div class="live surface-card mb-4" aria-label="Indicateurs de la répartition actuelle">
      <div class="live-item"><span class="live-value tabular">{{ assignedStudents.length }}<span class="live-of">/{{ activeStudents.length }}</span></span><span class="live-label">affectés</span></div>
      <div class="live-item"><span class="live-value tabular" :class="{ 'text-warning': unassigned.length }">{{ unassigned.length }}</span><span class="live-label">non affectés</span></div>
      <div class="live-item"><span class="live-value tabular">{{ excluded.length }}</span><span class="live-label">exclus</span></div>
      <div class="live-item"><span class="live-value tabular" :class="{ 'text-error': outOfChoice.length }">{{ outOfChoice.length }}</span><span class="live-label">hors choix</span></div>
      <div class="live-item"><span class="live-value tabular">{{ meanRank }}</span><span class="live-label">rang moyen</span></div>
      <div class="live-item"><span class="live-value tabular" :class="{ 'text-warning': badSizes }">{{ badSizes }}</span><span class="live-label">groupes hors taille</span></div>
      <div class="live-ranks" aria-label="Rangs obtenus">
        <span v-for="r in rankCounts" :key="r.key" class="rank-cell" :title="r.label">
          <span class="rank-badge" :class="`rank--${r.tone}`">{{ r.short }}</span><span class="tabular">{{ r.value }}</span>
        </span>
      </div>
    </div>

    <SolveSummary
      v-if="admin.lastSolve && showSolve"
      class="mb-4"
      :result="admin.lastSolve"
      :student-by-id="admin.studentById"
      :show-name="showName"
      @close="showSolve = false"
      @open-student="openStudent"
    />

    <div v-if="!admin.loaded && admin.loading" class="board-grid">
      <div v-for="n in 8" :key="n" class="surface-card pa-2"><v-skeleton-loader type="list-item-two-line, chip, chip" class="bg-transparent" /></div>
    </div>

    <div v-else class="board">
      <div class="board-main min-w-0">
        <div v-if="focusStudent && onlyChoices" class="focus-bar mb-3">
          <v-icon icon="mdi-filter-outline" size="18" />
          Seulement les choix de <strong class="mx-1">{{ showName ? focusStudent.fullName : `#${focusStudent.id}` }}</strong>
          <v-btn size="small" variant="text" @click="onlyChoices = false">Tout afficher</v-btn>
        </div>
        <EmptyState
          v-if="!boardProjects.length"
          class="surface-card"
          icon="mdi-view-dashboard-outline"
          title="Aucun projet sélectionné"
          text="Sélectionnez les projets ouverts dans « Sélection », ou affichez les projets non sélectionnés (menu Affichage)."
        />
        <div class="board-grid">
          <BoardProject
            v-for="p in visibleProjects"
            :key="p.id"
            :project="p"
            :members="membersOf(p.id)"
            :mapping="admin.mapping"
            :params="params"
            :show-name="showName"
            :drop-active="dropTarget === p.id"
            :focus-student-id="focusId"
            :focus-rank="focusStudent ? focusStudent.rankOf(p.id) : null"
            :dimmed="!!focusStudent && !focusStudent.rankOf(p.id) && focusStudent.assignedProjectId !== p.id"
            :candidates="candidatesFor === p.id"
            :locking="locking === p.id"
            @drag-over="onDragOver(p.id)"
            @drag-leave="onDragLeave(p.id)"
            @drop="dropOnProject(p)"
            @open-student="openStudent"
            @drag-start="onDragStart"
            @drag-end="onDragEnd"
            @toggle-lock="toggleLock"
            @candidates="toggleCandidates"
          />
        </div>
      </div>

      <aside
        class="pool surface-card"
        :class="{ 'pool--over': dropTarget === 'pool' }"
        aria-label="Étudiants"
        data-testid="pool"
        @dragover.prevent="onDragOver('pool')"
        @dragleave="onPoolLeave"
        @drop.prevent="dropOnPool"
      >
        <div class="pool-head">
          <v-tabs v-model="poolTab" density="compact" color="primary" grow>
            <v-tab value="unassigned" data-testid="tab-unassigned">Non affectés <span class="tab-count">{{ unassigned.length }}</span></v-tab>
            <v-tab value="all" data-testid="tab-all">Tous <span class="tab-count">{{ activeStudents.length }}</span></v-tab>
            <v-tab value="excluded" data-testid="tab-excluded">Exclus <span class="tab-count">{{ excluded.length }}</span></v-tab>
          </v-tabs>
          <v-text-field
            v-model="search"
            class="mt-2"
            placeholder="Rechercher (nom, n°, orientation)"
            prepend-inner-icon="mdi-magnify"
            density="compact"
            hide-details
            clearable
            aria-label="Rechercher un étudiant"
          />
          <div v-if="candidatesProject" class="cand-bar">
            <span class="min-w-0 text-truncate">Candidats de <strong>{{ candidatesProject.title }}</strong> (par rang)</span>
            <v-btn icon="mdi-close" size="x-small" variant="text" aria-label="Arrêter le filtre des candidats" @click="candidatesFor = null" />
          </div>
        </div>
        <div class="pool-list">
          <div v-if="dragging && dragging.assignedProjectId" class="drop-hint">
            <v-icon icon="mdi-tray-arrow-down" size="18" /> Déposer ici pour retirer de son projet
          </div>
          <StudentRow
            v-for="s in poolStudents"
            :key="s.id"
            :student="s"
            :project-by-id="admin.projectById"
            :member-counts="memberCounts"
            :show-name="showName"
            :focused="focusId === s.id"
            :highlight-project="candidatesFor"
            @open="openStudent"
            @drag-start="onDragStart"
            @drag-end="onDragEnd"
          />
          <EmptyState
            v-if="!poolStudents.length"
            compact
            :icon="poolTab === 'excluded' ? 'mdi-account-cancel-outline' : 'mdi-account-check-outline'"
            :title="poolEmptyTitle"
          />
        </div>
      </aside>
    </div>

    <StudentPanel
      :student="focusStudent"
      :project-by-id="admin.projectById"
      :member-counts="memberCounts"
      :board-projects="boardProjects"
      :only-choices="onlyChoices"
      :on-assign="assignTo"
      :on-unassign="unassignStudent"
      :on-flags="setFlags"
      @update:only-choices="onlyChoices = $event"
      @close="focusId = null"
    />

    <SolveDialog
      v-model="solveDialog"
      :params="params"
      :running="solving"
      :saving="savingFile"
      :saved="savedBeforeSolve"
      :error="solveError"
      @save="saveToFile(defaultFilename(), true)"
      @run="solve"
    />

    <v-dialog v-model="saveDialog" max-width="460">
      <v-card class="pa-2">
        <v-card-title class="font-weight-bold">Sauvegarder la répartition</v-card-title>
        <v-card-text>
          <p class="text-body-2 muted mb-3">Fichier .prjmult à garder sur votre ordinateur ; il pourra être rechargé (menu Fichier).</p>
          <v-text-field v-model="filename" label="Nom du fichier" suffix=".prjmult" autofocus @keyup.enter="confirmSave" />
        </v-card-text>
        <v-card-actions class="px-4 pb-3">
          <v-spacer />
          <v-btn variant="text" @click="saveDialog = false">Annuler</v-btn>
          <v-btn color="primary" variant="flat" :disabled="!filename.trim()" :loading="savingFile" data-testid="save-file" @click="confirmSave">Télécharger</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <BoardHelp v-model="helpDialog" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import BoardHelp from '@/components/board/BoardHelp.vue'
import BoardProject from '@/components/board/BoardProject.vue'
import SolveDialog from '@/components/board/SolveDialog.vue'
import SolveSummary from '@/components/board/SolveSummary.vue'
import StudentPanel from '@/components/board/StudentPanel.vue'
import StudentRow from '@/components/board/StudentRow.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { DEFAULT_SOLVE_PARAMS, LEGACY_ACTIONS, useAdminStore } from '@/stores/admin'
import { useConfirmStore } from '@/stores/confirm'
import { useNotifyStore } from '@/stores/notify'
import { useSessionStore } from '@/stores/session'
import { defaultFilename, loadPref, loadSolveParams, rankTone, savePref, saveSolveParams } from '@/utils/board'
import { downloadBlob } from '@/utils/csv'
import { exportAssignmentCsv, exportStudentsCsv } from '@/utils/exports'
import { matchesQuery, plural } from '@/utils/text'
import '@/components/board/boardStyles.css'

const session = useSessionStore()
const admin = useAdminStore()
const notify = useNotifyStore()
const confirm = useConfirmStore()

const showName = ref(loadPref('board.showName', false))
const showAllProjects = ref(loadPref('board.showAll', false))
const projectSort = ref(loadPref('board.sort', 'id'))
watch(showName, (v) => savePref('board.showName', v))
watch(showAllProjects, (v) => savePref('board.showAll', v))
watch(projectSort, (v) => savePref('board.sort', v))
const projectSortItems = [
  { title: 'Numéro du projet', value: 'id' },
  { title: 'Titre', value: 'title' },
  { title: 'Remplissage (les moins remplis d’abord)', value: 'fill' },
]

const params = ref(loadSolveParams(DEFAULT_SOLVE_PARAMS))
const poolTab = ref('unassigned')
const search = ref('')
const focusId = ref(null)
const onlyChoices = ref(false)
const candidatesFor = ref(null)
const dragging = ref(null)
const dropTarget = ref(null)
const locking = ref(null)
const helpDialog = ref(false)
const saveDialog = ref(false)
const filename = ref(defaultFilename())
const savingFile = ref(false)
const solveDialog = ref(false)
const solving = ref(false)
const solveError = ref('')
const savedBeforeSolve = ref(false)
const showSolve = ref(true)
const fileInput = ref(null)

/* ---------- Données dérivées ---------- */
const activeStudents = computed(() => admin.students.filter((s) => !s.excluded))
const excluded = computed(() => admin.students.filter((s) => s.excluded))
const assignedStudents = computed(() => activeStudents.value.filter((s) => s.assignedProjectId))
const unassigned = computed(() => activeStudents.value.filter((s) => !s.assignedProjectId))
const outOfChoice = computed(() => assignedStudents.value.filter((s) => s.rankOf(s.assignedProjectId) == null))

const membersByProject = computed(() => {
  const map = new Map()
  for (const s of activeStudents.value) {
    const pid = s.assignedProjectId
    if (!pid) continue
    if (!map.has(pid)) map.set(pid, [])
    map.get(pid).push(s)
  }
  const collator = new Intl.Collator('fr')
  for (const list of map.values()) list.sort((a, b) => collator.compare(a.lastname, b.lastname))
  return map
})
const memberCounts = computed(() => new Map([...membersByProject.value.entries()].map(([k, v]) => [k, v.length])))
const membersOf = (pid) => membersByProject.value.get(pid) || []

const boardProjects = computed(() => {
  const collator = new Intl.Collator('fr', { sensitivity: 'base' })
  const list = admin.projects.filter((p) => p.selected || showAllProjects.value || memberCounts.value.get(p.id))
  if (projectSort.value === 'title') return list.sort((a, b) => collator.compare(a.title, b.title))
  if (projectSort.value === 'fill') return list.sort((a, b) => (memberCounts.value.get(a.id) || 0) - (memberCounts.value.get(b.id) || 0) || a.id - b.id)
  return list.sort((a, b) => a.id - b.id)
})

const focusStudent = computed(() => (focusId.value ? admin.studentById.get(focusId.value) || null : null))
const visibleProjects = computed(() => {
  if (!focusStudent.value || !onlyChoices.value) return boardProjects.value
  const s = focusStudent.value
  return boardProjects.value.filter((p) => s.rankOf(p.id) || s.assignedProjectId === p.id).sort((a, b) => (s.rankOf(a.id) || 9) - (s.rankOf(b.id) || 9))
})

const candidatesProject = computed(() => (candidatesFor.value ? admin.projectById.get(candidatesFor.value) : null))
const poolStudents = computed(() => {
  let list
  if (candidatesFor.value) {
    const pid = candidatesFor.value
    list = admin.students.filter((s) => s.rankOf(pid)).sort((a, b) => a.rankOf(pid) - b.rankOf(pid))
  } else {
    list = { unassigned: unassigned.value, all: activeStudents.value, excluded: excluded.value }[poolTab.value].slice()
    const collator = new Intl.Collator('fr')
    list.sort((a, b) => collator.compare(a.lastname, b.lastname))
  }
  return list.filter((s) => matchesQuery(search.value, s.fullName, `#${s.id}`, String(s.id), s.orientationAcronym, s.email))
})
const poolEmptyTitle = computed(() => {
  if (search.value) return 'Aucun étudiant ne correspond'
  if (candidatesFor.value) return "Personne n'a choisi ce projet"
  return { unassigned: 'Tous les étudiants sont affectés', all: 'Aucun étudiant inscrit', excluded: 'Aucun étudiant exclu' }[poolTab.value]
})

const rankCounts = computed(() => {
  const by = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, out: 0 }
  for (const s of assignedStudents.value) by[s.rankOf(s.assignedProjectId) || 'out'] += 1
  return ['1', '2', '3', '4', '5', 'out'].map((k) => ({
    key: k,
    short: k === 'out' ? '✕' : k,
    label: k === 'out' ? `Hors choix : ${by.out}` : `Choix ${k} : ${by[k]}`,
    value: by[k],
    tone: rankTone(k === 'out' ? null : Number(k)),
  }))
})
const meanRank = computed(() => {
  const ranks = assignedStudents.value.map((s) => s.rankOf(s.assignedProjectId)).filter(Boolean)
  return ranks.length ? (ranks.reduce((a, b) => a + b, 0) / ranks.length).toFixed(2).replace('.', ',') : '—'
})
const badSizes = computed(() => boardProjects.value.filter((p) => {
  const n = memberCounts.value.get(p.id) || 0
  return p.selected && (n < params.value.min_size || n > params.value.max_size)
}).length)

/* ---------- Chargement ---------- */
onMounted(async () => {
  try {
    await admin.refresh()
  } catch (error) {
    notify.error(error, 'Chargement impossible')
  }
})

/* ---------- Glisser-déposer ---------- */
function onDragStart(student) {
  dragging.value = student
}
function onDragEnd() {
  dragging.value = null
  dropTarget.value = null
}
function onDragOver(target) {
  if (dragging.value) dropTarget.value = target
}
function onDragLeave(target) {
  if (dropTarget.value === target) dropTarget.value = null
}
function onPoolLeave(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) onDragLeave('pool')
}

async function dropOnProject(project) {
  const s = dragging.value
  onDragEnd()
  if (!s || s.assignedProjectId === project.id) return
  await assignTo(s, project)
}

async function dropOnPool() {
  const s = dragging.value
  onDragEnd()
  if (!s || !s.assignedProjectId) return
  await unassignStudent(s)
}

/* ---------- Actions ---------- */
function who(s) {
  return showName.value ? s.fullName : `#${s.id}`
}

// Le verrou d'un projet ne concerne que le calcul automatique : le déplacement manuel est toujours permis.
async function assignTo(student, project) {
  try {
    await admin.assign(student.id, project.id)
    const rank = student.rankOf(project.id)
    notify.success(`${who(student)} → « ${project.title} » (${rank ? `choix ${rank}` : 'hors de ses choix'}).`)
  } catch (error) {
    notify.error(error, "L'affectation n'a pas été enregistrée")
  }
}

async function unassignStudent(student) {
  try {
    await admin.unassign(student.id)
    notify.success(`${who(student)} n'est plus affecté.`)
  } catch (error) {
    notify.error(error, "L'étudiant n'a pas été retiré")
  }
}

async function setFlags(student, flags) {
  try {
    const updated = await admin.setFlags(student.id, flags)
    const text = 'excluded' in flags
      ? (updated.excluded ? `${who(updated)} est exclu de la répartition.` : `${who(updated)} est réintégré dans la répartition.`)
      : (updated.locked ? `L'affectation de ${who(updated)} est verrouillée.` : `L'affectation de ${who(updated)} est déverrouillée.`)
    notify.success(text)
  } catch (error) {
    notify.error(error, "La modification n'a pas été enregistrée")
  }
}

async function toggleLock(project) {
  locking.value = project.id
  try {
    await admin.setProjectLocked(project.id, !project.isLocked)
    notify.success(project.isLocked ? `« ${project.title} » est verrouillé : le calcul gardera ses étudiants.` : `« ${project.title} » est déverrouillé.`)
  } catch (error) {
    notify.error(error, "Le verrou n'a pas été modifié")
  } finally {
    locking.value = null
  }
}

function toggleCandidates(project) {
  candidatesFor.value = candidatesFor.value === project.id ? null : project.id
}

function openStudent(student) {
  focusId.value = student.id
}

/* ---------- Fichiers ---------- */
async function saveToFile(name, beforeSolve = false) {
  savingFile.value = true
  try {
    const rows = await admin.getAssignments()
    downloadBlob(new Blob([JSON.stringify(rows)], { type: 'text/plain' }), `${name}.prjmult`)
    if (beforeSolve) savedBeforeSolve.value = true
    notify.success(`${plural(rows.length, 'affectation sauvegardée', 'affectations sauvegardées')} dans ${name}.prjmult.`)
    return true
  } catch (error) {
    notify.error(error, 'Sauvegarde impossible')
    return false
  } finally {
    savingFile.value = false
  }
}

async function confirmSave() {
  if (!filename.value.trim()) return
  if (await saveToFile(filename.value.trim())) saveDialog.value = false
}

watch(saveDialog, (open) => { if (open) filename.value = defaultFilename() })

async function readFile(event) {
  const file = event.target.files && event.target.files[0]
  event.target.value = ''
  if (!file) return
  let rows
  try {
    rows = JSON.parse(await file.text())
    if (!Array.isArray(rows)) throw new Error('format')
  } catch {
    notify.error(`Le fichier « ${file.name} » n'est pas une répartition valide (.prjmult).`)
    return
  }
  const ok = await confirm.ask({
    title: 'Charger cette répartition ?',
    text: `« ${file.name} » contient ${plural(rows.length, 'affectation')}.\nLa répartition actuelle sera entièrement remplacée.`,
    confirmText: 'Remplacer la répartition',
    color: 'warning',
    icon: 'mdi-folder-open-outline',
  })
  if (!ok) return
  try {
    await admin.loadAssignments(rows)
    notify.success(`Répartition chargée depuis « ${file.name} ».`)
  } catch (error) {
    notify.error(error, 'Chargement impossible')
  }
}

function exportAssignment() {
  const n = exportAssignmentCsv(admin.students, admin.projectById)
  notify.success(`${plural(n, 'affectation exportée', 'affectations exportées')}.`)
}

function exportStudents() {
  const n = exportStudentsCsv(admin.students, admin.projectById)
  notify.success(`${plural(n, 'étudiant exporté', 'étudiants exportés')}.`)
}

/* ---------- Calcul ---------- */
function openSolve() {
  solveError.value = ''
  savedBeforeSolve.value = false
  solveDialog.value = true
}

async function solve(values) {
  solving.value = true
  solveError.value = ''
  params.value = values
  saveSolveParams(values)
  try {
    const result = await admin.solve(values)
    solveDialog.value = false
    showSolve.value = true
    const m = result.metrics || {}
    notify.success(`${plural(m.assigned ?? 0, 'étudiant affecté', 'étudiants affectés')}, rang moyen ${m.mean_rank != null ? Number(m.mean_rank).toFixed(2).replace('.', ',') : '—'}.`, 'Répartition calculée')
  } catch (error) {
    if (error.status === 404) {
      solveError.value = "Le calcul automatique n'est pas disponible sur ce serveur (POST /api/assignment/solve introuvable). Mettez le backend à jour ou utilisez l'ancien algorithme."
    } else {
      solveError.value = error.userMessage
    }
  } finally {
    solving.value = false
  }
}

async function runLegacy(key) {
  const a = LEGACY_ACTIONS[key]
  const ok = await confirm.ask({
    title: `${a.title} (ancien algorithme)`,
    text: a.text,
    confirmText: 'Lancer',
    color: key === 'calcul-match' ? 'primary' : 'warning',
    icon: a.icon,
  })
  if (!ok) return
  try {
    await admin.runLegacy(key)
    notify.success(`${a.title} : terminé.`)
  } catch (error) {
    notify.error(error, a.title)
  }
}
</script>

<style scoped>
.board-page { padding-top: 20px; }
.live { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 28px; padding: 12px 18px; }
.live-item { display: flex; flex-direction: column; }
.live-value { font-size: 1.25rem; font-weight: 700; line-height: 1.2; }
.live-of { font-size: 0.85rem; color: rgba(var(--v-theme-on-surface), 0.55); }
.live-label { font-size: 0.74rem; color: rgba(var(--v-theme-on-surface), 0.62); }
.live-ranks { display: flex; gap: 10px; flex-wrap: wrap; margin-left: auto; }
.rank-cell { display: inline-flex; align-items: center; gap: 4px; font-size: 0.88rem; font-weight: 650; }
.board { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 16px; align-items: start; }
.board-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 12px; }
.focus-bar { display: flex; align-items: center; gap: 6px; font-size: 0.9rem; padding: 6px 12px; border-radius: 10px; background: rgba(var(--v-theme-primary), 0.06); }
.pool {
  position: sticky; top: 76px; display: flex; flex-direction: column;
  max-height: calc(100vh - 92px); overflow: hidden; transition: border-color 0.12s, box-shadow 0.12s;
}
.pool--over { border-color: rgb(var(--v-theme-primary)) !important; box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.14); }
.pool-head { padding: 6px 10px 10px; border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.tab-count { margin-left: 6px; font-size: 0.72rem; font-weight: 700; padding: 0 6px; border-radius: 999px; background: rgb(var(--v-theme-surface-light)); }
.cand-bar { display: flex; align-items: center; gap: 4px; margin-top: 8px; padding: 4px 4px 4px 10px; border-radius: 8px; font-size: 0.84rem; background: rgba(var(--v-theme-primary), 0.07); }
.pool-list { flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
.drop-hint { display: flex; align-items: center; gap: 6px; justify-content: center; padding: 10px; border-radius: 10px; border: 1px dashed rgba(var(--v-theme-primary), 0.5); color: rgb(var(--v-theme-primary)); font-size: 0.85rem; }
@media (max-width: 1100px) {
  .board { grid-template-columns: 1fr; }
  .pool { position: static; max-height: 70vh; }
}
</style>
