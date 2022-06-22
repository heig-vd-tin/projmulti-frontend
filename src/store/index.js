import Vue from 'vue'
import Vuex from 'vuex'
import axios from "axios"

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    allProjects: [],
    myProjects: [],
  },
  getters: {
    getAllProjects: state => state.allProjects,
    getMyProjects: state => state.myProjects,
  },
  mutations: {
    setAllProjects(state, payload) { state.allProjects = payload },
    pushAllProjects(state, payload) { state.allProjects.push(payload) },
    setMyProjects(state, payload) { state.myProjects = payload },
    pushMyProjects(state, payload) { state.myProjects.push(payload) },
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
    }
  },
  modules: {
  }
})
