<template>
  <div
    class="stu-row"
    :class="{ 'stu-row--focus': focused, 'stu-row--excluded': student.excluded }"
    :draggable="!student.excluded"
    role="button"
    tabindex="0"
    :aria-label="`${student.fullName}, ${student.orientationAcronym || 'orientation inconnue'}. Ouvrir la fiche.`"
    :data-testid="`pool-${student.id}`"
    @dragstart="onDragStart"
    @dragend="$emit('drag-end')"
    @click="$emit('open', student)"
    @keydown.enter.prevent="$emit('open', student)"
  >
    <div class="d-flex align-center ga-2 min-w-0">
      <span class="ori-badge" :style="oriStyle">{{ student.orientationAcronym || '?' }}</span>
      <span class="name text-truncate">{{ showName ? student.fullName : `#${student.id}` }}</span>
      <span v-if="showName" class="muted text-caption">#{{ student.id }}</span>
      <v-spacer />
      <v-icon v-if="student.locked" icon="mdi-lock" size="14" class="muted" aria-label="Verrouillé" />
      <span v-if="candidateRank" class="rank-badge" :class="`rank--${rankTone(candidateRank)}`" :title="`Choix n°${candidateRank} pour ce projet`">{{ candidateRank }}</span>
      <span v-if="assigned" class="assigned-tag" :title="assigned.title">→ #{{ assigned.id }}</span>
    </div>
    <div class="choices" aria-label="Ses choix">
      <span
        v-for="pref in student.preferences"
        :key="pref.project_id"
        class="choice"
        :class="choiceClass(pref.project_id)"
        :title="choiceTitle(pref)"
      >
        <b>{{ pref.priority }}</b>#{{ pref.project_id }}<span class="muted">·{{ memberCount(pref.project_id) }}</span>
      </span>
      <span v-if="!student.preferences.length" class="text-caption muted">Aucun choix</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDark } from '@/composables/useDark'
import { rankTone } from '@/utils/board'
import { orientationColor } from '@/utils/palette'
import './boardStyles.css'

const props = defineProps({
  student: { type: Object, required: true },
  projectById: { type: Map, required: true },
  memberCounts: { type: Map, required: true },
  showName: { type: Boolean, default: false },
  focused: { type: Boolean, default: false },
  highlightProject: { type: Number, default: null },
})
const emit = defineEmits(['open', 'drag-start', 'drag-end'])
const dark = useDark()

const assigned = computed(() => (props.student.assignedProjectId ? props.projectById.get(props.student.assignedProjectId) || { id: props.student.assignedProjectId, title: '' } : null))
const candidateRank = computed(() => (props.highlightProject ? props.student.rankOf(props.highlightProject) : null))
const oriStyle = computed(() => {
  const c = orientationColor(props.student.orientationAcronym, dark.value)
  return { color: c, background: `color-mix(in srgb, ${c} ${dark.value ? 18 : 12}%, transparent)` }
})

function memberCount(pid) {
  return props.memberCounts.get(pid) || 0
}

function choiceClass(pid) {
  const p = props.projectById.get(pid)
  return {
    'choice--assigned': props.student.assignedProjectId === pid,
    'choice--closed': !p || !p.selected,
    'choice--hl': props.highlightProject === pid,
  }
}

function choiceTitle(pref) {
  const p = props.projectById.get(pref.project_id)
  const parts = [`Choix ${pref.priority} : ${p ? p.title : 'projet inconnu'}`, `${memberCount(pref.project_id)} étudiant(s)`]
  if (p && !p.selected) parts.push('non sélectionné')
  if (props.student.assignedProjectId === pref.project_id) parts.push('affecté')
  return parts.join(' · ')
}

function onDragStart(event) {
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', String(props.student.id))
  emit('drag-start', props.student)
}
</script>

<style scoped>
.stu-row {
  display: flex; flex-direction: column; gap: 6px; padding: 9px 10px; border-radius: 10px;
  background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-border-color), 0.1);
  cursor: grab; user-select: none; font-size: 0.86rem;
}
.stu-row:hover { border-color: rgba(var(--v-border-color), 0.28); }
.stu-row--focus { border-color: rgb(var(--v-theme-primary)); box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.15); }
.stu-row--excluded { cursor: pointer; opacity: 0.75; }
.name { font-weight: 600; }
.assigned-tag { font-size: 0.72rem; font-weight: 600; padding: 1px 6px; border-radius: 6px; background: rgba(var(--v-theme-success), 0.1); color: rgb(var(--v-theme-success)); }
.choices { display: flex; flex-wrap: wrap; gap: 4px; }
.choice {
  display: inline-flex; align-items: center; gap: 3px; height: 22px; padding: 0 6px; border-radius: 6px;
  font-size: 0.72rem; background: rgb(var(--v-theme-surface-light)); border: 1px solid transparent;
}
.choice b { font-weight: 700; margin-right: 1px; }
.choice--assigned { background: rgba(var(--v-theme-success), 0.12); color: rgb(var(--v-theme-success)); }
.choice--closed { background: transparent; border: 1px dashed rgba(var(--v-theme-error), 0.45); color: rgba(var(--v-theme-on-surface), 0.6); text-decoration: line-through; text-decoration-color: rgba(var(--v-theme-error), 0.5); }
.choice--hl { border-color: rgb(var(--v-theme-primary)); }
</style>
