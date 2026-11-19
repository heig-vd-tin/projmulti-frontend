// Recherche insensible à la casse et aux accents.
export function normalize(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function matchesQuery(query, ...fields) {
  const q = normalize(query).trim()
  if (!q) return true
  const haystack = normalize(fields.filter(Boolean).join(' '))
  return q.split(/\s+/).every((word) => haystack.includes(word))
}

export function fullName(user) {
  if (!user) return ''
  return [user.firstname, user.lastname].filter(Boolean).join(' ')
}

export function initials(user) {
  if (!user) return '?'
  return ((user.firstname || '?')[0] + (user.lastname || '')[0]).toUpperCase()
}

export function plural(n, singular, pluralForm = singular + 's') {
  return `${n} ${n > 1 ? pluralForm : singular}`
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} ko`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`
}
