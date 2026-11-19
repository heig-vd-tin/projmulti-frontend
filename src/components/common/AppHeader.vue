<template>
  <v-app-bar flat height="64" class="app-header" color="surface">
    <template #prepend>
      <v-app-bar-nav-icon
        v-if="!showTabs && ready"
        aria-label="Ouvrir le menu"
        @click="$emit('update:drawer', !drawer)"
      />
    </template>

    <router-link to="/" class="brand" aria-label="Accueil : liste des projets">
      <BrandMark :size="36" />
      <div class="brand-text">
        <span class="brand-school">HEIG-VD</span>
        <span class="brand-name">Projets multidisciplinaires</span>
      </div>
    </router-link>

    <v-tabs
      v-if="showTabs && ready"
      :model-value="activeNav"
      class="app-nav ml-4"
      color="primary"
      height="64"
      slider-color="primary"
      aria-label="Navigation principale"
    >
      <v-tab v-for="item in nav" :key="item.to" :value="item.to" :to="item.to" class="px-3">
        {{ item.title }}
        <v-badge v-if="item.badge" :content="item.badge" inline :color="item.badgeColor || 'surface-light'" class="ml-1" />
      </v-tab>
    </v-tabs>

    <v-spacer />

    <v-btn
      v-if="ready && session.user.isProfessor && session.canEditProjects && mdAndUp"
      to="/new-project"
      color="primary"
      variant="flat"
      prepend-icon="mdi-plus"
      class="mr-3"
    >
      Nouveau projet
    </v-btn>

    <PhaseChip v-if="session.currentYear && smAndUp" class="mr-2" />

    <DevUserMenu v-if="DEV_AUTH" class="mr-1" />

    <v-btn
      v-if="smAndUp"
      icon
      variant="text"
      :aria-label="isDark ? 'Passer au thème clair' : 'Passer au thème sombre'"
      @click="toggleTheme"
    >
      <v-icon :icon="isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'" />
      <v-tooltip activator="parent">{{ isDark ? 'Thème clair' : 'Thème sombre' }}</v-tooltip>
    </v-btn>

    <v-menu v-if="session.user.id" location="bottom end" offset="8">
      <template #activator="{ props }">
        <v-btn v-bind="props" icon variant="text" class="mr-2" :aria-label="`Compte de ${session.user.fullName}`">
          <v-avatar color="primary" variant="tonal" size="36">
            <span class="text-body-2 font-weight-bold">{{ userInitials }}</span>
          </v-avatar>
        </v-btn>
      </template>
      <v-card min-width="260" border>
        <v-card-item>
          <v-card-title class="text-body-1 font-weight-bold">{{ session.user.fullName }}</v-card-title>
          <v-card-subtitle>{{ session.user.email }}</v-card-subtitle>
        </v-card-item>
        <v-card-text class="pt-0">
          <v-chip size="small" variant="tonal" :prepend-icon="roleIcon">{{ roleLabel }}</v-chip>
          <v-chip v-if="session.user.orientation" size="small" variant="tonal" class="ml-1">{{ session.user.orientation.acronym }}</v-chip>
        </v-card-text>
        <v-divider />
        <v-list density="compact" nav>
          <v-list-item
            v-if="!smAndUp"
            :prepend-icon="isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
            :title="isDark ? 'Thème clair' : 'Thème sombre'"
            @click="toggleTheme"
          />
          <v-list-item prepend-icon="mdi-logout" title="Se déconnecter" @click="logout" />
        </v-list>
      </v-card>
    </v-menu>
    <v-btn v-else variant="text" prepend-icon="mdi-logout" class="mr-2" @click="logout">Se déconnecter</v-btn>
  </v-app-bar>

  <v-navigation-drawer
    v-if="!showTabs && ready"
    :model-value="drawer"
    temporary
    width="290"
    @update:model-value="$emit('update:drawer', $event)"
  >
    <div class="pa-4 d-flex align-center ga-3">
      <BrandMark :size="32" />
      <div class="text-body-2 font-weight-bold">Projets multidisciplinaires</div>
    </div>
    <div v-if="session.currentYear" class="px-4 pb-2"><PhaseChip /></div>
    <v-divider />
    <v-list nav density="comfortable" aria-label="Navigation principale">
      <v-list-item
        v-for="item in nav"
        :key="item.to"
        :to="item.to"
        :prepend-icon="item.icon"
        :title="item.title"
        color="primary"
        @click="$emit('update:drawer', false)"
      >
        <template v-if="item.badge" #append>
          <v-chip size="x-small" variant="tonal">{{ item.badge }}</v-chip>
        </template>
      </v-list-item>
      <v-list-item
        v-if="session.user.isTeacher && session.canEditProjects"
        to="/new-project"
        prepend-icon="mdi-plus"
        title="Nouveau projet"
        color="primary"
        @click="$emit('update:drawer', false)"
      />
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useDisplay, useTheme } from 'vuetify'
import { DEV_AUTH, logout } from '@/auth'
import DevUserMenu from '@/components/common/DevUserMenu.vue'
import PhaseChip from '@/components/common/PhaseChip.vue'
import BrandMark from '@/components/common/BrandMark.vue'
import { ROLE_LABELS } from '@/models/User'
import { MAX_CHOICES, usePreferencesStore } from '@/stores/preferences'
import { useSessionStore } from '@/stores/session'
import { initials } from '@/utils/text'

defineProps({ drawer: { type: Boolean, default: false } })
defineEmits(['update:drawer'])

const session = useSessionStore()
const prefs = usePreferencesStore()
const route = useRoute()
const theme = useTheme()
const { mdAndUp, lgAndUp, smAndUp } = useDisplay()

const ready = computed(() => session.status === 'ready')
const isDark = computed(() => theme.global.current.value.dark)
const userInitials = computed(() => initials(session.user))
const roleLabel = computed(() => ROLE_LABELS[session.user.role] || '')
const roleIcon = computed(() => ({ admin: 'mdi-shield-account-outline', professor: 'mdi-human-male-board', student: 'mdi-school-outline' })[session.user.role])

const nav = computed(() => {
  const u = session.user
  const items = [{ to: '/all-projects', title: 'Projets', icon: 'mdi-view-grid-outline' }]
  if (u.isStudent) {
    items.push({
      to: '/my-projects',
      title: 'Mes choix',
      icon: 'mdi-format-list-numbered',
      badge: `${prefs.count}/${MAX_CHOICES}`,
      badgeColor: prefs.count >= MAX_CHOICES ? 'success' : 'surface-light',
    })
  }
  if (u.isTeacher) items.push({ to: '/my-projects', title: 'Mes projets', icon: 'mdi-folder-account-outline' })
  if (u.isAdmin) {
    items.push(
      { to: '/global', title: 'Répartition', icon: 'mdi-account-group-outline' },
      { to: '/select', title: 'Sélection', icon: 'mdi-checkbox-marked-circle-outline' },
      { to: '/infos', title: 'Statistiques', icon: 'mdi-chart-box-outline' },
      { to: '/settings', title: 'Réglages', icon: 'mdi-cog-outline' },
    )
  }
  return items
})

const showTabs = computed(() => lgAndUp.value || (mdAndUp.value && nav.value.length <= 3))

const activeNav = computed(() => {
  if (route.path.startsWith('/edit-project') || route.path.startsWith('/new-project')) return '/my-projects'
  const item = nav.value.find((n) => route.path.startsWith(n.to))
  return item ? item.to : null
})

function toggleTheme() {
  const next = isDark.value ? 'light' : 'dark'
  theme.change(next)
  try {
    window.localStorage.setItem('theme', next)
  } catch {
    /* stockage indisponible */
  }
}
</script>

<style scoped>
.app-header { border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 12px;
  color: inherit;
  text-decoration: none;
  min-width: 0;
}
.brand-text { display: flex; flex-direction: column; line-height: 1.15; min-width: 0; }
.brand-school { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; color: rgb(var(--v-theme-primary)); }
.brand-name { font-size: 0.95rem; font-weight: 650; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
@media (max-width: 420px) {
  .brand-name { font-size: 0.85rem; }
}
.app-nav :deep(.v-tab) { font-weight: 550; font-size: 0.92rem; min-width: 0; }
</style>
