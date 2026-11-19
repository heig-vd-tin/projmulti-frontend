<template>
  <component
    :is="session.user.isAdmin ? 'router-link' : 'span'"
    :to="session.user.isAdmin ? '/settings' : undefined"
    class="phase-chip"
  >
    <span class="phase-dot" :class="`phase-dot--${session.phase}`" aria-hidden="true"></span>
    Cours {{ session.currentYear }} · {{ session.phaseInfo.short }}
    <v-tooltip activator="parent">
      {{ session.phaseInfo.description }}<template v-if="session.user.isAdmin"> (modifiable dans les réglages)</template>
    </v-tooltip>
  </component>
</template>

<script setup>
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
</script>

<style scoped>
/* Chip de phase neutre, avec une pastille (les teintes de couleur restent aux domaines) */
.phase-chip {
  display: inline-flex; align-items: center; gap: 7px; height: 28px; padding: 0 12px; border-radius: 999px;
  font-size: 0.8rem; font-weight: 600; white-space: nowrap; text-decoration: none;
  background: var(--neutral-chip-bg); color: rgb(var(--v-theme-on-surface));
}
a.phase-chip:hover { background: rgba(var(--v-border-color), 0.1); }
.phase-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--text-secondary); }
.phase-dot--projects { background: #2563eb; }
.phase-dot--preferences { background: #1f8a4c; }
.phase-dot--closed { background: #8a8d93; }
</style>
