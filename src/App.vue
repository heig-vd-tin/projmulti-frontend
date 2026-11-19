<template>
  <v-app>
    <AppHeader v-model:drawer="drawer" />

    <v-main>
      <StatusScreen v-if="session.status !== 'ready'" :status="session.status" :message="session.fatalError" />
      <template v-else>
        <v-alert
          v-if="session.user.isProfessor && session.phase !== 'projects' && isProjectPage"
          class="readonly-banner"
          type="info"
          variant="tonal"
          density="compact"
          icon="mdi-lock-outline"
          :rounded="0"
        >
          La saisie des projets est fermée : vous pouvez consulter et exporter vos projets, mais plus les modifier.
        </v-alert>
        <router-view v-slot="{ Component, route: r }">
          <transition name="page" mode="out-in">
            <component :is="Component" :key="r.path" />
          </transition>
        </router-view>
      </template>
    </v-main>

    <!-- Notifications sobres : fond neutre foncé, icône colorée selon le type. -->
    <v-snackbar-queue v-model="notify.queue" closable close-text="Fermer" :max-width="440" color="surface-variant" multi-line>
      <template #text="{ item }">
        <div class="d-flex align-start ga-3" role="status" :data-type="item.type">
          <v-icon :icon="snackIcon(item.type)" :class="`snack-icon snack-icon--${item.type}`" class="mt-n1" />
          <span>{{ item.text }}</span>
        </div>
      </template>
    </v-snackbar-queue>
    <ConfirmHost />
  </v-app>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import http from '@/api/http'
import AppHeader from '@/components/common/AppHeader.vue'
import ConfirmHost from '@/components/common/ConfirmHost.vue'
import StatusScreen from '@/components/common/StatusScreen.vue'
import { bootApp } from '@/stores/boot'
import { useNotifyStore } from '@/stores/notify'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const notify = useNotifyStore()
const route = useRoute()
const drawer = ref(false)

const isProjectPage = computed(() => ['projects', 'mine', 'project-new', 'project-edit'].includes(route.name))

function snackIcon(type) {
  return { success: 'mdi-check-circle-outline', error: 'mdi-alert-circle-outline', warning: 'mdi-alert-outline' }[type] || 'mdi-information-outline'
}

// La phase a changé pendant la session d'un étudiant : écran « pas encore ouverte ».
http.onPhaseClosed = () => {
  if (session.user.isStudent) session.markClosed()
}

onMounted(() => {
  bootApp().catch((error) => notify.error(error, 'Chargement incomplet'))
})
</script>

<style>
/* Notifications en bas à droite, au-dessus des barres d'actions collantes (formulaires, pieds de fenêtres) */
.v-snackbar.v-snackbar--bottom .v-snackbar__wrapper { margin-bottom: 88px !important; margin-right: 16px !important; }
.v-snackbar.v-snackbar--top .v-snackbar__wrapper { margin-top: 12px !important; }
@media (max-width: 600px) {
  .v-snackbar.v-snackbar--bottom .v-snackbar__wrapper { margin: 0 8px 88px !important; }
}
.snack-icon--success { color: #8fcfa9; }
.snack-icon--error { color: #f19a95; }
.snack-icon--warning { color: #e3bf7c; }
.snack-icon--info { color: #9cbde6; }
.v-theme--dark .snack-icon--success { color: #2f7a52; }
.v-theme--dark .snack-icon--error { color: #b03a3a; }
.v-theme--dark .snack-icon--warning { color: #94610f; }
.v-theme--dark .snack-icon--info { color: #3a679c; }
.page-enter-active, .page-leave-active { transition: opacity 0.12s ease; }
.page-enter-from, .page-leave-to { opacity: 0; }
.readonly-banner { border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
</style>
