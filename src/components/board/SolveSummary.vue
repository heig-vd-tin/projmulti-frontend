<template>
  <section class="solve surface-card" aria-label="Résultat du calcul" data-testid="solve-summary">
    <div class="solve-head">
      <v-icon icon="mdi-auto-fix" color="primary" />
      <div class="min-w-0 flex-grow-1">
        <div class="font-weight-bold">
          Résultat du calcul · {{ result.status === 'optimal' ? 'solution optimale' : 'solution réalisable (non prouvée optimale)' }}
        </div>
        <div class="text-caption muted">
          {{ time }} · groupes de {{ result.params.min_size }} à {{ result.params.max_size }}, max {{ result.params.max_same_orientation }} par orientation
          <template v-if="!result.params.allow_fifth_choice"> · sans 5e choix</template>
          <template v-if="result.params.allow_out_of_choice"> · hors choix autorisé</template>
        </div>
      </div>
      <v-btn icon="mdi-close" size="small" variant="text" aria-label="Masquer le résultat du calcul" @click="$emit('close')" />
    </div>

    <div class="metrics">
      <div class="metric"><span class="m-value tabular">{{ m.assigned }}<span class="m-of">/{{ m.students }}</span></span><span class="m-label">affectés</span></div>
      <div class="metric"><span class="m-value tabular">{{ m.unassigned }}</span><span class="m-label">non affectés</span></div>
      <div class="metric"><span class="m-value tabular">{{ meanRank }}</span><span class="m-label">rang moyen</span></div>
      <div class="metric"><span class="m-value tabular">{{ m.open_projects }}</span><span class="m-label">projets ouverts</span></div>
      <div class="metric">
        <span class="m-value tabular text-body-1 font-weight-bold">
          <template v-for="(n, size, i) in m.group_sizes || {}" :key="size">{{ i ? ' · ' : '' }}{{ n }}×{{ size }}</template>
        </span>
        <span class="m-label">groupes (nombre × taille)</span>
      </div>
      <div class="ranks" aria-label="Répartition des rangs obtenus">
        <span v-for="r in ranks" :key="r.key" class="rank-cell" :title="`${r.label} : ${r.value}`">
          <span class="rank-badge" :class="`rank--${r.tone}`">{{ r.short }}</span>
          <span class="tabular font-weight-bold">{{ r.value }}</span>
        </span>
      </div>
    </div>

    <div v-if="outStudents.length || unassignedStudents.length" class="lists">
      <div v-if="outStudents.length">
        <span class="text-caption font-weight-bold">Hors de leurs choix :</span>
        <button v-for="s in outStudents" :key="s.id" type="button" class="who who--out" @click="$emit('open-student', s)">{{ label(s) }}</button>
      </div>
      <div v-if="unassignedStudents.length">
        <span class="text-caption font-weight-bold">Non affectés :</span>
        <button v-for="s in unassignedStudents" :key="s.id" type="button" class="who" @click="$emit('open-student', s)">{{ label(s) }}</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { rankTone } from '@/utils/board'
import '@/components/board/boardStyles.css'

const props = defineProps({
  result: { type: Object, required: true },
  studentById: { type: Map, required: true },
  showName: { type: Boolean, default: false },
})
defineEmits(['close', 'open-student'])

const m = computed(() => props.result.metrics || {})
const meanRank = computed(() => (m.value.mean_rank != null ? Number(m.value.mean_rank).toFixed(2).replace('.', ',') : '—'))
const time = computed(() => new Date(props.result.at).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' }))
const ranks = computed(() => {
  const by = m.value.by_rank || {}
  return ['1', '2', '3', '4', '5', 'out'].map((k) => ({
    key: k,
    short: k === 'out' ? '✕' : k,
    label: k === 'out' ? 'Hors choix' : `Choix ${k}`,
    value: by[k] || 0,
    tone: rankTone(k === 'out' ? null : Number(k)),
  }))
})
const pick = (ids) => (ids || []).map((id) => props.studentById.get(id)).filter(Boolean)
const outStudents = computed(() => pick(props.result.out_of_choice))
const unassignedStudents = computed(() => pick(props.result.unassigned))
const label = (s) => (props.showName ? s.fullName : `#${s.id}`)
</script>

<style scoped>
.solve { padding: 14px 16px; border-color: rgba(var(--v-theme-primary), 0.3) !important; }
.solve-head { display: flex; align-items: flex-start; gap: 12px; }
.metrics { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 28px; margin-top: 12px; }
.metric { display: flex; flex-direction: column; }
.m-value { font-size: 1.3rem; font-weight: 700; line-height: 1.2; }
.m-of { font-size: 0.9rem; color: rgba(var(--v-theme-on-surface), 0.55); }
.m-label { font-size: 0.75rem; color: rgba(var(--v-theme-on-surface), 0.62); }
.ranks { display: flex; gap: 10px; flex-wrap: wrap; }
.rank-cell { display: inline-flex; align-items: center; gap: 4px; font-size: 0.9rem; }
.lists { display: flex; flex-direction: column; gap: 6px; margin-top: 12px; }
.who { font: inherit; font-size: 0.78rem; margin-left: 6px; padding: 2px 8px; border-radius: 7px; border: 1px solid rgba(var(--v-border-color), 0.2); background: rgb(var(--v-theme-surface)); color: inherit; cursor: pointer; }
.who--out { border-color: rgba(var(--v-theme-error), 0.45); }
</style>
