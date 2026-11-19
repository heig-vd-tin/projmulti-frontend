<template>
  <div class="status-screen">
    <div v-if="status === 'loading'" class="text-center" role="status" aria-live="polite">
      <v-progress-circular indeterminate color="primary" size="44" width="4" />
      <div class="mt-4 muted">Chargement de l'application…</div>
    </div>

    <v-card v-else class="status-card surface-card text-center" max-width="560">
      <v-card-text class="pa-8">
        <div class="status-icon" :class="`status-icon--${status}`">
          <v-icon :icon="status === 'fatal' ? 'mdi-account-alert-outline' : 'mdi-calendar-clock'" size="36" />
        </div>
        <template v-if="status === 'fatal'">
          <h1 class="text-h5 font-weight-bold mt-5 mb-3">Connexion impossible</h1>
          <p class="text-body-1 muted mb-6">{{ message }}</p>
          <div class="d-flex justify-center flex-wrap ga-2">
            <v-btn color="primary" variant="flat" prepend-icon="mdi-refresh" @click="reload">Réessayer</v-btn>
            <v-btn variant="outlined" prepend-icon="mdi-logout" @click="logout">Se déconnecter</v-btn>
          </div>
        </template>
        <template v-else>
          <h1 class="text-h5 font-weight-bold mt-5 mb-3">La plateforme n'est pas encore ouverte</h1>
          <p class="text-body-1 muted mb-2">
            Le choix des projets n'est pas ouvert pour le moment. Vous recevrez un message lorsque vous pourrez choisir vos projets.
          </p>
          <p v-if="session.currentYear" class="text-body-2 muted mb-6">Cours {{ session.currentYear }} · {{ session.phaseInfo.short }}</p>
          <v-btn variant="outlined" prepend-icon="mdi-logout" @click="logout">Se déconnecter</v-btn>
        </template>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { logout } from '@/auth'
import { useSessionStore } from '@/stores/session'

defineProps({
  status: { type: String, required: true },
  message: { type: String, default: '' },
})

const session = useSessionStore()

function reload() {
  window.location.reload()
}
</script>

<style scoped>
.status-screen {
  min-height: calc(100vh - 64px);
  display: grid;
  place-items: center;
  padding: 24px 16px;
}
.status-card { width: 100%; }
.status-icon {
  width: 72px; height: 72px; margin: 0 auto; border-radius: var(--radius-card);
  display: grid; place-items: center;
  background: var(--neutral-chip-bg); color: var(--text-secondary);
}
.status-icon--fatal { background: var(--error-bg); color: rgb(var(--v-theme-error)); }
</style>
