<template>
  <div class="page board-page">
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


        <v-menu location="bottom end" :close-on-content-click="false">
          <template #activator="{ props: p }">
            <v-btn v-bind="p" variant="outlined" prepend-icon="mdi-tune-variant" append-icon="mdi-chevron-down">Affichage</v-btn>
          </template>
          <v-card min-width="320" class="pa-4" border>
            <v-switch v-model="showName" label="Afficher les noms" data-testid="toggle-names" />
            <v-switch v-model="showAllProjects" label="Afficher les projets non sélectionnés" class="mt-2" />
            <div class="legend-title">Couverture des domaines</div>
            <div class="cov-legend">
              <span class="cov-sample cov-sample--ok"><v-icon icon="mdi-check-bold" size="9" /></span><span>couvert par l'orientation d'un étudiant</span>
              <span class="cov-sample cov-sample--partial"><v-icon icon="mdi-approximately-equal" size="9" /></span><span>couvert seulement en élargissant</span>
              <span class="cov-sample cov-sample--missing"><v-icon icon="mdi-exclamation-thick" size="9" /></span><span>non couvert (cadre en pointillés)</span>
            </div>
            <div class="legend-title">Rang obtenu</div>
            <div class="d-flex flex-wrap ga-1 align-center text-caption">
              <span class="rank-badge rank--r1">1</span><span class="rank-badge rank--r2">2</span><span class="rank-badge rank--r3">3</span>
              <span class="rank-badge rank--r45">4</span><span class="rank-badge rank--r45">5</span><span class="rank-badge rank--out">✕</span>
              <span class="muted ml-1">1 = meilleur choix, ✕ = hors choix</span>
            </div>
          </v-card>
        </v-menu>

        <v-menu location="bottom end">
          <template #activator="{ props: p }">
            <v-btn v-bind="p" icon variant="text" aria-label="Plus d'actions" data-testid="more-menu">
              <v-icon icon="mdi-dots-horizontal" />
            </v-btn>
          </template>
          <v-list density="compact" nav min-width="320">
            <v-list-item prepend-icon="mdi-help-circle-outline" title="Aide et légende" @click="helpDialog = true" />
            <v-divider class="my-1" />
            <v-list-subheader>Ancien algorithme</v-list-subheader>
            <v-list-item v-for="(a, key) in LEGACY_ACTIONS" :key="key" :prepend-icon="a.icon" :title="a.title" @click="runLegacy(key)" />
          </v-list>
        </v-menu>

        <v-btn
          v-if="!wide"
          :variant="poolVisible ? 'flat' : 'outlined'"
          :color="poolVisible ? 'selected' : undefined"
          prepend-icon="mdi-account-multiple-outline"
          data-testid="toggle-pool"
          @click="poolOpen = !poolOpen"
        >
          Étudiants ({{ unassigned.length }})
        </v-btn>
        <input ref="fileInput" type="file" accept=".prjmult,application/json,text/plain" class="d-none" data-testid="load-file" @change="readFile" />
      </div>
    </header>

    <!-- Indicateurs en direct -->
    <div class="live surface-card mb-4" aria-label="Indicateurs de la répartition actuelle">
      <div class="live-item"><span class="live-value tabular">{{ assignedStudents.length }}<span class="live-of">/{{ activeStudents.length }}</span></span><span class="live-label">affectés</span><v-tooltip activator="parent" location="bottom">Étudiants affectés à un projet, sur les étudiants inscrits (hors exclus)</v-tooltip></div>
      <div class="live-item"><span class="live-value tabular" :class="{ 'text-warning': unassigned.length }">{{ unassigned.length }}</span><span class="live-label">non affectés</span><v-tooltip activator="parent" location="bottom">Étudiants encore sans projet (onglet « Non affectés » de la liste)</v-tooltip></div>
      <div class="live-item"><span class="live-value tabular">{{ excluded.length }}</span><span class="live-label">exclus</span><v-tooltip activator="parent" location="bottom">Étudiants retirés de la répartition (sujet personnel, abandon…)</v-tooltip></div>
      <div class="live-item"><span class="live-value tabular" :class="{ 'text-error': outOfChoice.length }">{{ outOfChoice.length }}</span><span class="live-label">hors choix</span><v-tooltip activator="parent" location="bottom">Étudiants affectés à un projet qui n'est pas dans leurs 5 choix</v-tooltip></div>
      <div class="live-item"><span class="live-value tabular">{{ meanRank }}</span><span class="live-label">rang moyen</span><v-tooltip activator="parent" location="bottom">Rang moyen du projet obtenu dans les choix (1 = premier choix pour tous)</v-tooltip></div>
      <div class="live-item"><span class="live-value tabular" :class="{ 'text-warning': badSizes }">{{ badSizes }}</span><span class="live-label">groupes hors taille</span><v-tooltip activator="parent" location="bottom">Projets sélectionnés avec moins de {{ params.min_size }} ou plus de {{ params.max_size }} étudiants</v-tooltip></div>
      <div class="live-ranks" aria-label="Rangs obtenus">
        <span class="live-label mr-1">Rangs :</span>
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

    <div v-else class="board" :class="{ 'board--split': poolVisible && !compact }">
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
        <div v-if="boardProjects.length" class="sort-bar mb-3">
          <span class="sort-count">{{ plural(visibleProjects.length, 'projet') }}</span>
          <v-spacer />
          <span id="sort-label" class="sort-label">Trier</span>
          <v-btn-toggle
            v-model="projectSort"
            mandatory
            density="compact"
            variant="outlined"
            divided
            aria-labelledby="sort-label"
            data-testid="project-sort"
            :disabled="!!(focusStudent && onlyChoices)"
          >
            <v-btn v-for="o in projectSortItems" :key="o.value" :value="o.value" size="small" :data-testid="`sort-${o.value}`">
              <v-icon v-if="o.icon" :icon="o.icon" size="16" class="mr-1" />{{ o.short }}
              <v-tooltip activator="parent" location="top">{{ o.title }}</v-tooltip>
            </v-btn>
          </v-btn-toggle>
        </div>
        <TransitionGroup tag="div" name="bp-move" class="board-grid">
          <BoardProject
            v-for="p in visibleProjects"
            :key="p.id"
            :project="p"
            :members="membersOf(p.id)"
            :mapping="admin.mapping"
            :params="params"
            :show-name="showName"
            :drop-active="dropTarget === p.id"
            :dragging="!!dragging"
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
        </TransitionGroup>
      </div>

      <aside
        v-show="poolVisible"
        class="pool surface-card"
        :class="{ 'pool--over': dropTarget === 'pool', 'pool--overlay': compact, 'pool--narrow': !wide && !compact }"
        aria-label="Étudiants"
        data-testid="pool"
        @dragover.prevent="onDragOver('pool')"
        @dragleave="onPoolLeave"
        @drop.prevent="dropOnPool"
      >
        <div class="pool-head">
          <div v-if="!wide" class="d-flex align-center mb-1">
            <span class="font-weight-bold text-body-2">Étudiants</span>
            <v-spacer />
            <v-btn icon="mdi-close" size="small" variant="text" aria-label="Masquer la liste des étudiants" @click="poolOpen = false" />
          </div>
          <v-tabs v-model="poolTab" density="compact" grow>
            <v-tab value="unassigned" data-testid="tab-unassigned">Non affectés <span class="tab-count">{{ unassigned.length }}</span></v-tab>
            <v-tab value="all" data-testid="tab-all">Tous <span class="tab-count">{{ activeStudents.length }}</span></v-tab>
            <v-tab value="excluded" data-testid="tab-excluded">Exclus <span class="tab-count">{{ excluded.length }}</span></v-tab>
          </v-tabs>
          <v-text-field
            v-model="search"
            class="mt-2"
            placeholder="Rechercher un étudiant"
            prepend-inner-icon="mdi-magnify"
            density="compact"
            hide-details
            clearable
            aria-label="Rechercher un étudiant"
          />
          <div v-if="candidatesProject" class="cand-bar" data-testid="cand-bar">
            <v-icon icon="mdi-account-search" size="18" class="flex-none" />
            <div class="min-w-0 flex-grow-1">
              <div class="cand-kicker">Candidats du projet #{{ candidatesProject.id }}, par rang</div>
              <div class="cand-title text-truncate">{{ candidatesProject.title }}</div>
            </div>
            <v-btn icon size="small" variant="text" aria-label="Montrer le projet dans le tableau" data-testid="cand-locate" @click="locateProject(candidatesProject.id)">
              <v-icon icon="mdi-crosshairs-gps" size="18" />
              <v-tooltip activator="parent" location="bottom">Montrer le projet dans le tableau</v-tooltip>
            </v-btn>
            <v-btn icon size="small" variant="text" aria-label="Arrêter le filtre des candidats" @click="candidatesFor = null">
              <v-icon icon="mdi-close" size="18" />
              <v-tooltip activator="parent" location="bottom">Revenir à la liste des étudiants</v-tooltip>
            </v-btn>
          </div>
        </div>
        <div ref="poolList" class="pool-list">
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
      :on-toggle-lock="toggleLock"
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
        <v-card-actions class="px-6 pb-4">
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
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
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
import { defaultFilename, loadPref, loadSolveParams, lockedProjectText, lockReason, rankTone, savePref, saveSolveParams } from '@/utils/board'
import { downloadBlob } from '@/utils/csv'
import { exportAssignmentCsv, exportStudentsCsv } from '@/utils/exports'
import { matchesQuery, plural } from '@/utils/text'
import '@/components/board/boardStyles.css'

const session = useSessionStore()
const admin = useAdminStore()
const notify = useNotifyStore()
const confirm = useConfirmStore()

const { width } = useDisplay()
// ≥ 1100 px : liste toujours à côté ; tablette : tiroir latéral escamotable ; téléphone : tiroir par-dessus.
const wide = computed(() => width.value >= 1100)
const compact = computed(() => width.value < 760)
const poolOpen = ref(width.value >= 760)
const poolVisible = computed(() => wide.value || poolOpen.value)
const showName = ref(loadPref('board.showName', false))
const showAllProjects = ref(loadPref('board.showAll', false))
const projectSort = ref(loadPref('board.sort', 'id'))
watch(showName, (v) => savePref('board.showName', v))
watch(showAllProjects, (v) => savePref('board.showAll', v))
watch(projectSort, (v) => savePref('board.sort', v))
const projectSortItems = [
  { value: 'id', short: 'N°', title: 'Par numéro de projet' },
  { value: 'title', short: 'Titre', title: 'Par titre (A → Z)' },
  { value: 'fill', short: 'Effectif', icon: 'mdi-sort-numeric-ascending', title: "Par nombre d'étudiants affectés : les moins remplis d'abord" },
  { value: 'fill-desc', short: 'Effectif', icon: 'mdi-sort-numeric-descending', title: "Par nombre d'étudiants affectés : les plus remplis d'abord" },
]
if (!projectSortItems.some((o) => o.value === projectSort.value)) projectSort.value = 'id'

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
const poolList = ref(null)

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
  const count = (p) => memberCounts.value.get(p.id) || 0
  if (projectSort.value === 'fill') return list.sort((a, b) => count(a) - count(b) || a.id - b.id)
  if (projectSort.value === 'fill-desc') return list.sort((a, b) => count(b) - count(a) || a.id - b.id)
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

// Verrou : refusé côté client avant même d'appeler le serveur (qui refuse aussi).
function blockedMove(student, target) {
  if (target && target.isLocked) return lockedProjectText(target)
  return lockReason(student, admin.projectById)
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

async function assignTo(student, project) {
  const blocked = blockedMove(student, project)
  if (blocked) {
    notify.warning(blocked)
    return
  }
  try {
    await admin.assign(student.id, project.id)
    const rank = student.rankOf(project.id)
    notify.success(`${who(student)} → « ${project.title} » (${rank ? `choix ${rank}` : 'hors de ses choix'}).`)
  } catch (error) {
    notify.error(error, "L'affectation n'a pas été enregistrée")
  }
}

async function unassignStudent(student) {
  const blocked = blockedMove(student, null)
  if (blocked) {
    notify.warning(blocked)
    return
  }
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
    notify.success(project.isLocked ? `« ${project.title} » est verrouillé : son équipe est figée.` : `« ${project.title} » est déverrouillé : son équipe peut de nouveau changer.`)
  } catch (error) {
    notify.error(error, "Le verrou n'a pas été modifié")
  } finally {
    locking.value = null
  }
}

function toggleCandidates(project) {
  candidatesFor.value = candidatesFor.value === project.id ? null : project.id
  if (!candidatesFor.value) return
  if (!poolVisible.value) poolOpen.value = true
  nextTick(() => { if (poolList.value) poolList.value.scrollTop = 0 })
}

// Fait défiler le tableau jusqu'au projet et le fait clignoter brièvement.
function locateProject(id) {
  const el = document.getElementById(`bp-${id}`)
  if (!el) {
    notify.info("Ce projet n'est pas affiché dans le tableau (projet non sélectionné ou filtre actif).")
    return
  }
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el.classList.remove('bp--flash')
  void el.offsetWidth
  el.classList.add('bp--flash')
  window.setTimeout(() => el.classList.remove('bp--flash'), 1600)
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
    // Depuis la fenêtre de calcul, la confirmation s'affiche dans la fenêtre (« sauvegardée »).
    if (beforeSolve) savedBeforeSolve.value = true
    else notify.success(`${plural(rows.length, 'affectation sauvegardée', 'affectations sauvegardées')} dans ${name}.prjmult.`)
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
    text: `« ${file.name} » contient ${plural(rows.length, 'affectation')}.\nLa répartition actuelle sera remplacée, sauf les projets et étudiants verrouillés, qui gardent leur équipe.`,
    confirmText: 'Remplacer la répartition',
    color: 'warning',
    icon: 'mdi-folder-open-outline',
  })
  if (!ok) return
  try {
    const r = await admin.loadAssignments(rows)
    if (r.skipped) {
      notify.warning(`Répartition chargée depuis « ${file.name} » : ${plural(r.loaded ?? 0, 'affectation appliquée', 'affectations appliquées')}, ${plural(r.skipped, 'ignorée', 'ignorées')} car l'étudiant ou le projet est verrouillé.`)
    } else {
      notify.success(`Répartition chargée depuis « ${file.name} ».`)
    }
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
.board-page { padding-top: 24px; }
.live { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 28px; padding: 12px 18px; }
.live-item { display: flex; flex-direction: column; }
.live-value { font-size: 1.25rem; font-weight: 700; line-height: 1.2; }
.live-of { font-size: 0.85rem; color: var(--text-secondary); }
.live-label { font-size: 0.76rem; color: var(--text-secondary); }
.live-ranks { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-left: auto; }
.rank-cell { display: inline-flex; align-items: center; gap: 4px; font-size: 0.88rem; font-weight: 650; }
.board { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; align-items: start; }
.board--split { grid-template-columns: minmax(0, 1fr) 380px; }
.board--split:has(.pool--narrow) { grid-template-columns: minmax(0, 1fr) 320px; }
.board-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 12px; }
.focus-bar { display: flex; align-items: center; gap: 6px; font-size: 0.9rem; padding: 6px 12px; border-radius: var(--radius-control); background: var(--neutral-chip-bg); }
.pool {
  position: sticky; top: 80px; display: flex; flex-direction: column;
  max-height: calc(100vh - 96px); overflow: hidden; transition: border-color 0.12s, box-shadow 0.12s;
}
.pool--overlay {
  position: fixed; top: 72px; right: 8px; bottom: 8px; z-index: 6; width: min(360px, calc(100vw - 16px)); max-height: none;
  box-shadow: -12px 0 32px -12px rgba(0, 0, 0, 0.3);
}
.pool--over { border-color: var(--focus-ring) !important; box-shadow: 0 0 0 2px var(--focus-ring); }
.pool-head { padding: 6px 10px 10px; border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.pool--narrow :deep(.v-tab), .pool--overlay :deep(.v-tab) { padding: 0 6px; min-width: 0; font-size: 0.84rem; }
.tab-count { margin-left: 6px; font-size: 0.72rem; font-weight: 700; padding: 0 7px; border-radius: 999px; background: var(--neutral-chip-bg); }
.cand-bar {
  display: flex; align-items: center; gap: 6px; margin-top: 8px; padding: 6px 2px 6px 10px; border-radius: var(--radius-control);
  background: rgb(var(--v-theme-info)); color: rgb(var(--v-theme-on-info));
}
.cand-kicker { font-size: 0.72rem; opacity: 0.9; }
.cand-title { font-size: 0.88rem; font-weight: 700; }
.sort-bar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.sort-count { font-size: 0.84rem; color: var(--text-secondary); }
.sort-label { font-size: 0.84rem; color: var(--text-secondary); }
.sort-bar :deep(.v-btn-group) { height: 32px; }
.sort-bar :deep(.v-btn) { text-transform: none; letter-spacing: 0; font-weight: 600; }
/* Réordonnancement animé (tri par effectif après un déplacement) */
.bp-move-move { transition: transform 0.3s ease; }
:deep(.bp--flash) { animation: bp-flash 1.5s ease; }
@keyframes bp-flash {
  0%, 60% { box-shadow: 0 0 0 4px rgba(var(--v-theme-info), 0.55); }
  100% { box-shadow: 0 0 0 0 rgba(var(--v-theme-info), 0); }
}
.pool-list { flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
.drop-hint { display: flex; align-items: center; gap: 6px; justify-content: center; padding: 10px; border-radius: var(--radius-control); border: 1px dashed var(--focus-ring); color: var(--focus-ring); font-size: 0.85rem; }
.legend-title { font-size: 0.76rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-secondary); margin: 18px 0 8px; }
.cov-legend { display: grid; grid-template-columns: 22px 1fr; gap: 8px 8px; align-items: center; font-size: 0.84rem; }
.cov-sample { width: 16px; height: 16px; border-radius: 50%; display: grid; place-items: center; color: #fff; }
.cov-sample--ok { background: rgb(var(--v-theme-success)); }
.cov-sample--partial { background: rgb(var(--v-theme-warning)); }
.cov-sample--missing { background: rgb(var(--v-theme-error)); }
</style>
