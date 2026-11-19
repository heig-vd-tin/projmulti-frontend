import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiErrorMessage } from '@/utils/errors'

// File de notifications (v-snackbar-queue). Les erreurs reprennent le message du serveur.
export const useNotifyStore = defineStore('notify', () => {
  const queue = ref([])

  function push(item) {
    queue.value.push({ timeout: 5000, location: 'bottom', ...item })
  }

  function success(text, title) {
    push({ text: title ? `${title} — ${text}` : text, color: 'success' })
  }

  function info(text) {
    push({ text, color: 'info' })
  }

  function warning(text) {
    push({ text, color: 'warning', timeout: 7000 })
  }

  function error(errOrText, title) {
    const text = typeof errOrText === 'string' ? errOrText : (errOrText && errOrText.userMessage) || apiErrorMessage(errOrText)
    push({ text: title ? `${title} : ${text}` : text, color: 'error', timeout: 9000 })
  }

  return { queue, push, success, info, warning, error }
})
