// Authentification : Keycloak en production, sélection libre de l'utilisateur en développement.
export const DEV_AUTH = import.meta.env.VITE_DEV_AUTH === 'true'

// Comptes de test proposés par le sélecteur (mode développement uniquement).
export const DEV_USERS = [
  { id: 1, label: 'Responsable (admin)', icon: 'mdi-shield-account-outline' },
  { id: 3, label: 'Enseignant·e', icon: 'mdi-human-male-board' },
  { id: 222, label: 'Étudiant·e', icon: 'mdi-school-outline' },
]

let keycloak = null
const REFRESH_EVERY_MS = 60 * 1000
const MIN_VALIDITY_S = 300

export function getDevUser() {
  try {
    return window.localStorage.getItem('devUser')
  } catch {
    return null
  }
}

export function setDevUser(id) {
  try {
    if (id) window.localStorage.setItem('devUser', String(id))
    else window.localStorage.removeItem('devUser')
  } catch {
    /* stockage indisponible */
  }
  window.location.reload()
}

/** Initialise l'authentification. En production, redirige vers Keycloak si nécessaire. */
export async function initAuth() {
  if (DEV_AUTH) return
  const { default: Keycloak } = await import('keycloak-js')
  keycloak = new Keycloak({
    url: import.meta.env.VITE_CLOAK_URL,
    realm: import.meta.env.VITE_CLOAK_REALM,
    clientId: import.meta.env.VITE_CLOAK_CLIENT_ID,
  })
  // checkLoginIframe désactivé : pas d'iframe tierce (cookies tiers bloqués par les navigateurs),
  // le jeton est rafraîchi périodiquement ci-dessous.
  const authenticated = await keycloak.init({ onLoad: 'login-required', checkLoginIframe: false })
  if (!authenticated) {
    window.location.reload()
    await new Promise(() => {})
  }
  keycloak.onTokenExpired = () => keycloak.updateToken(30).catch(() => {})
  setInterval(() => keycloak.updateToken(MIN_VALIDITY_S).catch(() => {}), REFRESH_EVERY_MS)
}

/** Rafraîchit le jeton s'il expire dans moins de 30 s (après une mise en veille, par exemple). */
export async function ensureFreshToken() {
  if (DEV_AUTH || !keycloak) return
  try {
    await keycloak.updateToken(30)
  } catch {
    /* session expirée : la réponse 401 relancera la connexion */
  }
}

/** En-têtes d'authentification ajoutés à chaque requête vers l'API. */
export function authHeaders() {
  if (DEV_AUTH) {
    const devUser = getDevUser()
    return devUser ? { 'X-Dev-User': devUser } : {}
  }
  return keycloak && keycloak.token ? { Authorization: `Bearer ${keycloak.token}` } : {}
}

/**
 * Réponse 401 : on ne relance la connexion que si le jeton a expiré. Sinon (compte inconnu de
 * l'annuaire, par exemple) on laisse l'application afficher « Connexion impossible » : pas de boucle.
 */
export function handleUnauthorized() {
  if (!DEV_AUTH && keycloak && keycloak.isTokenExpired(5)) {
    keycloak.login()
    return true
  }
  return false
}

export function logout() {
  if (DEV_AUTH) {
    setDevUser(null)
    return
  }
  if (keycloak) keycloak.logout({ redirectUri: window.location.origin + '/' })
}
