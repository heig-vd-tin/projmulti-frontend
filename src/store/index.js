import Vue from 'vue'
import Vuex from 'vuex'
import axios from "axios"
import User from "@/data/user"
import Project from "@/data/project"

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    user: new User({}),
    allProjects: [],
    myProjects: [],
    allUsers: [],
    allStudents: [],
    unassignedUsers: [],
    orientations: [],
    domains: [],
    tags: [],
  },
  getters: {
    getUser: state => state.user,
    getAllProjects: state => state.allProjects,
    getMyProjects: state => state.myProjects,
    getAllUsers: state => state.allUsers,
    getAllStudents: state => state.allStudents,
    getUnassignedUsers: state => state.unassignedUsers,
    getOrientations: state => state.orientations,
    getDomains: state => state.domains,
    getTags: state => state.tags,
  },
  mutations: {
    setUser(state, payload) { state.user = new User(payload) },
    setAllProjects(state, payload) {
      state.allProjects = payload.map(project => new Project(project))
      //state.allProjects.forEach(project => addLoading(project))
    },
    pushAllProjects(state, payload) {
      //addLoading(payload)
      state.allProjects.push(new Project(payload))
    },
    updateAllProjects(state, payload) {
      let index = state.allProjects.findIndex(item => item.id == payload.id)
      if (index == -1) return
      //addLoading(payload)
      Object.assign(state.allProjects[index], new Project(payload))
    },
    setPreferredProjects(state, payload) {
      state.myProjects = payload.sort((a, b) => a.priority - b.priority)
      //state.myProjects.forEach(project => addLoading(project))
    },
    setOwnedProjects(state, payload) {
      state.myProjects = payload.map(project => new Project(project))
      // state.myProjects.forEach(project => {
      //   addLoading(project)
      //   addEditing(project)
      // })
    },
    pushMyProjects(state, payload) {
      // addLoading(payload)
      // addEditing(payload)
      state.myProjects.push(new Project(payload))
    },
    updateMyProjects(state, payload) {
      let index = state.myProjects.findIndex(item => item.id == payload.id)
      if (index == -1) return
      // addLoading(payload)
      // addEditing(payload)
      Object.assign(state.myProjects[index], new Project(payload))
    },
    setAllUsers(state, payload) { state.allUsers = payload.map(user => new User(user)) },
    setAllStudents(state, payload) { state.allStudents = payload.map(user => new User(user)) },
    setUnassignedUsers(state, payload) { state.unassignedUsers = payload.map(user => new User(user)) },
    pushUnassignedUsers(state, payload) {
      state.unassignedUsers.push(new User(payload))
    },
    removeUnassignedUsers(state, payload) {
      let index = state.unassignedUsers.findIndex(item => item.id == payload.id)
      if (index == -1) return
      state.unassignedUsers.splice(index, 1)
    },
    setOrientations(state, payload) { state.orientations = payload },
    setDomains(state, payload) { state.domains = payload },
    setTags(state, payload) { state.tags = payload },
  },
  actions: {
    retrieveUser(context) {
      return axios.get("/user/me").then(response => context.commit("setUser", response.data))
    },
    retrieveAllProjects(context) {
      return axios.get("/project/alld").then(response => context.commit("setAllProjects", response.data))
    },
    retrievePreferredProjects(context) {
      return axios.get("/project/preferred").then(response => context.commit("setPreferredProjects", response.data))
    },
    retrieveOwnedProjects(context) {
      return axios.get("/project/owned").then(response => context.commit("setOwnedProjects", response.data))
    },
    createProject(context, payload) {
      return axios.post("/project/create", payload).then(response => {
        context.commit("pushAllProjects", response.data)
        context.commit("pushMyProjects", response.data)
      })
    },
    editProject(context, payload) {
      return axios.post("/project/edit", payload).then(response => {
        context.commit("updateAllProjects", response.data)
        context.commit("updateMyProjects", response.data)
      })
    },
    selectProject(context, payload) {
      return axios.post("/project/select", payload).then(response => context.commit("updateAllProjects", response.data))
    },
    lockProject(context, payload) {
      console.log("lock....")
      console.log(payload)
      console.log(context)
      return axios.post("/project/lock", payload).then(response => context.commit("updateAllProjects", response.data))
    },
    addProjectPreference(context, payload) {
      return axios.post("/project/add-preference", payload).then(response => context.commit("setPreferredProjects", response.data))
    },
    removeProjectPreference(context, payload) {
      return axios.post("/project/remove-preference", payload).then(response => context.commit("setPreferredProjects", response.data))
    },
    retrieveAllUsers(context) {
      return axios.get("/user/all").then(response => context.commit("setAllUsers", response.data))
    },
    retrieveAllStudents(context) {
      return axios.get("/user/all-students").then(response => context.commit("setAllStudents", response.data))
    },
    retrieveUnassignedUsers(context) {
      return axios.get("/user/unassigned").then(response => context.commit("setUnassignedUsers", response.data))
    },
    addAssignment(context, payload) {
      return axios.post("/project/add-assignment", payload).then(response => context.commit("removeUnassignedUsers", response.data))
    },
    removeAssignment(context, payload) {
      return axios.post("/project/remove-assignment", payload).then(response => context.commit("pushUnassignedUsers", response.data))
    },
    retrieveOrientations(context) {
      return axios.get("/orientation/all").then(response => context.commit("setOrientations", response.data))
    },
    retrieveDomains(context) {
      return axios.get("/domain/all").then(response => context.commit("setDomains", response.data))
    },
    retrieveTags(context) {
      return axios.get("/tag/all").then(response => context.commit("setTags", response.data))
    },
  },
  modules: {
  }
})

// function addProperty(object, name, value) {
//   Vue.set(object, name, value)
// }

// function addLoading(object) {
//   addProperty(object, "loading", false)
// }

// function addEditing(object) {
//   addProperty(object, "editing", false)
// }