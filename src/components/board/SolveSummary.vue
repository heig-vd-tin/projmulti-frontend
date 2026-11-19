<template>
  <section class="solve surface-card" aria-label="Résultat du calcul" data-testid="solve-summary">
    <div class="solve-head">
      <v-icon icon="mdi-check-circle" color="success" />
      <div class="min-w-0 flex-grow-1">
        <div class="font-weight-bold">
          Répartition calculée · {{ result.status === 'optimal' ? 'solution optimale' : 'solution réalisable (non prouvée optimale)' }}
        </div>
        <div class="text-body-2 muted">
          {{ time }} · groupes de {{ result.params.min_size }} à {{ result.params.max_size }}, max {{ result.params.max_same_orientation }} par orientation<template v-if="!result.params.allow_fifth_choice"> · sans 5e choix</template><template v-if="result.params.allow_out_of_choice"> · hors choix autorisé</template>
          · {{ m.open_projects }} projets ouverts<template v-if="groups"> ({{ groups }})</template>
        </div>
      </div>
      <v-btn icon="mdi-close" size="small" variant="text" aria-label="Masquer le résultat du calcul" @click="$emit('close')" />
    </div>

    <!-- Seulement ce que la barre de chiffres clés ne montre pas : qui est hors choix ou sans projet -->
    <div v-if="outStudents.length || unassignedStudents.length" class="lists">
      <div v-if="outStudents.length">
        <span class="text-body-2 font-weight-bold">Hors de leurs choix :</span>
        <button v-for="s in outStudents" :key="s.id" type="button" class="who who--out" @click="$emit('open-student', s)">{{ label(s) }}</button>
      </div>
      <div v-if="unassignedStudents.length">
        <span class="text-body-2 font-weight-bold">Sans projet :</span>
        <button v-for="s in unassignedStudents" :key="s.id" type="button" class="who" @click="$emit('open-student', s)">{{ label(s) }}</button>
      </div>
    </div>
    <div v-else class="text-body-2 mt-2">Tous les étudiants sont affectés à l'un de leurs choix.</div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  result: { type: Object, required: true },
  studentById: { type: Map, required: true },
  showName: { type: Boolean, default: false },
})
defineEmits(['close', 'open-student'])

const m = computed(() => props.result.metrics || {})
const groups = computed(() => Object.entries(m.value.group_sizes || {}).filter(([, n]) => n).map(([size, n]) => `${n} groupe${n > 1 ? 's' : ''} de ${size}`).join(', '))
const time = computed(() => new Date(props.result.at).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' }))
const pick = (ids) => (ids || []).map((id) => props.studentById.get(id)).filter(Boolean)
const outStudents = computed(() => pick(props.result.out_of_choice))
const unassignedStudents = computed(() => pick(props.result.unassigned))
const label = (s) => (props.showName ? s.fullName : `#${s.id}`)
</script>

<style scoped>
.solve { padding: 14px 16px; }
.solve-head { display: flex; align-items: flex-start; gap: 12px; }
.lists { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; padding-left: 36px; }
.who { font: inherit; font-size: 0.8rem; margin-left: 6px; padding: 2px 10px; border-radius: 999px; border: 1px solid rgba(var(--v-border-color), 0.22); background: rgb(var(--v-theme-surface)); color: inherit; cursor: pointer; }
.who--out { border-color: rgba(var(--v-theme-error), 0.5); }
</style>
