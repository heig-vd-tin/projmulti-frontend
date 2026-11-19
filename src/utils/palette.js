// Couleurs et icônes par domaine. La couleur ne sert qu'aux icônes (contraste graphique ≥ 3:1) :
// les libellés restent dans les couleurs de texte. Icônes choisies pour être distinctes à petite taille.
const DOMAINS = {
  1: { icon: 'mdi-wrench-outline', light: '#55657a', dark: '#aab6c6' }, // Mécanique : ardoise
  2: { icon: 'mdi-chip', light: '#3b62a3', dark: '#9db8e8' }, // Électronique : bleu doux
  3: { icon: 'mdi-flash-outline', light: '#a66a00', dark: '#e0bf7a' }, // Électricité : ocre
  4: { icon: 'mdi-thermometer', light: '#d2600f', dark: '#f59a55' }, // Thermique : orange franc
  5: { icon: 'mdi-solar-power-variant-outline', light: '#2a7056', dark: '#8fd0b4' }, // Énergie : vert sauge
  6: { icon: 'mdi-code-tags', light: '#6a4fa3', dark: '#c3b2ea' }, // Programmation : violet doux
}
const FALLBACK = { icon: null, light: '#5d6370', dark: '#aeb4bf' }

const idOf = (d) => (typeof d === 'object' && d ? d.id : d)

export function domainColor(domainOrId, dark = false) {
  const c = DOMAINS[idOf(domainOrId)] || FALLBACK
  return dark ? c.dark : c.light
}

export function domainIcon(domain) {
  const c = DOMAINS[idOf(domain)]
  return (c && c.icon) || (domain && domain.icon) || 'mdi-shape-outline'
}

// Ordre canonique des domaines (celui des filtres) : par identifiant.
export function sortDomains(domains) {
  return (domains || []).slice().sort((a, b) => a.id - b.id)
}

// Orientations qui participent aux projets multidisciplinaires cette année.
export const ACTIVE_ORIENTATIONS = ['EAI', 'EEM', 'EN', 'MI', 'SIC']
