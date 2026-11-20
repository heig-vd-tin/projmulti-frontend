import { defineStore } from 'pinia'
import { ref } from 'vue'

const KEY = 'projectNav'

function load() {
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(KEY) || 'null')
    if (saved && Array.isArray(saved.items)) return saved
  } catch {
    /* stockage indisponible */
  }
  return null
}

// Liste d'où l'on a ouvert la page d'un projet : sert à « Précédent / Suivant » et au bouton Retour.
// Gardée dans l'onglet (sessionStorage) pour survivre à un rechargement de la page.
export const useProjectNavStore = defineStore('projectNav', () => {
  const saved = load()
  // [{ id, title }] dans l'ordre affiché par la liste (filtres et tri compris).
  const items = ref(saved ? saved.items : [])
  // Adresse complète de la liste (avec ses filtres) et son nom pour le bouton Retour.
  const back = ref(saved ? saved.back : '/all-projects')
  const label = ref(saved ? saved.label : 'Projets')

  function set(list, from, name) {
    items.value = list.map((p) => ({ id: p.id, title: p.title }))
    back.value = from
    label.value = name
    try {
      window.sessionStorage.setItem(KEY, JSON.stringify({ items: items.value, back: back.value, label: label.value }))
    } catch {
      /* stockage indisponible */
    }
  }

  return { items, back, label, set }
})
