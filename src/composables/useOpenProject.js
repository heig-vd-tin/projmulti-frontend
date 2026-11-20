import { useRoute, useRouter } from 'vue-router'
import { useProjectNavStore } from '@/stores/projectNav'

/**
 * Ouvre la page d'un projet en retenant la liste affichée (pour Précédent / Suivant)
 * et l'adresse de la liste (pour Retour, filtres compris).
 */
export function useOpenProject(label) {
  const router = useRouter()
  const route = useRoute()
  const nav = useProjectNavStore()
  return function openProject(list, project) {
    nav.set(list, route.fullPath, label)
    router.push({ name: 'project', params: { id: String(project.id) } })
  }
}
