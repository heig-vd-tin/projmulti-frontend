<template>
  <div class="page page--narrow">
    <header class="page-header">
      <div>
        <h1>Mes choix</h1>
        <div class="subtitle">
          Classez jusqu'à 5 projets : 1 = meilleur choix. Glissez-déposez une carte (ou utilisez les flèches) pour changer l'ordre.
        </div>
      </div>
      <div class="d-flex align-center ga-3">
        <span class="save-state text-body-2" :class="{ 'save-state--busy': prefs.saving }" aria-live="polite">
          <v-progress-circular v-if="prefs.saving" indeterminate size="16" width="2" />
          <v-icon v-else icon="mdi-cloud-check-outline" size="18" />
          {{ prefs.saving ? 'Enregistrement…' : 'Choix enregistrés' }}
        </span>
        <v-btn variant="tonal" prepend-icon="mdi-view-grid-outline" to="/all-projects">Parcourir les projets</v-btn>
      </div>
    </header>

    <v-alert
      v-if="prefs.count < MAX_CHOICES"
      class="page-banner"
      type="info"
      variant="tonal"
      density="comfortable"
      icon="mdi-lightbulb-on-outline"
    >
      Il vous reste {{ MAX_CHOICES - prefs.count }} choix. Choisissez 5 projets pour avoir les meilleures chances
      d'obtenir un projet qui vous plaît.
    </v-alert>

    <ol class="slot-list" aria-label="Vos choix, du meilleur au dernier">
      <li
        v-for="(p, i) in order"
        :key="p ? `p${p.id}` : `empty${i}`"
        class="slot"
        :class="{ 'slot--filled': p, 'slot--over': overIndex === i && dragIndex !== i, 'slot--dragging': dragIndex === i }"
        :draggable="!!p && !prefs.saving"
        :data-testid="`choice-slot-${i + 1}`"
        @dragstart="onDragStart($event, i)"
        @dragend="onDragEnd"
        @dragover.prevent="onDragOver(i)"
        @dragleave="onDragLeave(i)"
        @drop.prevent="onDrop(i)"
      >
        <div class="slot-rank" :aria-label="`Choix n°${i + 1}`">{{ i + 1 }}</div>
        <template v-if="p">
          <div class="slot-body min-w-0">
            <div class="d-flex align-center ga-2">
              <v-icon icon="mdi-drag-vertical" class="drag-handle" aria-hidden="true" />
              <h2 class="slot-title text-truncate">{{ p.title }}</h2>
            </div>
            <div class="text-body-2 muted text-truncate">{{ p.ownerName }}</div>
            <div class="text-body-2 slot-short line-clamp-2">{{ p.short_description }}</div>
            <DomainBadges :domains="p.domains" size="small" class="mt-2" />
          </div>
          <div class="slot-actions">
            <v-btn icon="mdi-arrow-up" variant="text" size="small" :disabled="i === 0 || prefs.saving" :aria-label="`Monter « ${p.title} »`" @click="move(i, i - 1)" />
            <v-btn icon="mdi-arrow-down" variant="text" size="small" :disabled="i === MAX_CHOICES - 1 || prefs.saving" :aria-label="`Descendre « ${p.title} »`" @click="move(i, i + 1)" />
            <v-btn icon="mdi-eye-outline" variant="text" size="small" :aria-label="`Voir « ${p.title} »`" @click="openId = p.id" />
            <v-btn icon="mdi-close" variant="text" size="small" color="error" :disabled="prefs.saving" :aria-label="`Retirer « ${p.title} » de mes choix`" @click="remove(p)" />
          </div>
        </template>
        <template v-else>
          <div class="slot-empty">
            <span>Choix n°{{ i + 1 }} libre</span>
            <v-btn variant="text" size="small" color="primary" to="/all-projects">Choisir un projet</v-btn>
          </div>
        </template>
      </li>
    </ol>

    <ProjectDetailDialog :project-id="openId" :project="openProject" @close="openId = null" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import DomainBadges from '@/components/projects/DomainBadges.vue'
import ProjectDetailDialog from '@/components/projects/ProjectDetailDialog.vue'
import { useNotifyStore } from '@/stores/notify'
import { MAX_CHOICES, usePreferencesStore } from '@/stores/preferences'

const prefs = usePreferencesStore()
const notify = useNotifyStore()

const order = computed(() => prefs.slots)
const dragIndex = ref(null)
const overIndex = ref(null)
const openId = ref(null)
const openProject = computed(() => prefs.items.find((p) => p.id === openId.value) || null)

function onDragStart(event, i) {
  dragIndex.value = i
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', String(i))
}

function onDragEnd() {
  dragIndex.value = null
  overIndex.value = null
}

function onDragOver(i) {
  if (dragIndex.value !== null) overIndex.value = i
}

function onDragLeave(i) {
  if (overIndex.value === i) overIndex.value = null
}

function onDrop(i) {
  const from = dragIndex.value
  onDragEnd()
  if (from === null || from === i) return
  move(from, i)
}

// Déplace le projet de la place `from` vers la place `to` ; les autres glissent d'un cran.
async function move(from, to) {
  if (to < 0 || to >= MAX_CHOICES) return
  const slots = order.value.slice()
  const [item] = slots.splice(from, 1)
  slots.splice(to, 0, item)
  try {
    await prefs.reorder(slots)
  } catch (error) {
    notify.error(error, "Le nouvel ordre n'a pas été enregistré")
    prefs.fetch().catch(() => {})
  }
}

async function remove(p) {
  try {
    await prefs.remove(p.id)
    notify.success(`« ${p.title} » a été retiré de vos choix.`)
  } catch (error) {
    notify.error(error, "Le choix n'a pas pu être retiré")
  }
}
</script>

<style scoped>
.save-state { display: inline-flex; align-items: center; gap: 6px; color: rgb(var(--v-theme-success)); }
.save-state--busy { color: rgba(var(--v-theme-on-background), 0.7); }
.slot-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
.slot {
  display: flex; align-items: stretch; gap: 16px;
  padding: 14px 12px 14px 14px;
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  transition: border-color 0.15s, box-shadow 0.15s, opacity 0.15s;
}
.slot:not(.slot--filled) { background: transparent; border-style: dashed; border-color: rgba(var(--v-border-color), 0.2); }
.slot--filled { cursor: grab; }
.slot--dragging { opacity: 0.45; }
.slot--over { border-color: rgb(var(--v-theme-primary)); box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.12); }
.slot-rank {
  flex: none; width: 44px; border-radius: 10px; display: grid; place-items: center;
  font-size: 1.3rem; font-weight: 750;
  background: rgba(var(--v-theme-primary), 0.08); color: rgb(var(--v-theme-primary));
}
.slot:not(.slot--filled) .slot-rank { background: rgb(var(--v-theme-surface-light)); color: rgba(var(--v-theme-on-surface), 0.45); }
.slot-body { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.slot-title { font-size: 1rem; font-weight: 650; margin: 0; }
.slot-short { color: rgba(var(--v-theme-on-surface), 0.8); margin-top: 2px; }
.drag-handle { color: rgba(var(--v-theme-on-surface), 0.35); margin-left: -6px; }
.slot-actions { display: flex; flex-direction: column; flex-wrap: wrap; align-content: flex-end; justify-content: center; gap: 0 2px; max-height: 96px; }
.slot-empty { flex: 1; display: flex; align-items: center; justify-content: space-between; gap: 8px; color: rgba(var(--v-theme-on-surface), 0.6); min-height: 44px; }
@media (max-width: 600px) {
  .slot { gap: 10px; padding: 12px 8px 12px 10px; }
  .slot-rank { width: 34px; font-size: 1.1rem; }
  .slot-actions { max-height: none; flex-direction: row; flex-wrap: wrap; width: 72px; }
}
</style>
