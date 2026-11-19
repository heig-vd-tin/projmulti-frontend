<template>
  <v-chip
    :to="session.user.isAdmin ? '/settings' : undefined"
    :color="color"
    variant="tonal"
    size="small"
    :prepend-icon="session.phaseInfo.icon"
    class="phase-chip font-weight-medium"
  >
    Cours {{ session.currentYear }} · {{ session.phaseInfo.short }}
    <v-tooltip activator="parent">
      {{ session.phaseInfo.description }}<template v-if="session.user.isAdmin"> (modifiable dans les réglages)</template>
    </v-tooltip>
  </v-chip>
</template>

<script setup>
import { computed } from 'vue'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const color = computed(() => ({ projects: 'info', preferences: 'success', closed: 'neutral' })[session.phase] || 'neutral')
</script>
