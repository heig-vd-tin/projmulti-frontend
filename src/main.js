import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import router from './router'
import store from './store'
import axios from 'axios'
import Notification from 'vue-notification'
import Keycloak from 'keycloak-js'
import { apiErrorMessage } from '@/data/errors'

axios.defaults.baseURL = '/api'

let initOptions = {
  url: `${process.env.VUE_APP_CLOAK_URL}`,
  realm: `${process.env.VUE_APP_CLOAK_REALM}`,
  clientId: `${process.env.VUE_APP_CLOAK_CLIENT_ID}`,
}
let keycloak = new Keycloak(initOptions)

// Les erreurs de l'API portent un message lisible (validation, droits, phase fermée).
axios.interceptors.response.use((response) => response, (error) => {
  if (error.response && error.response.status === 401 && process.env.NODE_ENV !== 'development') {
    keycloak.login()
  }
  error.userMessage = apiErrorMessage(error)
  return Promise.reject(error)
})

function mountApp() {
  Vue.config.productionTip = false
  Vue.use(Notification)
  new Vue({
    vuetify,
    router,
    store,
    render: h => h(App, { props: { keycloak: keycloak } })
  }).$mount('#app')
}

if (process.env.NODE_ENV == 'development') {
  // Sans Keycloak : le backend local connecte l'utilisateur ID_USER, ou celui choisi ici
  // (localStorage.devUser = id, puis recharger la page).
  axios.defaults.baseURL = process.env.VUE_APP_AXIOS_BASE_URL
  let devUser = null
  try { devUser = window.localStorage.getItem('devUser') } catch (e) { devUser = null }
  if (devUser) axios.defaults.headers.common['X-Dev-User'] = devUser
  keycloak = { logout: () => { try { window.localStorage.removeItem('devUser') } catch (e) { /* rien */ } window.location.reload() } }
  mountApp()
}
else {
  keycloak.init({ onLoad: 'login-required' }).then((auth) => {
    if (!auth) {
      window.location.reload()
      return
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${keycloak.token}`
    mountApp()

    setInterval(() => {
      keycloak.updateToken(300).then((valid) => {
        if (valid) axios.defaults.headers.common['Authorization'] = `Bearer ${keycloak.token}`
      })
    }, 60000)
  })
}
