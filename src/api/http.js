import axios from 'axios'
import { authHeaders, ensureFreshToken, handleUnauthorized } from '@/auth'
import { apiErrorMessage } from '@/utils/errors'

// Client unique de l'API Laravel. Chaque erreur reçoit `userMessage` (texte lisible) et
// `apiCode` (code métier du backend : phase_closed, forbidden).
const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
})

http.interceptors.request.use(async (config) => {
  await ensureFreshToken()
  Object.assign(config.headers, authHeaders())
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response && error.response.status
    if (status === 401) handleUnauthorized()
    const code = error.response && error.response.data && error.response.data.code
    if (code === 'phase_closed' && typeof http.onPhaseClosed === 'function') http.onPhaseClosed()
    error.status = status
    error.apiCode = code
    error.userMessage = apiErrorMessage(error)
    return Promise.reject(error)
  },
)

// Appelé quand le serveur répond « plateforme fermée » (la phase a changé pendant la session).
http.onPhaseClosed = null

export default http
