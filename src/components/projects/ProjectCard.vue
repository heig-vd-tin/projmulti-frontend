<template>
  <article
    class="project-card"
    :class="{ 'project-card--chosen': !!priority }"
    tabindex="0"
    role="button"
    :aria-label="`Ouvrir le projet ${project.title}${priority ? `, votre choix n°${priority}` : ''}`"
    data-testid="project-card"
    @click="$emit('open', project)"
    @keydown.enter.prevent="$emit('open', project)"
    @keydown.space.prevent="$emit('open', project)"
  >
    <header class="d-flex align-start ga-3">
      <h3 class="card-title line-clamp-2">{{ project.title }}</h3>
      <v-spacer />
      <span v-if="priority" class="choice-pill"><v-icon icon="mdi-check" size="14" />n°{{ priority }}</span>
      <v-icon v-if="showAdmin && project.isLocked" icon="mdi-lock-outline" size="18" class="muted" aria-label="Projet verrouillé" />
    </header>

    <div class="owner text-body-2 muted">
      <v-icon icon="mdi-account-outline" size="16" />
      <span class="text-truncate">{{ project.ownerName || 'Responsable inconnu' }}</span>
      <span v-if="isMine" class="tag">Votre projet</span>
    </div>

    <p class="short line-clamp-3">{{ project.short_description }}</p>

    <footer class="d-flex align-center ga-2 flex-wrap">
      <DomainBadges :domains="project.domains" />
      <v-spacer />
      <template v-if="showAdmin">
        <span class="tag" :class="{ 'tag--ok': project.selected }">
          <v-icon :icon="project.selected ? 'mdi-check-circle-outline' : 'mdi-circle-outline'" size="14" />
          {{ project.selected ? 'Sélectionné' : 'Non sélectionné' }}
        </span>
        <span class="tag" :title="`Choisi par ${plural(project.preferredCount(5), 'étudiant')}, dont ${project.preferredCount(3)} en choix 1 à 3`">
          <v-icon icon="mdi-account-heart-outline" size="14" />{{ project.preferredCount(5) }} choix
        </span>
      </template>
      <span v-if="pastYear" class="tag">{{ project.year }}</span>
    </footer>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import DomainBadges from '@/components/projects/DomainBadges.vue'
import { usePreferencesStore } from '@/stores/preferences'
import { useSessionStore } from '@/stores/session'
import { plural } from '@/utils/text'

const props = defineProps({ project: { type: Object, required: true } })
defineEmits(['open'])

const session = useSessionStore()
const prefs = usePreferencesStore()

const priority = computed(() => (session.user.isStudent ? prefs.priorityOf(props.project.id) : null))
const isMine = computed(() => session.user.isTeacher && props.project.owner_id === session.user.id)
const showAdmin = computed(() => session.user.isAdmin)
const pastYear = computed(() => props.project.year && props.project.year !== session.currentYear)
</script>

<style scoped>
.project-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: var(--radius-card);
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.project-card:hover {
  border-color: rgba(var(--v-border-color), 0.22);
  box-shadow: 0 6px 20px -8px rgba(15, 20, 30, 0.18);
}
.project-card:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
/* Projet dans mes choix : bord neutre foncé de 2 px et coche (le rouge est réservé aux actions) */
.project-card--chosen { border: 2px solid var(--sel); padding: 19px; }
.card-title { font-size: 1.02rem; font-weight: 650; line-height: 1.35; margin: 0; letter-spacing: -0.005em; }
.owner { display: flex; align-items: center; gap: 6px; min-width: 0; }
.short { margin: 4px 0 8px; color: rgba(var(--v-theme-on-surface), 0.86); font-size: 0.92rem; line-height: 1.5; flex: 1; }
footer { margin-top: auto; padding-top: 4px; }
.choice-pill {
  flex: none; display: inline-flex; align-items: center; gap: 3px;
  height: 24px; padding: 0 10px 0 7px; border-radius: 999px; font-weight: 700; font-size: 0.8rem;
  background: var(--sel); color: rgb(var(--v-theme-surface));
}
</style>
