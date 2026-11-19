export const ROLES = { ADMIN: 'admin', PROFESSOR: 'professor', STUDENT: 'student' }

export const ROLE_LABELS = { admin: 'Responsable', professor: 'Enseignant·e', student: 'Étudiant·e' }

export default class User {
  constructor(data = {}) {
    this.id = data.id ?? null
    this.firstname = data.firstname ?? ''
    this.lastname = data.lastname ?? ''
    this.email = data.email ?? ''
    this.role = data.role ?? null
    this.orientation_id = data.orientation_id ?? null
    this.orientation = data.orientation ?? null
    this.excluded = !!data.excluded
    this.locked = !!data.locked
    this.preferences = (data.preferences ?? []).slice().sort((a, b) => a.priority - b.priority)
    this.assignments = data.assignments ?? []
    this.pivot = data.pivot ?? null
  }

  get isAdmin() { return this.role === ROLES.ADMIN }
  get isProfessor() { return this.role === ROLES.PROFESSOR }
  get isStudent() { return this.role === ROLES.STUDENT }
  // Enseignant au sens large : prof ou responsable.
  get isTeacher() { return this.isProfessor || this.isAdmin }
  get fullName() { return [this.firstname, this.lastname].filter(Boolean).join(' ') }
  get orientationAcronym() { return this.orientation ? this.orientation.acronym : '' }
  get assignedProjectId() { return this.assignments.length ? this.assignments[0].project_id : null }

  // Rang (1..5) du projet dans les choix de l'étudiant, null si hors choix.
  rankOf(projectId) {
    const p = this.preferences.find((pref) => pref.project_id === projectId)
    return p ? p.priority : null
  }
}
