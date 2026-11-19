import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import http from '@/api/http'
import User from '@/models/User'

export const PHASES = {
  projects: {
    short: 'saisie des projets',
    title: 'Saisie des projets',
    description: 'Les enseignants proposent et modifient leurs projets. Les étudiants n’ont pas accès.',
    icon: 'mdi-pencil-ruler',
  },
  preferences: {
    short: 'choix des étudiants',
    title: 'Choix des étudiants',
    description: 'Les étudiants choisissent 5 projets. Les enseignants consultent sans modifier.',
    icon: 'mdi-format-list-numbered',
  },
  closed: {
    short: 'fermé',
    title: 'Fermé (répartition)',
    description: 'Répartition en cours : les enseignants consultent, les étudiants n’ont pas accès.',
    icon: 'mdi-lock-outline',
  },
}

// Utilisateur connecté, réglages (phase, année) et données de référence.
export const useSessionStore = defineStore('session', () => {
  const user = ref(new User())
  const settings = ref({ phase: 'closed', current_year: null, years: [] })
  const selectedYear = ref(null)
  const domains = ref([])
  const orientations = ref([])
  const tags = ref([])
  // loading | ready | closed (étudiant hors phase) | fatal (connexion impossible)
  const status = ref('loading')
  const fatalError = ref('')
  let bootPromise = null

  const phase = computed(() => settings.value.phase)
  const phaseInfo = computed(() => PHASES[phase.value] || PHASES.closed)
  const currentYear = computed(() => settings.value.current_year)
  const year = computed(() => selectedYear.value || settings.value.current_year)
  const isCurrentYear = computed(() => year.value === settings.value.current_year)
  // Le prof crée / modifie ses projets seulement pendant la phase « projects » ; l'admin toujours.
  const canEditProjects = computed(() => user.value.isAdmin || (user.value.isTeacher && phase.value === 'projects'))
  const studentClosed = computed(() => user.value.isStudent && phase.value !== 'preferences')
  const years = computed(() => {
    const ys = new Set(settings.value.years || [])
    if (settings.value.current_year) ys.add(settings.value.current_year)
    return [...ys].sort((a, b) => b - a)
  })

  async function fetchUser() {
    const { data } = await http.get('/user/me')
    user.value = new User(data)
  }

  async function fetchSettings() {
    const { data } = await http.get('/settings')
    settings.value = data
  }

  async function fetchReference() {
    const [o, d, t] = await Promise.all([http.get('/orientation/all'), http.get('/domain/all'), http.get('/tag/all')])
    orientations.value = o.data
    domains.value = d.data
    tags.value = t.data
  }

  async function updateSettings(payload) {
    const { data } = await http.put('/settings', payload)
    settings.value = data
  }

  async function startNewYear(payload) {
    const { data } = await http.post('/settings/new-year', payload)
    settings.value = data
    selectedYear.value = null
  }

  function markClosed() {
    status.value = 'closed'
  }

  /** Démarrage : utilisateur, réglages puis données selon le rôle (loadRoleData fourni par App). */
  function boot(loadRoleData) {
    if (!bootPromise) {
      bootPromise = (async () => {
        try {
          await fetchUser()
          await fetchSettings()
          if (studentClosed.value) {
            status.value = 'closed'
            return
          }
          await Promise.all([fetchReference(), loadRoleData ? loadRoleData(user.value) : null])
          status.value = 'ready'
        } catch (error) {
          if (error.apiCode === 'phase_closed') {
            status.value = 'closed'
          } else if (error.status === 401) {
            fatalError.value = "Votre compte n'a pas pu être identifié (annuaire de l'école). Contactez le responsable du cours."
            status.value = 'fatal'
          } else if (!user.value.id) {
            fatalError.value = error.userMessage || 'Le serveur ne répond pas. Réessayez dans quelques minutes.'
            status.value = 'fatal'
          } else {
            // Données partielles : l'application reste utilisable, l'erreur est notifiée par App.
            status.value = 'ready'
            throw error
          }
        }
      })()
    }
    return bootPromise
  }

  return {
    user, settings, selectedYear, domains, orientations, tags, status, fatalError,
    phase, phaseInfo, currentYear, year, isCurrentYear, canEditProjects, studentClosed, years,
    fetchUser, fetchSettings, fetchReference, updateSettings, startNewYear, markClosed, boot,
  }
})
