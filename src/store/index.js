import Vue from 'vue'
import Vuex from 'vuex'
import axios from "axios"

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    allProjects: [],
    myProjects: [],
    allUsers: [],
  },
  getters: {
    getAllProjects: state => state.allProjects,
    getMyProjects: state => state.myProjects,
    getAllUsers: state => state.allUsers
  },
  mutations: {
    setAllProjects(state, payload) { state.allProjects = payload },
    pushAllProjects(state, payload) { state.allProjects.push(payload) },
    setMyProjects(state, payload) {
      state.myProjects = []
      payload.forEach(project => {
        project.loading = false
        state.myProjects.push(project)
      })
    },
    pushMyProjects(state, payload) {
      payload.loading = false
      state.myProjects.push(payload)
    },
    setAllUsers(state, payload) { state.allUsers = payload }
  },
  actions: {
    retrieveAllProjects(context) {
      return axios.get("/project/all").then(response => context.commit("setAllProjects", response.data))
    },
    retrieveMyProjects(context) {
      return axios.get("/project/preffered").then(response => context.commit("setMyProjects", response.data))
    },
    submitProjectForm(context, payload) {
      return axios.post("/project/submit", payload).then(response => context.commit("pushAllProjects", response.data))
    },
    submitProjectPreference(context, payload) {
      return axios.post("/project/add-preference", payload).then(response => context.commit("setMyProjects", response.data))
    },
    removeProjectPreference(context, payload) {
      return axios.post("/project/remove-preference", payload).then(response => context.commit("setMyProjects", response.data))
    },
    retrieveAllUsers(context) {
      return axios.get("/user/all").then(response => context.commit("setAllUsers", response.data))
    }
  },
  modules: {
  }
})
