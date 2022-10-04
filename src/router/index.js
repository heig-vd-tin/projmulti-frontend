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
    beforeEnter: (to, from, next) => next(store.getters.getUser.isTeacher)
  },
  {
    path: "/edit-project/:project_id",
    name: "EditProject",
    component: () => import("@/views/EditProject"),
    beforeEnter: (to, from, next) => next(store.getters.getUser.isTeacher)
  },
  {
    path: "/global",
    name: "Global",
    component: () => import("@/views/Global"),
    beforeEnter: (to, from, next) => next(store.getters.getUser.isAdmin)
  },
  {
    path: "/select",
    name: "Select",
    component: () => import("@/views/Select"),
    beforeEnter: (to, from, next) => next(store.getters.getUser.isAdmin)
  },
  {
    path: "/infos",
    name: "Infos",
    component: () => import("@/views/Infos"),
    beforeEnter: (to, from, next) => next(store.getters.getUser.isAdmin)
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
