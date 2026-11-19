<template>
  <div
    class="stu-chip"
    :class="{ 'stu-chip--focus': focused, 'stu-chip--out': rank == null, 'stu-chip--frozen': frozen }"
    :draggable="!student.excluded && !frozen"
    role="button"
    tabindex="0"
    :aria-label="`${label}, ${student.orientationAcronym || 'orientation inconnue'}, ${rankText(rank)}${student.locked ? ', verrouillé' : ''}. Ouvrir la fiche.`"
    :data-testid="`stu-${student.id}`"
    @dragstart="onDragStart"
    @dragend="$emit('drag-end')"
    @click="$emit('open', student)"
    @keydown.enter.prevent="$emit('open', student)"
  >
    <span class="ori-badge">{{ student.orientationAcronym || '?' }}</span>
    <span class="stu-name text-truncate">{{ label }}</span>
    <v-icon v-if="student.locked" icon="mdi-lock" size="13" class="lock" />
    <span class="rank-badge" :class="`rank--${rankTone(rank)}`">{{ rank == null ? '✕' : rank }}</span>
    <v-tooltip activator="parent" location="top" :open-delay="400">
      {{ student.fullName }} · {{ student.orientationAcronym }} · {{ rankText(rank) }}<template v-if="student.locked"> · affectation verrouillée</template>
      <template v-if="frozen"><br>Verrouillé : déplacement impossible. Cliquer pour ouvrir la fiche.</template>
    </v-tooltip>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { rankText, rankTone } from '@/utils/board'
import './boardStyles.css'

const props = defineProps({
  student: { type: Object, required: true },
  projectId: { type: Number, default: null },
  showName: { type: Boolean, default: false },
  focused: { type: Boolean, default: false },
  // Étudiant ou projet verrouillé : la puce ne se déplace pas.
  frozen: { type: Boolean, default: false },
})
const emit = defineEmits(['open', 'drag-start', 'drag-end'])

const rank = computed(() => props.student.rankOf(props.projectId))
const label = computed(() => (props.showName ? props.student.fullName : `#${props.student.id}`))

function onDragStart(event) {
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', String(props.student.id))
  emit('drag-start', props.student)
}
</script>

<style scoped>
.stu-chip {
  display: inline-flex; align-items: center; gap: 6px; max-width: 100%;
  height: 32px; padding: 0 5px; border-radius: var(--radius-control);
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), 0.14);
  font-size: 0.84rem; cursor: grab; user-select: none;
  transition: border-color 0.12s, box-shadow 0.12s;
}
.stu-chip:hover { border-color: rgba(var(--v-border-color), 0.32); }
.stu-chip:active { cursor: grabbing; }
.stu-chip--frozen, .stu-chip--frozen:active { cursor: pointer; }
.stu-chip--out { border-color: rgba(var(--v-theme-error), 0.5); }
.stu-chip--focus { border: 2px solid var(--sel); padding: 0 4px; }
.stu-name { font-weight: 550; min-width: 0; }
.lock { color: var(--text-secondary); }
</style>
