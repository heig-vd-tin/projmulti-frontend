import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: "/",
    redirect: "/all-projects"
  },
  {
    path: "/all-projects",
    name: "AllProjects",
    component: () => import("@/views/AllProjects")
  },
  {
    path: "/my-projects",
    name: "MyProjects",
    component: () => import("@/views/MyProjects")
  },
  {
    path: "/new-project",
    name: "NewProject",
    component: () => import("@/views/NewProject")
  },
  {
    path: "/global",
    name: "Global",
    component: () => import("@/views/Global")
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
