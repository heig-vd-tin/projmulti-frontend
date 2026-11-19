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

    <v-snackbar-queue v-model="notify.queue" closable close-text="Fermer" location="bottom" :max-width="560" multi-line>
      <template #text="{ item }">
        <div class="d-flex align-start ga-3" role="status">
          <v-icon :icon="snackIcon(item.color)" class="mt-n1" />
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

function snackIcon(color) {
  return { success: 'mdi-check-circle-outline', error: 'mdi-alert-circle-outline', warning: 'mdi-alert-outline' }[color] || 'mdi-information-outline'
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
.page-enter-active, .page-leave-active { transition: opacity 0.12s ease; }
.page-enter-from, .page-leave-to { opacity: 0; }
.readonly-banner { border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
</style>
