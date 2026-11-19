import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import http from '@/api/http'
import Project from '@/models/Project'

export const MAX_CHOICES = 5

// Choix de l'étudiant connecté : jusqu'à 5 projets, priorité 1 (meilleur choix) à 5.
export const usePreferencesStore = defineStore('preferences', () => {
  const items = ref([])
  const saving = ref(false)

  const count = computed(() => items.value.length)
  const isFull = computed(() => items.value.length >= MAX_CHOICES)
  // slots[0..4] : projet choisi en priorité 1..5, ou null.
  const slots = computed(() => {
    const s = Array(MAX_CHOICES).fill(null)
    for (const p of items.value) {
      if (p.priority >= 1 && p.priority <= MAX_CHOICES && !s[p.priority - 1]) s[p.priority - 1] = p
    }
    return s
  })

  function set(data) {
    items.value = data.map((p) => new Project(p)).sort((a, b) => a.priority - b.priority)
  }

  function priorityOf(projectId) {
    const p = items.value.find((item) => item.id === projectId)
    return p ? p.priority : null
  }

  function occupant(priority) {
    return items.value.find((item) => item.priority === priority) || null
  }

  async function fetch() {
    const { data } = await http.get('/project/preferred')
    set(data)
  }

  async function run(fn) {
    saving.value = true
    try {
      return await fn()
    } finally {
      saving.value = false
    }
  }

  // Envoie les priorités des projets donnés (le serveur met à jour ou ajoute, 5 au maximum).
  function savePriorities(list) {
    return run(async () => {
      const { data } = await http.post('/project/add-preference', { projects: list })
      set(data)
    })
  }

  function remove(projectId) {
    return run(async () => {
      const { data } = await http.post('/project/remove-preference', { projects: [projectId] })
      set(data)
    })
  }

  /**
   * Place le projet en priorité `priority`. Si la place est prise par un autre projet :
   * échange si le projet était déjà choisi, sinon remplacement (à confirmer par l'appelant).
   */
  async function choose(projectId, priority, { replace = false } = {}) {
    const current = priorityOf(projectId)
    if (current === priority) return
    const other = occupant(priority)
    if (other && current) {
      return savePriorities([{ id: projectId, priority }, { id: other.id, priority: current }])
    }
    if (other && !current) {
      if (!replace) throw new Error('occupied')
      await remove(other.id)
    }
    return savePriorities([{ id: projectId, priority }])
  }

  // Nouvel ordre des 5 places (projet ou null) après un glisser-déposer.
  function reorder(newSlots) {
    const list = newSlots.map((p, i) => (p ? { id: p.id, priority: i + 1 } : null)).filter(Boolean)
    if (!list.length) return Promise.resolve()
    // Affichage immédiat, le serveur confirme.
    items.value = newSlots.map((p, i) => (p ? Object.assign(p, { priority: i + 1 }) : null)).filter(Boolean)
    return savePriorities(list)
  }

  return { items, saving, count, isFull, slots, priorityOf, occupant, fetch, savePriorities, remove, choose, reorder }
})
