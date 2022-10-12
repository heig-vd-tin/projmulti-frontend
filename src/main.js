import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import router from './router'
import store from './store'
import axios from 'axios'
import Notification from 'vue-notification'
import Keycloak from 'keycloak-js'

//axios.defaults.baseURL = 'https//tin-projmulti.einet.ch/api'
axios.defaults.baseURL = '/api'
axios.interceptors.response.use((response) => response, (error) => {
  if (error.response.status === 403) window.location.reload()
  return Promise.reject(error.message)
})

let initOptions = {
  url: `${process.env.VUE_APP_CLOAK_URL}`,
  realm: `${process.env.VUE_APP_CLOAK_REALM}`,
  clientId: `${process.env.VUE_APP_CLOAK_CLIENT_ID}`,
}
let keycloak = new Keycloak(initOptions)

  keycloak.init({ onLoad: 'login-required' }).then((auth) => {
    if (!auth) {
      window.location.reload()
    }
    else {
      //console.log(keycloak.token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${keycloak.token}`
      Vue.config.productionTip = false
      Vue.use(Notification)
      new Vue({
        vuetify,
        router,
        store,
        render: h => h(App, { props: { keycloak: keycloak } })
      }).$mount('#app')
    }

    setInterval(() => {
      keycloak.updateToken(300).then((valid) => {
        if (valid) axios.defaults.headers.common['Authorization'] = `Bearer ${keycloak.token}`
      })
    }, 60000)
  })
