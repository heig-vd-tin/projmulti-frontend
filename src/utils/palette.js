// Couleurs par domaine et par orientation : une teinte claire (thème clair) et une plus lumineuse
// (thème sombre), choisies pour un contraste suffisant du texte sur fond teinté.
const DOMAIN_COLORS = {
  1: { light: '#55657a', dark: '#aab6c6' }, // Mécanique : ardoise
  2: { light: '#3b62a3', dark: '#9db8e8' }, // Électronique : bleu doux
  3: { light: '#8a5d0c', dark: '#e0bf7a' }, // Électricité : ocre
  4: { light: '#a34b28', dark: '#e8a68a' }, // Thermique : terre cuite
  5: { light: '#2a7056', dark: '#8fd0b4' }, // Énergie : vert sauge
  6: { light: '#6a4fa3', dark: '#c3b2ea' }, // Programmation : violet doux
}
const FALLBACK = { light: '#5d6370', dark: '#aeb4bf' }

export function domainColor(domainOrId, dark = false) {
  const id = typeof domainOrId === 'object' && domainOrId ? domainOrId.id : domainOrId
  const c = DOMAIN_COLORS[id] || FALLBACK
  return dark ? c.dark : c.light
}

export function domainIcon(domain) {
  return (domain && domain.icon) || 'mdi-shape-outline'
}

const ORIENTATION_COLORS = {
  EAI: { light: '#6a4fa3', dark: '#c3b2ea' },
  EEM: { light: '#3b62a3', dark: '#9db8e8' },
  EN: { light: '#8a5d0c', dark: '#e0bf7a' },
  MI: { light: '#2b6e6a', dark: '#8ccfc8' },
  SIC: { light: '#55657a', dark: '#aab6c6' },
  EBA: { light: '#2a7056', dark: '#8fd0b4' },
  THI: { light: '#a34b28', dark: '#e8a68a' },
  THO: { light: '#9c3f6b', dark: '#e6a2c3' },
}

export function orientationColor(acronym, dark = false) {
  const c = ORIENTATION_COLORS[acronym] || FALLBACK
  return dark ? c.dark : c.light
}

// Orientations qui participent aux projets multidisciplinaires cette année.
export const ACTIVE_ORIENTATIONS = ['EAI', 'EEM', 'EN', 'MI', 'SIC']

// Couleur du rang d'un choix (1 = meilleur choix).
export function rankColor(rank) {
  if (!rank) return 'error'
  if (rank <= 2) return 'success'
  if (rank <= 3) return 'info'
  return 'warning'
}
