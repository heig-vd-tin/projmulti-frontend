<template>
  <article
    class="project-card"
    :class="{ 'project-card--chosen': !!priority, 'project-card--mine': isMine }"
    tabindex="0"
    role="button"
    :aria-label="`Ouvrir le projet ${project.title}`"
    data-testid="project-card"
    @click="$emit('open', project)"
    @keydown.enter.prevent="$emit('open', project)"
    @keydown.space.prevent="$emit('open', project)"
  >
    <header class="d-flex align-start ga-3">
      <h3 class="card-title line-clamp-2">{{ project.title }}</h3>
      <v-spacer />
      <span v-if="priority" class="priority-pill" :aria-label="`Votre choix n°${priority}`">
        <v-icon icon="mdi-star-four-points-outline" size="14" />{{ priority }}
      </span>
      <v-icon v-if="showAdmin && project.isLocked" icon="mdi-lock-outline" size="18" class="muted" aria-label="Projet verrouillé" />
    </header>

    <div class="owner text-body-2 muted">
      <v-icon icon="mdi-account-outline" size="16" />
      <span class="text-truncate">{{ project.ownerName || 'Responsable inconnu' }}</span>
      <span v-if="isMine" class="mine-tag">Votre projet</span>
    </div>

    <p class="short line-clamp-3">{{ project.short_description }}</p>

    <footer class="d-flex align-center ga-2 flex-wrap">
      <DomainBadges :domains="project.domains" />
      <v-spacer />
      <template v-if="showAdmin">
        <span class="meta-tag" :class="{ 'meta-tag--ok': project.selected }">
          <v-icon :icon="project.selected ? 'mdi-check-circle-outline' : 'mdi-circle-outline'" size="14" />
          {{ project.selected ? 'Sélectionné' : 'Non sélectionné' }}
        </span>
        <span class="meta-tag" :title="`Choisi par ${plural(project.preferredCount(5), 'étudiant')}, dont ${project.preferredCount(3)} en choix 1 à 3`">
          <v-icon icon="mdi-account-heart-outline" size="14" />{{ project.preferredCount(3) }} / {{ project.preferredCount(5) }}
        </span>
      </template>
      <span v-if="pastYear" class="meta-tag">{{ project.year }}</span>
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
  border-radius: 14px;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}
.project-card:hover {
  border-color: rgba(var(--v-border-color), 0.22);
  box-shadow: 0 6px 20px -8px rgba(15, 20, 30, 0.18);
}
.project-card:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: 2px; }
.project-card--chosen { border-color: rgba(var(--v-theme-primary), 0.45); }
.card-title { font-size: 1.02rem; font-weight: 650; line-height: 1.35; margin: 0; letter-spacing: -0.005em; }
.owner { display: flex; align-items: center; gap: 6px; min-width: 0; }
.mine-tag {
  flex: none; font-size: 0.72rem; font-weight: 600; padding: 1px 8px; border-radius: 999px;
  background: rgba(var(--v-theme-primary), 0.08); color: rgb(var(--v-theme-primary));
}
.short { margin: 4px 0 8px; color: rgba(var(--v-theme-on-surface), 0.82); font-size: 0.92rem; line-height: 1.5; flex: 1; }
footer { margin-top: auto; padding-top: 4px; }
.priority-pill {
  flex: none; display: inline-flex; align-items: center; gap: 3px;
  height: 26px; padding: 0 9px; border-radius: 999px; font-weight: 700; font-size: 0.85rem;
  background: rgba(var(--v-theme-primary), 0.1); color: rgb(var(--v-theme-primary));
}
.meta-tag {
  display: inline-flex; align-items: center; gap: 4px; font-size: 0.75rem; font-weight: 550;
  height: 24px; padding: 0 8px; border-radius: 7px;
  background: rgb(var(--v-theme-surface-light)); color: rgba(var(--v-theme-on-surface), 0.7);
}
.meta-tag--ok { background: rgba(var(--v-theme-success), 0.1); color: rgb(var(--v-theme-success)); }
</style>
