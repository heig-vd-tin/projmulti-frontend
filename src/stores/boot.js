import { useAdminStore } from '@/stores/admin'
import { usePreferencesStore } from '@/stores/preferences'
import { useProjectsStore } from '@/stores/projects'
import { useSessionStore } from '@/stores/session'

// Données chargées au démarrage selon le rôle.
function loadRoleData(user) {
  const projects = useProjectsStore()
  const tasks = [projects.fetchAll()]
  if (user.isAdmin) {
    const admin = useAdminStore()
    tasks.push(projects.fetchOwned(), admin.fetchUsers(), admin.fetchStudents())
  } else if (user.isProfessor) {
    tasks.push(projects.fetchOwned())
  } else if (user.isStudent) {
    tasks.push(usePreferencesStore().fetch())
  }
  return Promise.all(tasks)
}

export function bootApp() {
  return useSessionStore().boot(loadRoleData)
}
