import { computed } from 'vue'
import { useTheme } from 'vuetify'

export function useDark() {
  const theme = useTheme()
  return computed(() => theme.global.current.value.dark)
}
