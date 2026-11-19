<template>
  <v-menu location="bottom end" offset="8">
    <template #activator="{ props }">
      <v-chip v-bind="props" color="warning" variant="tonal" size="small" :prepend-icon="compact ? undefined : 'mdi-account-switch-outline'" aria-label="Changer d'utilisateur de test">
        <v-icon v-if="compact" icon="mdi-account-switch-outline" size="16" />
        <template v-else>Dev{{ current ? ` · ${current}` : '' }}</template>
      </v-chip>
    </template>
    <v-card min-width="280" border>
      <v-card-item>
        <v-card-title class="text-body-1 font-weight-bold">Utilisateur de test</v-card-title>
        <v-card-subtitle>Mode développement, sans Keycloak</v-card-subtitle>
      </v-card-item>
      <v-list density="compact" nav>
        <v-list-item
          v-for="u in DEV_USERS"
          :key="u.id"
          :prepend-icon="u.icon"
          :title="u.label"
          :subtitle="`id ${u.id}`"
          :active="current === String(u.id)"
          color="selected"
          @click="setDevUser(u.id)"
        />
        <v-list-item prepend-icon="mdi-account-cog-outline" title="Utilisateur par défaut (ID_USER)" :active="!current" @click="setDevUser(null)" />
      </v-list>
      <v-divider />
      <v-card-text class="d-flex ga-2 align-center">
        <v-text-field v-model="other" label="Autre id" density="compact" hide-details type="number" @keyup.enter="goOther" />
        <v-btn variant="tonal" :disabled="!other" @click="goOther">Utiliser</v-btn>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script setup>
import { ref } from 'vue'
import { DEV_USERS, getDevUser, setDevUser } from '@/auth'

defineProps({ compact: { type: Boolean, default: false } })

const current = getDevUser()
const other = ref('')

function goOther() {
  if (other.value) setDevUser(other.value)
}
</script>
