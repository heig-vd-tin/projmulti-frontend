import { downloadCsv, timestamp } from '@/utils/csv'

// Répartition actuelle, une ligne par étudiant affecté (mêmes colonnes que l'ancien export,
// project_id est maintenant le vrai numéro du projet).
export function exportAssignmentCsv(students, projectById) {
  const rows = []
  for (const s of students) {
    const pid = s.assignedProjectId
    if (!pid || s.excluded) continue
    const p = projectById.get(pid)
    rows.push([
      pid,
      p ? p.title : '',
      p ? p.ownerName : '',
      s.id,
      s.fullName,
      s.email,
      s.orientationAcronym,
      s.rankOf(pid) ?? 'hors choix',
      s.locked ? 'oui' : 'non',
    ])
  }
  rows.sort((a, b) => a[0] - b[0] || String(a[4]).localeCompare(String(b[4]), 'fr'))
  downloadCsv(
    `repartition_${timestamp()}.csv`,
    ['project_id', 'project_title', 'project_owner', 'student_id', 'student_fullname', 'student_email', 'orientation', 'priority', 'locked'],
    rows,
  )
  return rows.length
}

// Étudiants inscrits sur la plateforme avec leurs choix et leur affectation.
export function exportStudentsCsv(students, projectById) {
  const rows = students.map((s) => {
    const pid = s.assignedProjectId
    const p = pid ? projectById.get(pid) : null
    const choices = [1, 2, 3, 4, 5].map((rank) => {
      const pref = s.preferences.find((x) => x.priority === rank)
      return pref ? pref.project_id : ''
    })
    return [
      s.lastname, s.firstname, s.email, s.orientationAcronym,
      s.preferences.length, pid ? 'oui' : 'non',
      pid || '', p ? p.title : '', pid ? s.rankOf(pid) ?? 'hors choix' : '',
      s.excluded ? 'oui' : 'non', s.locked ? 'oui' : 'non',
      ...choices,
    ]
  })
  downloadCsv(
    `etudiants_${timestamp()}.csv`,
    ['Nom', 'Prénom', 'E-mail', 'Orientation', 'Nb choix', 'Affecté', 'Projet affecté', 'Titre du projet', 'Rang du choix', 'Exclu', 'Verrouillé', 'Choix 1', 'Choix 2', 'Choix 3', 'Choix 4', 'Choix 5'],
    rows,
  )
  return rows.length
}
