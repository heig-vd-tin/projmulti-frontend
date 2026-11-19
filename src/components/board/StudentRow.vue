<template>
  <div
    class="stu-row"
    :class="{ 'stu-row--focus': focused, 'stu-row--excluded': student.excluded, 'stu-row--frozen': !!frozen }"
    :draggable="!student.excluded && !frozen"
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
      <span class="ori-badge">{{ student.orientationAcronym || '?' }}</span>
      <span class="name text-truncate">{{ showName ? student.fullName : `#${student.id}` }}</span>
      <span v-if="showName" class="muted text-caption">#{{ student.id }}</span>
      <v-spacer />
      <v-icon v-if="frozen" icon="mdi-lock" size="14" class="muted" aria-label="Verrouillé">
        <v-tooltip activator="parent" location="top">{{ frozen }}</v-tooltip>
      </v-icon>
      <span v-if="candidateRank" class="rank-badge" :class="`rank--${rankTone(candidateRank)}`">
        {{ candidateRank }}
        <v-tooltip activator="parent" location="top">Ce projet est son choix n°{{ candidateRank }}</v-tooltip>
      </span>
      <span v-if="assigned" class="assigned-tag">
        → #{{ assigned.id }}
        <v-tooltip activator="parent" location="top">Affecté au projet #{{ assigned.id }}<template v-if="assigned.title"> « {{ assigned.title }} »</template></v-tooltip>
      </span>
    </div>
    <div class="choices" aria-label="Ses choix">
      <span
        v-for="pref in student.preferences"
        :key="pref.project_id"
        class="choice"
        :class="choiceClass(pref.project_id)"
      >
        <b>{{ pref.priority }}</b>#{{ pref.project_id }}<span class="muted">·{{ memberCount(pref.project_id) }}</span>
        <v-tooltip activator="parent" location="top" :open-delay="250">{{ choiceTitle(pref) }}</v-tooltip>
      </span>
      <span v-if="!student.preferences.length" class="text-caption muted">Aucun choix</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { lockReason, rankTone } from '@/utils/board'
import { plural } from '@/utils/text'
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

const assigned = computed(() => (props.student.assignedProjectId ? props.projectById.get(props.student.assignedProjectId) || { id: props.student.assignedProjectId, title: '' } : null))
// Étudiant verrouillé ou dans un projet verrouillé : raison affichée, pas de glisser-déposer.
const frozen = computed(() => lockReason(props.student, props.projectById))
const candidateRank = computed(() => (props.highlightProject ? props.student.rankOf(props.highlightProject) : null))

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
  const parts = [`Choix ${pref.priority} : #${pref.project_id} ${p ? `« ${p.title} »` : '(projet inconnu)'}`, `${plural(memberCount(pref.project_id), 'étudiant affecté', 'étudiants affectés')}`]
  if (p && !p.selected) parts.push('projet non sélectionné')
  if (p && p.isLocked) parts.push('projet verrouillé')
  if (props.student.assignedProjectId === pref.project_id) parts.push('il y est affecté')
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
  display: flex; flex-direction: column; gap: 6px; padding: 9px 10px; border-radius: var(--radius-control);
  background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-border-color), 0.1);
  cursor: grab; user-select: none; font-size: 0.86rem;
}
.stu-row:hover { border-color: rgba(var(--v-border-color), 0.28); }
.stu-row--focus { border: 2px solid var(--sel); padding: 8px 9px; }
.stu-row--excluded { cursor: pointer; opacity: 0.75; }
.stu-row--frozen { cursor: pointer; }
.name { font-weight: 600; }
.assigned-tag { font-size: 0.72rem; font-weight: 600; padding: 1px 8px; border-radius: 999px; background: var(--neutral-chip-bg); color: rgb(var(--v-theme-on-surface)); }
.choices { display: flex; flex-wrap: wrap; gap: 4px; }
.choice {
  display: inline-flex; align-items: center; gap: 3px; height: 22px; padding: 0 7px; border-radius: 999px;
  font-size: 0.72rem; background: var(--neutral-chip-bg); border: 1px solid transparent;
}
.choice b { font-weight: 700; margin-right: 1px; }
/* Projet affecté : bord neutre foncé (code de sélection) ; projet non sélectionné : pointillés barrés */
.choice--assigned { border: 1.5px solid var(--sel); font-weight: 700; }
.choice--closed { background: transparent; border: 1px dashed rgba(var(--v-theme-error), 0.5); color: var(--text-secondary); text-decoration: line-through; text-decoration-color: rgba(var(--v-theme-error), 0.6); }
.choice--hl { border: 1.5px solid rgb(var(--v-theme-info)); background: rgba(var(--v-theme-info), 0.14); }
</style>
