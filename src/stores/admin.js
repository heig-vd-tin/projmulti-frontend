import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import http from '@/api/http'
import Project from '@/models/Project'
import User from '@/models/User'
import { useProjectsStore } from '@/stores/projects'
import { useSessionStore } from '@/stores/session'

export const DEFAULT_SOLVE_PARAMS = {
  min_size: 4,
  max_size: 5,
  max_same_orientation: 3,
  allow_fifth_choice: true,
  allow_out_of_choice: false,
}

export const LEGACY_ACTIONS = {
  'calcul-match': {
    title: 'Calculer les correspondances',
    text: 'Recalcule la table des correspondances étudiants ↔ projets (orientations et domaines). Aucune affectation n’est modifiée.',
    icon: 'mdi-table-sync',
  },
  'auto-select': {
    title: 'Sélection automatique des projets',
    text: 'Remet à zéro la sélection des projets puis sélectionne automatiquement les projets les plus demandés (au moins un par enseignant).',
    icon: 'mdi-checkbox-multiple-marked-outline',
  },
  'auto-affect': {
    title: 'Affectation automatique',
    text: 'Efface toute la répartition actuelle puis affecte les étudiants avec l’ancien algorithme glouton.',
    icon: 'mdi-account-multiple-check-outline',
  },
}

// Données du responsable : étudiants, projets de l'année en cours (répartition), correspondance
// domaines → orientations, calcul de la répartition.
export const useAdminStore = defineStore('admin', () => {
  const students = ref([])
  const users = ref([])
  const projects = ref([])
  const mapping = ref([])
  const lastSolve = ref(null)
  const loading = ref(false)
  const loaded = ref(false)

  const studentById = computed(() => new Map(students.value.map((s) => [s.id, s])))
  const projectById = computed(() => new Map(projects.value.map((p) => [p.id, p])))
  const teachers = computed(() => users.value.filter((u) => u.isTeacher))

  async function fetchStudents() {
    const { data } = await http.get('/user/all-students')
    students.value = data.map((u) => new User(u))
  }

  async function fetchUsers() {
    const { data } = await http.get('/user/all')
    users.value = data.map((u) => new User(u))
  }

  async function fetchProjects() {
    const session = useSessionStore()
    const { data } = await http.get('/project/alld', { params: { year: session.currentYear } })
    // Sélection et répartition : jamais de brouillon.
    projects.value = data.filter((p) => p.proposed !== false).map((p) => new Project(p))
  }

  async function fetchMapping() {
    const { data } = await http.get('/settings/domain-mapping')
    mapping.value = data
  }

  async function saveMapping(rows) {
    const { data } = await http.put('/settings/domain-mapping', {
      mapping: rows.map((r) => ({ domain_id: r.domain_id, base: r.base, enlarged: r.enlarged })),
    })
    mapping.value = data
  }

  async function refresh() {
    loading.value = true
    try {
      await Promise.all([fetchStudents(), fetchProjects(), mapping.value.length ? null : fetchMapping()])
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  function replaceStudent(data) {
    const updated = new User(data)
    const i = students.value.findIndex((s) => s.id === updated.id)
    if (i === -1) students.value.push(updated)
    else students.value.splice(i, 1, updated)
    return updated
  }

  async function setFlags(userId, flags) {
    const { data } = await http.post(`/user/${userId}/flags`, flags)
    return replaceStudent(data)
  }

  // Affectation manuelle ; le serveur refuse si l'étudiant ou l'un des projets est verrouillé.
  async function assign(userId, projectId) {
    const student = studentById.value.get(userId)
    const previous = student ? student.assignments : []
    if (student) student.assignments = [{ project_id: projectId, user_id: userId, domain_id: null, level: 0 }]
    try {
      await http.post('/project/add-assignment', { project_id: projectId, user_id: userId })
    } catch (error) {
      if (student) student.assignments = previous
      throw error
    }
  }

  async function unassign(userId) {
    const student = studentById.value.get(userId)
    const previous = student ? student.assignments : []
    if (student) student.assignments = []
    try {
      await http.post('/project/remove-assignment', { user_id: userId })
    } catch (error) {
      if (student) student.assignments = previous
      throw error
    }
  }

  async function setProjectLocked(projectId, lock) {
    const { data } = await http.post('/project/lock', { id: projectId, lock })
    const p = projectById.value.get(projectId)
    if (p) p.state = data.state
    useProjectsStore().patch(projectId, { state: data.state })
  }

  async function setProjectSelected(projectId, selected) {
    const { data } = await http.post('/project/select', { id: projectId, selected })
    const p = projectById.value.get(projectId)
    if (p) p.selected = !!data.selected
    useProjectsStore().patch(projectId, { selected: !!data.selected })
  }

  async function getAssignments() {
    const { data } = await http.get('/assignment/get-all')
    return data
  }

  // Les étudiants et projets verrouillés gardent leur affectation : { loaded, skipped, kept }.
  async function loadAssignments(rows) {
    const { data } = await http.post('/assignment/load-data', { data: rows })
    await refresh()
    return data || {}
  }

  async function solve(params) {
    const { data } = await http.post('/assignment/solve', params)
    lastSolve.value = { ...data, params, at: new Date() }
    await refresh()
    return data
  }

  async function runLegacy(action) {
    await http.get(`/assignment/${action}`)
    await refresh()
  }

  return {
    students, users, projects, mapping, lastSolve, loading, loaded, studentById, projectById, teachers,
    fetchStudents, fetchUsers, fetchProjects, fetchMapping, saveMapping, refresh, setFlags, assign, unassign,
    setProjectLocked, setProjectSelected, getAssignments, loadAssignments, solve, runLegacy,
  }
})
