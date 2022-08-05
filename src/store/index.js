import Vue from 'vue'
import Vuex from 'vuex'
import axios from "axios"

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    allProjects: [],
    myProjects: [],
    allUsers: [],
    unassignedUsers: [],
    orientations: [
      { header: "Génie électrique" },
      { text: "Electronique - Automatisation industrielle", value: "EAI" },
      { text: "Electronique embarquée - Mécatronique", value: "EEM" },
      { text: "Systèmes énergétiques", value: "EN" },
      { header: "Microtechniques" },
      { text: "Mécatronique", value: "MI" },
    ],
    tags: [
      "#Web",
      "#Programming",
      "#HMI",
      "#Electronics",
      "#Physics",
      "#Math",
      "#None",
    ],
  },
  getters: {
    getAllProjects: state => state.allProjects,
    getMyProjects: state => state.myProjects,
    getAllUsers: state => state.allUsers,
    getUnassignedUsers: state => state.unassignedUsers,
    getOrientations: state => state.orientations,
    getTags: state => state.tags,
  },
  mutations: {
    setAllProjects(state, payload) { 
      state.allProjects = payload
      state.allProjects.forEach(project => addLoading(project))
    },
    pushAllProjects(state, payload) { 
      addLoading(payload)
      state.allProjects.push(payload)
     },
    setMyProjects(state, payload) {
      state.myProjects = payload
      state.myProjects.forEach(project => addLoading(project))
    },
    pushMyProjects(state, payload) {
      addLoading(payload)
      state.myProjects.push(payload)
    },
    setAllUsers(state, payload) { state.allUsers = payload },
    setUnassignedUsers(state, payload) { state.unassignedUsers = payload },
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
    },
    retrieveUnassignedUsers(context) {
      return axios.get("/user/unassigned").then(response => context.commit("setUnassignedUsers", response.data))
    },
    addAttribution(context, payload) {
      return axios.post("/project/add-attribution", payload)
    },
    removeAttribution(context, payload) {
      return axios.post("/project/remove-attribution", payload)
    }
  },
  modules: {
  }
})

function addProperty(object, name, value) {
  Vue.set(object, name, value)
}

function addLoading(object) {
  addProperty(object, "loading", false)
}