export default class Project {
  constructor(data = {}) {
    this.id = data.id
    this.title = data.title ?? ''
    this.short_description = data.short_description ?? ''
    // La liste (/project/alld) n'a pas la description : null = pas encore chargée.
    this.description = data.description ?? null
    this.owner_id = data.owner_id
    this.owner = data.owner ?? null
    this.year = data.year ?? null
    this.selected = !!data.selected
    this.state = data.state ?? 0
    this.domains = data.domains ?? []
    this.tags = data.tags ?? []
    this.preferred_users = data.preferred_users ?? []
    this.assigned_users = data.assigned_users ?? []
    this.matched_users = data.matched_users ?? []
    // Priorité de l'étudiant connecté (/project/preferred)
    this.priority = data.priority ?? null
  }

  // Projet verrouillé : la répartition automatique garde exactement ses étudiants.
  get isLocked() { return this.state === 1 }
  get ownerName() { return this.owner ? [this.owner.firstname, this.owner.lastname].filter(Boolean).join(' ') : '' }

  preferredCount(maxPriority = 5) {
    return this.preferred_users.filter((u) => u.pivot && u.pivot.priority <= maxPriority).length
  }

  matchedCount(maxPriority = 5) {
    return this.matched_users.filter((u) => u.pivot && u.pivot.priority <= maxPriority).length
  }
}
