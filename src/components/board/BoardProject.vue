<template>
  <section
    class="bp"
    :class="{
      'bp--over': dropActive,
      'bp--dim': dimmed,
      'bp--choice': focusRank,
      'bp--unselected': !project.selected,
    }"
    :aria-label="`Projet ${project.title}, ${members.length} étudiant(s)`"
    :data-testid="`board-project-${project.id}`"
    @dragover.prevent="$emit('drag-over', project)"
    @dragleave="onLeave"
    @drop.prevent="$emit('drop', project)"
  >
    <header class="bp-head">
      <div class="min-w-0 flex-grow-1">
        <div class="d-flex align-center ga-2 min-w-0">
          <h3 class="bp-title text-truncate" :title="project.title">{{ project.title }}</h3>
          <span v-if="focusRank" class="focus-tag" :title="`Choix n°${focusRank} de l'étudiant sélectionné`">choix {{ focusRank }}</span>
        </div>
        <div class="bp-sub text-truncate">#{{ project.id }} · {{ project.ownerName }}<template v-if="!project.selected"> · non sélectionné</template></div>
      </div>
      <span class="size-badge tabular" :class="`size--${sizeTone}`" :title="sizeTitle">{{ members.length }}</span>
    </header>

    <div class="bp-tools">
      <div class="coverage" aria-label="Couverture des domaines">
        <span v-for="c in coverage" :key="c.domain.id" class="cov" :class="`cov--${c.state}`" :title="c.title">
          <v-icon :icon="c.domain.icon" size="14" :color="domainColor(c.domain, dark)" />
          <span class="cov-dot" aria-hidden="true"></span>
          <span class="sr-only">{{ c.title }}</span>
        </span>
      </div>
      <v-spacer />
      <v-btn
        icon
        size="small"
        variant="text"
        :aria-label="`Voir les candidats de ${project.title}`"
        :color="candidates ? 'primary' : undefined"
        :data-testid="`candidates-${project.id}`"
        @click="$emit('candidates', project)"
      >
        <v-icon icon="mdi-account-search-outline" size="19" />
        <v-tooltip activator="parent">Candidats (étudiants qui l'ont choisi)</v-tooltip>
      </v-btn>
      <v-btn
        icon
        size="small"
        variant="text"
        :loading="locking"
        :aria-pressed="project.isLocked"
        :aria-label="project.isLocked ? `Déverrouiller ${project.title}` : `Verrouiller ${project.title}`"
        :class="{ 'lock-on': project.isLocked }"
        :data-testid="`lock-${project.id}`"
        @click="$emit('toggle-lock', project)"
      >
        <v-icon :icon="project.isLocked ? 'mdi-lock' : 'mdi-lock-open-variant-outline'" size="19" />
        <v-tooltip activator="parent">
          {{ project.isLocked ? 'Verrouillé : le calcul garde exactement ces étudiants. Le glisser-déposer reste possible.' : 'Verrouiller : le calcul automatique gardera ces étudiants' }}
        </v-tooltip>
      </v-btn>
    </div>

    <div class="bp-members" :class="{ 'bp-members--empty': !members.length }">
      <StudentChip
        v-for="s in members"
        :key="s.id"
        :student="s"
        :project-id="project.id"
        :show-name="showName"
        :focused="focusStudentId === s.id"
        @open="$emit('open-student', $event)"
        @drag-start="$emit('drag-start', $event)"
        @drag-end="$emit('drag-end')"
      />
      <span v-if="!members.length" class="empty-hint">Glissez des étudiants ici</span>
    </div>

    <footer v-if="warnings.length" class="bp-warn">
      <v-icon icon="mdi-alert-outline" size="15" />
      <span>{{ warnings.join(' · ') }}</span>
    </footer>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import StudentChip from '@/components/board/StudentChip.vue'
import { useDark } from '@/composables/useDark'
import { domainCoverage } from '@/utils/board'
import { domainColor } from '@/utils/palette'

const props = defineProps({
  project: { type: Object, required: true },
  members: { type: Array, required: true },
  mapping: { type: Array, default: () => [] },
  params: { type: Object, required: true },
  showName: { type: Boolean, default: false },
  dropActive: { type: Boolean, default: false },
  focusStudentId: { type: Number, default: null },
  focusRank: { type: Number, default: null },
  dimmed: { type: Boolean, default: false },
  candidates: { type: Boolean, default: false },
  locking: { type: Boolean, default: false },
})
const emit = defineEmits(['drag-over', 'drag-leave', 'drop', 'open-student', 'drag-start', 'drag-end', 'toggle-lock', 'candidates'])
const dark = useDark()

const sizeTone = computed(() => {
  const n = props.members.length
  if (n === 0) return 'empty'
  if (n < props.params.min_size) return 'low'
  if (n > props.params.max_size) return 'high'
  return 'ok'
})
const sizeTitle = computed(() => `${props.members.length} étudiant(s) · taille visée ${props.params.min_size} à ${props.params.max_size}`)

const coverage = computed(() =>
  props.project.domains.map((d) => {
    const c = domainCoverage(d.id, props.members, props.mapping)
    const who = c.by.map((s) => s.orientationAcronym).join(', ')
    const title = {
      ok: `${d.name} : couvert (${who})`,
      partial: `${d.name} : couvert en élargissant (${who})`,
      missing: `${d.name} : aucune orientation correspondante`,
      unknown: d.name,
    }[c.state]
    return { domain: d, state: c.state, title }
  }),
)

const warnings = computed(() => {
  const w = []
  const counts = {}
  for (const s of props.members) {
    const a = s.orientationAcronym || '?'
    counts[a] = (counts[a] || 0) + 1
  }
  for (const [a, n] of Object.entries(counts)) {
    if (n > props.params.max_same_orientation) w.push(`${n} × ${a} (max ${props.params.max_same_orientation})`)
  }
  const out = props.members.filter((s) => s.rankOf(props.project.id) == null).length
  if (out) w.push(`${out} hors choix`)
  return w
})

function onLeave(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) emit('drag-leave', props.project)
}
</script>

<style scoped>
.bp {
  display: flex; flex-direction: column; gap: 8px; padding: 12px 12px 10px; min-width: 0;
  background: rgb(var(--v-theme-surface)); border-radius: 14px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  transition: border-color 0.12s, box-shadow 0.12s, opacity 0.15s;
}
.bp--unselected { background: transparent; border-style: dashed; }
.bp--over { border-color: rgb(var(--v-theme-primary)); box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.14); }
.bp--choice { border-color: rgba(var(--v-theme-primary), 0.55); }
.bp--dim { opacity: 0.5; }
.bp-head { display: flex; align-items: flex-start; gap: 8px; }
.bp-title { font-size: 0.95rem; font-weight: 650; margin: 0; min-width: 0; }
.bp-sub { font-size: 0.78rem; color: rgba(var(--v-theme-on-surface), 0.62); }
.focus-tag { flex: none; font-size: 0.7rem; font-weight: 700; padding: 1px 7px; border-radius: 999px; background: rgba(var(--v-theme-primary), 0.1); color: rgb(var(--v-theme-primary)); }
.size-badge {
  flex: none; min-width: 30px; height: 26px; padding: 0 8px; border-radius: 8px;
  display: grid; place-items: center; font-weight: 700; font-size: 0.85rem;
}
.size--ok { background: rgba(var(--v-theme-success), 0.12); color: rgb(var(--v-theme-success)); }
.size--low { background: rgba(var(--v-theme-warning), 0.13); color: rgb(var(--v-theme-warning)); }
.size--high { background: rgba(var(--v-theme-error), 0.1); color: rgb(var(--v-theme-error)); }
.size--empty { background: rgb(var(--v-theme-surface-light)); color: rgba(var(--v-theme-on-surface), 0.5); }
.bp-tools { display: flex; align-items: center; gap: 2px; margin: -2px -6px -2px 0; }
.coverage { display: flex; flex-wrap: wrap; gap: 4px; }
.cov {
  position: relative; display: inline-grid; place-items: center; width: 26px; height: 24px; border-radius: 7px;
  background: rgb(var(--v-theme-surface-light));
}
.cov-dot { position: absolute; right: -2px; top: -2px; width: 9px; height: 9px; border-radius: 50%; border: 2px solid rgb(var(--v-theme-surface)); }
.cov--ok .cov-dot { background: rgb(var(--v-theme-success)); }
.cov--partial .cov-dot { background: rgb(var(--v-theme-warning)); }
.cov--missing .cov-dot { background: rgb(var(--v-theme-surface)); box-shadow: inset 0 0 0 1.5px rgb(var(--v-theme-error)); }
.cov--unknown .cov-dot { display: none; }
.lock-on { color: rgba(var(--v-theme-on-surface), 0.85); }
.bp-members {
  display: flex; flex-wrap: wrap; gap: 6px; min-height: 44px; padding: 6px; border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.025);
}
.bp-members--empty { align-items: center; justify-content: center; border: 1px dashed rgba(var(--v-border-color), 0.2); background: transparent; }
.empty-hint { font-size: 0.8rem; color: rgba(var(--v-theme-on-surface), 0.5); }
.bp-warn { display: flex; align-items: center; gap: 6px; font-size: 0.76rem; color: rgb(var(--v-theme-warning)); }
</style>
