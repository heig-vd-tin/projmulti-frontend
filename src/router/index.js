import Vue from 'vue'
import VueRouter from 'vue-router'
import store from '@/store'

Vue.use(VueRouter)

const routes = [
  {
    path: "*",
    redirect: "/"
  },
  {
    path: "/",
    redirect: "/all-projects"
  },
  {
    path: "/all-projects",
    name: "AllProjects",
    component: () => import("@/views/allProjects/AllProjects")
  },
  {
    path: "/my-projects",
    name: "MyProjects",
    component: () => import("@/views/myProjects/MyProjects")
  },
  {
    path: "/new-project",
    name: "NewProject",
    component: () => import("@/views/NewProject"),
    beforeEnter: (to, from, next) => store.dispatch('ensureUser').then(() => next(store.getters.getUser.isTeacher)).catch(() => next(false))
  },
  {
    path: "/edit-project/:project_id",
    name: "EditProject",
    component: () => import("@/views/EditProject"),
    beforeEnter: (to, from, next) => store.dispatch('ensureUser').then(() => next(store.getters.getUser.isTeacher)).catch(() => next(false))
  },
  {
    path: "/global",
    name: "Global",
    component: () => import("@/views/Global"),
    beforeEnter: (to, from, next) => store.dispatch('ensureUser').then(() => next(store.getters.getUser.isAdmin)).catch(() => next(false))
  },
  {
    path: "/select",
    name: "Select",
    component: () => import("@/views/Select"),
    beforeEnter: (to, from, next) => store.dispatch('ensureUser').then(() => next(store.getters.getUser.isAdmin)).catch(() => next(false))
  },
  {
    path: "/settings",
    name: "Settings",
    component: () => import("@/views/Settings"),
    beforeEnter: (to, from, next) => store.dispatch('ensureUser').then(() => next(store.getters.getUser.isAdmin)).catch(() => next(false))
  },
  {
    path: "/infos",
    name: "Infos",
    component: () => import("@/views/Infos"),
    beforeEnter: (to, from, next) => store.dispatch('ensureUser').then(() => next(store.getters.getUser.isAdmin)).catch(() => next(false))
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
