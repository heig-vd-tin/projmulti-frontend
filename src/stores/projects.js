import { defineStore } from 'pinia'
import { ref } from 'vue'
import http from '@/api/http'
import Project from '@/models/Project'
import { useSessionStore } from '@/stores/session'
import { downloadBlob, safeFilename } from '@/utils/csv'
import { readBlobError } from '@/utils/errors'

// Liste des projets de l'année affichée, projets du prof connecté, actions sur un projet.
export const useProjectsStore = defineStore('projects', () => {
  const all = ref([])
  const owned = ref([])
  const loading = ref(false)
  const loaded = ref(false)
  let listRequest = 0

  function patch(list, id, fields) {
    const p = list.value.find((item) => item.id === id)
    if (p) Object.assign(p, fields)
  }

  function upsert(list, project) {
    const i = list.value.findIndex((item) => item.id === project.id)
    if (i === -1) list.value.push(project)
    else list.value.splice(i, 1, project)
  }

  async function fetchAll() {
    const session = useSessionStore()
    const year = session.year
    const req = ++listRequest
    loading.value = true
    try {
      const { data } = await http.get('/project/alld', { params: year ? { year } : {} })
      if (req === listRequest) {
        all.value = data.map((p) => new Project(p))
        loaded.value = true
      }
    } finally {
      if (req === listRequest) loading.value = false
    }
  }

  async function changeYear(year) {
    const session = useSessionStore()
    session.selectedYear = year === session.currentYear ? null : year
    await fetchAll()
  }

  async function fetchOwned() {
    const { data } = await http.get('/project/owned')
    owned.value = data.map((p) => new Project(p))
  }

  // Projet complet (description comprise) : la liste n'a pas la description.
  async function fetchFull(id) {
    const { data } = await http.get(`/project/getdesc/${id}`)
    return new Project(Array.isArray(data) ? data[0] : data)
  }

  function afterSave(data) {
    const session = useSessionStore()
    const project = new Project(data)
    const light = new Project({ ...data, description: null })
    if (session.isCurrentYear) upsert(all, mergeAdmin(light))
    upsert(owned, light)
    return project
  }

  // Garde les relations chargées pour l'admin (choix, affectations) après une modification.
  function mergeAdmin(project) {
    const old = all.value.find((p) => p.id === project.id)
    if (old) {
      project.preferred_users = old.preferred_users
      project.matched_users = old.matched_users
      if (!project.assigned_users.length) project.assigned_users = old.assigned_users
    }
    return project
  }

  async function create(payload) {
    const { data } = await http.post('/project/create', payload)
    return afterSave(data)
  }

  async function edit(payload) {
    const { data } = await http.post('/project/edit', payload)
    return afterSave(data)
  }

  // « Reprendre pour <année> » : copie dans l'année en cours, puis retour à cette année.
  async function duplicate(id) {
    const session = useSessionStore()
    const { data } = await http.post(`/project/${id}/duplicate`)
    const copy = new Project({ ...data, description: null })
    owned.value.unshift(copy)
    session.selectedYear = null
    await fetchAll()
    return copy
  }

  async function exportPdf(project) {
    try {
      const response = await http.get(`/project/${project.id}/pdf`, { responseType: 'blob' })
      downloadBlob(response.data, `${safeFilename(project.title)}.pdf`)
    } catch (error) {
      error.userMessage = await readBlobError(error)
      throw error
    }
  }

  async function setSelected(id, selected) {
    const { data } = await http.post('/project/select', { id, selected })
    patch(all, id, { selected: !!data.selected })
    return data
  }

  async function setLocked(id, lock) {
    const { data } = await http.post('/project/lock', { id, lock })
    patch(all, id, { state: data.state })
    return data
  }

  return { all, owned, loading, loaded, fetchAll, changeYear, fetchOwned, fetchFull, create, edit, duplicate, exportPdf, setSelected, setLocked, patch: (id, f) => { patch(all, id, f); patch(owned, id, f) } }
})
