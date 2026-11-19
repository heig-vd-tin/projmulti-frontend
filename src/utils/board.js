// Rampe séquentielle d'une seule teinte pour le rang obtenu (1 = meilleur choix) :
// 1 vert foncé plein, 2 vert moyen, 3 vert clair, 4 et 5 gris, hors choix rouge. Le chiffre reste affiché.
export function rankTone(rank) {
  if (rank == null) return 'out'
  if (rank >= 1 && rank <= 3) return `r${rank}`
  return 'r45'
}

export function rankText(rank) {
  return rank == null ? 'hors choix' : `choix ${rank}`
}

// Couverture d'un domaine par les orientations des étudiants d'un projet.
export function domainCoverage(domainId, members, mapping) {
  const row = mapping.find((r) => r.domain_id === domainId)
  if (!row) return { state: 'unknown', by: [] }
  const base = members.filter((s) => row.base.includes(s.orientation_id))
  if (base.length) return { state: 'ok', by: base }
  const enlarged = members.filter((s) => row.enlarged.includes(s.orientation_id))
  if (enlarged.length) return { state: 'partial', by: enlarged }
  return { state: 'missing', by: [] }
}

export function defaultFilename() {
  const now = new Date()
  const pad = (n) => (n < 10 ? '0' : '') + n
  return `assignment_${now.getFullYear()}_${now.getMonth() + 1}_${now.getDate()}-${pad(now.getHours())}h${pad(now.getMinutes())}`
}

const PARAMS_KEY = 'solveParams'
export function loadSolveParams(defaults) {
  try {
    const saved = JSON.parse(window.localStorage.getItem(PARAMS_KEY) || 'null')
    return saved ? { ...defaults, ...saved } : { ...defaults }
  } catch {
    return { ...defaults }
  }
}
export function saveSolveParams(params) {
  try {
    window.localStorage.setItem(PARAMS_KEY, JSON.stringify(params))
  } catch {
    /* stockage indisponible */
  }
}

export function loadPref(key, fallback) {
  try {
    const v = window.localStorage.getItem(key)
    return v === null ? fallback : JSON.parse(v)
  } catch {
    return fallback
  }
}
export function savePref(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* stockage indisponible */
  }
}
