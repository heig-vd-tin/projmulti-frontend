<template>
  <div
    class="stu-chip"
    :class="{ 'stu-chip--focus': focused, 'stu-chip--out': rank == null }"
    :draggable="!student.excluded"
    role="button"
    tabindex="0"
    :aria-label="`${label}, ${student.orientationAcronym || 'orientation inconnue'}, ${rankText(rank)}${student.locked ? ', verrouillé' : ''}. Ouvrir la fiche.`"
    :data-testid="`stu-${student.id}`"
    @dragstart="onDragStart"
    @dragend="$emit('drag-end')"
    @click="$emit('open', student)"
    @keydown.enter.prevent="$emit('open', student)"
  >
    <span class="ori-badge" :style="oriStyle">{{ student.orientationAcronym || '?' }}</span>
    <span class="stu-name text-truncate">{{ label }}</span>
    <v-icon v-if="student.locked" icon="mdi-lock" size="13" class="lock" />
    <span class="rank-badge" :class="`rank--${rankTone(rank)}`">{{ rank == null ? '✕' : rank }}</span>
    <v-tooltip activator="parent" location="top" :open-delay="400">
      {{ student.fullName }} · {{ student.orientationAcronym }} · {{ rankText(rank) }}<template v-if="student.locked"> · verrouillé</template>
    </v-tooltip>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDark } from '@/composables/useDark'
import { rankText, rankTone } from '@/utils/board'
import { orientationColor } from '@/utils/palette'
import './boardStyles.css'

const props = defineProps({
  student: { type: Object, required: true },
  projectId: { type: Number, default: null },
  showName: { type: Boolean, default: false },
  focused: { type: Boolean, default: false },
})
const emit = defineEmits(['open', 'drag-start', 'drag-end'])
const dark = useDark()

const rank = computed(() => props.student.rankOf(props.projectId))
const label = computed(() => (props.showName ? props.student.fullName : `#${props.student.id}`))
const oriStyle = computed(() => {
  const c = orientationColor(props.student.orientationAcronym, dark.value)
  return { color: c, background: `color-mix(in srgb, ${c} ${dark.value ? 18 : 12}%, transparent)` }
})

function onDragStart(event) {
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', String(props.student.id))
  emit('drag-start', props.student)
}
</script>

<style scoped>
.stu-chip {
  display: inline-flex; align-items: center; gap: 6px; max-width: 100%;
  height: 32px; padding: 0 6px 0 5px; border-radius: 9px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), 0.14);
  font-size: 0.84rem; cursor: grab; user-select: none;
  transition: border-color 0.12s, box-shadow 0.12s;
}
.stu-chip:hover { border-color: rgba(var(--v-border-color), 0.32); }
.stu-chip:active { cursor: grabbing; }
.stu-chip--out { border-color: rgba(var(--v-theme-error), 0.4); }
.stu-chip--focus { border-color: rgb(var(--v-theme-primary)); box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.18); }
.stu-name { font-weight: 550; min-width: 0; }
.lock { color: rgba(var(--v-theme-on-surface), 0.55); }
</style>
