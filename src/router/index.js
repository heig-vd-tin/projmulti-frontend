import { createRouter, createWebHistory } from 'vue-router'
import { whenPageEntered } from '@/router/pageTransition'
import { bootApp } from '@/stores/boot'
import { useSessionStore } from '@/stores/session'

// Les anciennes adresses (/all-projects, /global...) sont gardées : liens déjà envoyés aux profs.
const routes = [
  { path: '/', redirect: '/all-projects' },
  {
    path: '/all-projects',
    name: 'projects',
    component: () => import('@/views/projects/ProjectsView.vue'),
    meta: { title: 'Projets' },
    // Anciens liens « /all-projects?p=42 » (détail en fenêtre) : page du projet.
    beforeEnter: (to) => (/^\d+$/.test(String(to.query.p || '')) ? { name: 'project', params: { id: String(to.query.p) } } : true),
  },
  {
    path: '/project/:id(\\d+)',
    name: 'project',
    component: () => import('@/views/projects/ProjectView.vue'),
    props: true,
    meta: { title: 'Projet' },
  },
  {
    path: '/my-projects',
    name: 'mine',
    component: () => import('@/views/MineView.vue'),
    meta: { title: 'Mes projets' },
  },
  {
    path: '/new-project',
    name: 'project-new',
    component: () => import('@/views/projects/ProjectEditView.vue'),
    meta: { title: 'Nouveau projet', roles: ['professor', 'admin'] },
  },
  {
    path: '/edit-project/:id(\\d+)',
    name: 'project-edit',
    component: () => import('@/views/projects/ProjectEditView.vue'),
    props: true,
    meta: { title: 'Modifier le projet', roles: ['professor', 'admin'] },
  },
  {
    path: '/global',
    name: 'board',
    component: () => import('@/views/admin/BoardView.vue'),
    meta: { title: 'Répartition', roles: ['admin'], wide: true },
  },
  {
    path: '/select',
    name: 'selection',
    component: () => import('@/views/admin/SelectionView.vue'),
    meta: { title: 'Sélection des projets', roles: ['admin'] },
  },
  {
    path: '/infos',
    name: 'stats',
    component: () => import('@/views/admin/StatsView.vue'),
    meta: { title: 'Statistiques', roles: ['admin'] },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/admin/SettingsView.vue'),
    meta: { title: 'Réglages', roles: ['admin'] },
  },
  { path: '/:pathMatch(.*)*', redirect: '/all-projects' },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, saved) {
    // Retour à une liste : on attend la fin du fondu entre pages, sinon la liste n'est pas encore là.
    if (saved) return to.path === from.path ? saved : whenPageEntered().then(() => saved)
    if (to.path === from.path) return false
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  const session = useSessionStore()
  // Démarrage idempotent : la première navigation attend l'utilisateur et la phase.
  await bootApp().catch(() => {})
  if (session.status !== 'ready') return true
  if (to.meta.roles && !to.meta.roles.includes(session.user.role)) return { name: 'projects' }
  return true
})

router.afterEach((to) => {
  const base = 'Projets multidisciplinaires · HEIG-VD'
  document.title = to.meta.title ? `${to.meta.title} · ${base}` : base
})

export default router
