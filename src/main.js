import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import router from './router'
import store from './store'
import axios from 'axios'
import Notification from 'vue-notification'

axios.defaults.baseURL = 'http://localhost:8000/api'

Vue.config.productionTip = false
Vue.use(Notification)
new Vue({
  vuetify,
  router,
  store,
  render: h => h(App)
}).$mount('#app')