import Vue from 'vue'
import Vuex from 'vuex'
import axios from "axios"

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    projects: [],
  },
  getters: {
    getProjects: state => state.projects
  },
  mutations: {
    setProjects(state, payload) {
      state.projects = payload
    }
  },
  actions: {
    retrieveAllProjects(context) {
      axios.get("/project/all").then(response => context.commit("setProjects", response.data))
    },
    submitProjectForm(context, payload) {
      return axios.post("/project/submit", payload)
    }
  },
  modules: {
  }
})
