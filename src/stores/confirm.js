import { defineStore } from 'pinia'
import { ref } from 'vue'

// Boîte de confirmation unique, utilisable avec await : const ok = await confirm.ask({...}).
export const useConfirmStore = defineStore('confirm', () => {
  const current = ref(null)
  let resolver = null

  function ask(options) {
    if (resolver) resolver(false)
    current.value = {
      title: 'Confirmer',
      text: '',
      confirmText: 'Confirmer',
      cancelText: 'Annuler',
      color: 'primary',
      icon: 'mdi-help-circle-outline',
      ...options,
    }
    return new Promise((resolve) => { resolver = resolve })
  }

  function answer(value) {
    const r = resolver
    resolver = null
    current.value = null
    if (r) r(value)
  }

  return { current, ask, answer }
})
