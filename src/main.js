import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@fontsource-variable/inter'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import { initAuth } from './auth'
import './styles/main.css'

async function start() {
  // En production, initAuth redirige vers la page de connexion Keycloak si nécessaire.
  try {
    await initAuth()
  } catch (error) {
    console.error('Keycloak', error)
    const boot = document.getElementById('boot')
    if (boot) boot.lastElementChild.textContent = "Le service de connexion de l'école est injoignable. Réessayez dans quelques minutes."
    return
  }
  const app = createApp(App)
  app.use(createPinia())
  app.use(vuetify)
  app.use(router)
  app.mount('#app')
}

start()
