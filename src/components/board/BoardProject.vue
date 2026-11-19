<template>
  <section
    :id="`bp-${project.id}`"
    class="bp"
    :class="{
      'bp--over': dropActive && !project.isLocked,
      'bp--refuse': dropActive && project.isLocked,
      'bp--dim': dimmed,
      'bp--choice': focusRank,
      'bp--cand': candidates,
      'bp--locked': project.isLocked,
      'bp--locked-drag': dragging && project.isLocked,
      'bp--unselected': !project.selected,
    }"
    :aria-label="`Projet ${project.title}, ${plural(members.length, 'étudiant')}${project.isLocked ? ', verrouillé' : ''}`"
    :data-testid="`board-project-${project.id}`"
    @dragenter="onOver"
    @dragover="onOver"
    @dragleave="onLeave"
    @drop.prevent="onDrop"
  >
    <div v-if="candidates" class="cand-flag" data-testid="cand-flag">
      <v-icon icon="mdi-account-search" size="15" />
      <span>Candidats affichés dans la liste</span>
      <v-icon icon="mdi-arrow-right" size="15" class="ml-auto" />
    </div>

    <header class="bp-head">
      <div class="min-w-0 flex-grow-1">
        <h3 class="bp-title text-truncate">
          {{ project.title }}
          <v-tooltip activator="parent" location="top" :open-delay="300">{{ project.title }}</v-tooltip>
        </h3>
        <div class="bp-sub text-truncate">
          #{{ project.id }} · {{ project.ownerName }}<template v-if="!project.selected"> · <span class="sub-tag">non sélectionné<v-tooltip activator="parent" location="bottom">Projet non sélectionné pour le cours : il n'est pas prévu de l'ouvrir (page « Sélection »).</v-tooltip></span></template>
        </div>
      </div>
      <span
        v-if="focusRank"
        class="rank-badge choice-badge"
        :class="`rank--${rankTone(focusRank)}`"
        :data-testid="`focus-rank-${project.id}`"
      >
        choix {{ focusRank }}
        <v-tooltip activator="parent" location="top">Choix n°{{ focusRank }} de l'étudiant dont la fiche est ouverte</v-tooltip>
      </span>
      <span class="size-badge tabular" :class="`size--${sizeTone}`">
        {{ members.length }}
        <v-tooltip activator="parent" location="top">{{ sizeTitle }}</v-tooltip>
      </span>
    </header>

    <div class="bp-tools">
      <div class="coverage" aria-label="Couverture des domaines">
        <span v-for="c in coverage" :key="c.domain.id" class="cov" :class="`cov--${c.state}`" role="img" :aria-label="c.title">
          <v-icon :icon="domainIcon(c.domain)" size="15" :color="c.state === 'missing' ? undefined : domainColor(c.domain, dark)" />
          <span v-if="c.state !== 'unknown'" class="cov-mark" aria-hidden="true">
            <v-icon :icon="{ ok: 'mdi-check-bold', partial: 'mdi-approximately-equal', missing: 'mdi-exclamation-thick' }[c.state]" size="9" />
          </span>
          <v-tooltip activator="parent">{{ c.title }}</v-tooltip>
        </span>
      </div>
      <v-spacer />
      <v-btn
        icon
        size="small"
        :variant="candidates ? 'flat' : 'text'"
        :color="candidates ? 'info' : undefined"
        :aria-pressed="candidates"
        :aria-label="`Voir les candidats de ${project.title}`"
        :data-testid="`candidates-${project.id}`"
        @click="$emit('candidates', project)"
      >
        <v-icon icon="mdi-account-search-outline" size="19" />
        <v-tooltip activator="parent">{{ candidates ? 'Masquer les candidats' : "Candidats : étudiants qui ont choisi ce projet, par rang" }}</v-tooltip>
      </v-btn>
      <v-btn
        icon
        size="small"
        :variant="project.isLocked ? 'tonal' : 'text'"
        :loading="locking"
        :aria-pressed="project.isLocked"
        :aria-label="project.isLocked ? `Déverrouiller ${project.title}` : `Verrouiller ${project.title}`"
        :class="{ 'lock-on': project.isLocked }"
        :data-testid="`lock-${project.id}`"
        @click="$emit('toggle-lock', project)"
      >
        <v-icon :icon="project.isLocked ? 'mdi-lock' : 'mdi-lock-open-variant-outline'" size="19" />
        <v-tooltip activator="parent">
          {{ project.isLocked ? 'Verrouillé : équipe figée (ni glisser-déposer, ni calcul). Cliquer pour déverrouiller.' : "Verrouiller l'équipe : plus aucun déplacement, le calcul la garde telle quelle" }}
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
        :frozen="project.isLocked || s.locked"
        @open="$emit('open-student', $event)"
        @drag-start="$emit('drag-start', $event)"
        @drag-end="$emit('drag-end')"
      />
      <span v-if="!members.length" class="empty-hint">{{ project.isLocked ? 'Projet verrouillé' : 'Glissez des étudiants ici' }}</span>
      <div v-if="dropActive && project.isLocked" class="refuse-hint" aria-hidden="true">
        <v-icon icon="mdi-lock" size="16" /> Verrouillé : déverrouillez pour modifier
      </div>
    </div>

    <footer v-if="warnings.length" class="bp-warn">
      <v-icon icon="mdi-alert-outline" size="15" />
      <span>{{ warnings.join(' · ') }}</span>
      <v-tooltip activator="parent" location="bottom">
        <div v-for="w in warningDetails" :key="w">{{ w }}</div>
      </v-tooltip>
    </footer>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import StudentChip from '@/components/board/StudentChip.vue'
import '@/components/board/boardStyles.css'
import { useDark } from '@/composables/useDark'
import { domainCoverage, rankTone } from '@/utils/board'
import { domainColor, domainIcon, sortDomains } from '@/utils/palette'
import { plural } from '@/utils/text'

const props = defineProps({
  project: { type: Object, required: true },
  members: { type: Array, required: true },
  mapping: { type: Array, default: () => [] },
  params: { type: Object, required: true },
  showName: { type: Boolean, default: false },
  dropActive: { type: Boolean, default: false },
  // Un glisser-déposer est en cours (les projets verrouillés s'effacent : dépôt impossible).
  dragging: { type: Boolean, default: false },
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
const sizeTitle = computed(() => {
  const n = props.members.length
  const target = `taille visée ${props.params.min_size} à ${props.params.max_size}`
  if (n < props.params.min_size) return `${plural(n, 'étudiant affecté', 'étudiants affectés')} · il en manque ${props.params.min_size - n} (${target})`
  if (n > props.params.max_size) return `${plural(n, 'étudiant affecté', 'étudiants affectés')} · ${n - props.params.max_size} de trop (${target})`
  return `${plural(n, 'étudiant affecté', 'étudiants affectés')} · ${target}`
})

const coverage = computed(() =>
  sortDomains(props.project.domains).map((d) => {
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

const orientationExcess = computed(() => {
  const counts = {}
  for (const s of props.members) {
    const a = s.orientationAcronym || '?'
    counts[a] = (counts[a] || 0) + 1
  }
  return Object.entries(counts).filter(([, n]) => n > props.params.max_same_orientation)
})
const outCount = computed(() => props.members.filter((s) => s.rankOf(props.project.id) == null).length)
const warningDetails = computed(() => [
  ...orientationExcess.value.map(([a, n]) => `${n} étudiants ${a} : au plus ${props.params.max_same_orientation} d'une même orientation (paramètres du calcul).`),
  ...(outCount.value ? [`${plural(outCount.value, 'étudiant affecté', 'étudiants affectés')} hors de ses 5 choix.`] : []),
])

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

// Projet verrouillé : pas de preventDefault, le navigateur refuse le dépôt (curseur interdit).
function onOver(event) {
  if (props.project.isLocked) {
    event.dataTransfer.dropEffect = 'none'
  } else {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }
  emit('drag-over', props.project)
}

function onDrop() {
  if (!props.project.isLocked) emit('drop', props.project)
}

function onLeave(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) emit('drag-leave', props.project)
}
</script>

<style scoped>
.bp {
  display: flex; flex-direction: column; gap: 8px; padding: 12px 12px 10px; min-width: 0;
  background: rgb(var(--v-theme-surface)); border-radius: var(--radius-card);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  transition: border-color 0.12s, box-shadow 0.12s, opacity 0.15s;
}
.bp--unselected { background: transparent; border-style: dashed; }
/* Zone de dépôt : bleu d'interaction ; choix de l'étudiant ouvert : bord neutre foncé */
.bp--over { border-color: var(--focus-ring); box-shadow: 0 0 0 2px var(--focus-ring); }
.bp--choice { border: 2px solid var(--sel); padding: 11px 11px 9px; }
.bp--dim { opacity: 0.5; }
/* Candidats affichés dans la liste : cadre et bandeau bleus (même bleu que la barre de la liste) */
.bp--cand { border: 2px solid rgb(var(--v-theme-info)); padding: 0 11px 9px; box-shadow: 0 4px 16px -6px rgba(var(--v-theme-info), 0.45); }
.cand-flag {
  display: flex; align-items: center; gap: 6px; margin: 0 -11px 2px; padding: 5px 11px;
  background: rgb(var(--v-theme-info)); color: rgb(var(--v-theme-on-info));
  font-size: 0.76rem; font-weight: 650; border-radius: calc(var(--radius-card) - 2px) calc(var(--radius-card) - 2px) 0 0;
}
/* Verrouillé : équipe figée (fond hachuré) ; pendant un glisser-déposer, effacé et refusé */
.bp--locked .bp-members {
  background: repeating-linear-gradient(-45deg, transparent 0 7px, rgba(var(--v-theme-on-surface), 0.045) 7px 14px);
}
.bp--locked-drag { opacity: 0.55; }
.bp--refuse { border-color: rgba(var(--v-theme-error), 0.7); border-style: dashed; opacity: 0.85; }
.bp-members { position: relative; }
.refuse-hint {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 6px;
  border-radius: var(--radius-control); background: rgba(var(--v-theme-surface), 0.9);
  color: rgb(var(--v-theme-error)); font-size: 0.82rem; font-weight: 650; pointer-events: none;
}
.choice-badge { height: 26px; padding: 0 10px; font-size: 0.78rem; white-space: nowrap; }
.sub-tag { text-decoration: underline dotted; text-underline-offset: 2px; cursor: help; }
.bp-head { display: flex; align-items: flex-start; gap: 6px; }
.bp-title { font-size: 0.95rem; font-weight: 650; margin: 0; min-width: 0; }
.bp-sub { font-size: 0.78rem; color: var(--text-secondary); }
.size-badge {
  flex: none; min-width: 30px; height: 26px; padding: 0 9px; border-radius: 999px;
  display: grid; place-items: center; font-weight: 700; font-size: 0.85rem;
}
.size--ok { background: var(--success-bg); color: rgb(var(--v-theme-success)); }
.size--low { background: var(--warn-bg); color: rgb(var(--v-theme-warning)); }
.size--high { background: var(--error-bg); color: rgb(var(--v-theme-error)); }
.size--empty { background: var(--neutral-chip-bg); color: var(--text-secondary); }
.bp-tools { display: flex; align-items: center; gap: 2px; margin: -2px -6px -2px 0; }
.coverage { display: flex; flex-wrap: wrap; gap: 6px; }
/* Couverture d'un domaine : la forme porte l'information (plein + ✓, plein + ≈, pointillés + !) */
.cov {
  position: relative; display: inline-grid; place-items: center; width: 30px; height: 26px; border-radius: var(--radius-control);
  background: var(--neutral-chip-bg); border: 1.5px solid transparent;
}
.cov--missing { background: transparent; border: 1.5px dashed rgba(var(--v-theme-error), 0.7); color: var(--text-secondary); }
.cov-mark {
  position: absolute; right: -5px; top: -5px; width: 14px; height: 14px; border-radius: 50%;
  display: grid; place-items: center; border: 1.5px solid rgb(var(--v-theme-surface));
  color: #fff;
}
.cov--ok .cov-mark { background: rgb(var(--v-theme-success)); }
.cov--partial .cov-mark { background: rgb(var(--v-theme-warning)); }
.cov--missing .cov-mark { background: rgb(var(--v-theme-error)); }
.lock-on { color: rgb(var(--v-theme-on-surface)); }
.bp-members {
  display: flex; flex-wrap: wrap; gap: 6px; min-height: 44px; padding: 6px; border-radius: var(--radius-control);
  background: rgba(var(--v-theme-on-surface), 0.025);
}
.bp-members--empty { align-items: center; justify-content: center; border: 1px dashed rgba(var(--v-border-color), 0.24); background: transparent; }
.empty-hint { font-size: 0.8rem; color: var(--text-secondary); }
.bp-warn { display: flex; align-items: center; gap: 6px; font-size: 0.76rem; color: rgb(var(--v-theme-warning)); }
</style>
