<template>
  <v-navigation-drawer
    :model-value="!!student"
    location="right"
    temporary
    :width="xs ? 360 : 440"
    class="student-panel"
    :scrim="false"
    data-testid="student-panel"
    @update:model-value="(v) => !v && $emit('close')"
  >
    <template v-if="student">
      <div class="sp-head">
        <span class="ori-badge ori-lg">{{ student.orientationAcronym || '?' }}</span>
        <div class="min-w-0 flex-grow-1">
          <h2 class="sp-name">{{ student.fullName }}</h2>
          <div class="text-body-2 muted text-truncate">
            #{{ student.id }}<template v-if="student.orientation"> · {{ student.orientation.name }}</template>
          </div>
          <a v-if="student.email" class="text-body-2 sp-mail" :href="`mailto:${student.email}`">{{ student.email }}</a>
        </div>
        <v-btn icon="mdi-close" variant="text" aria-label="Fermer la fiche de l'étudiant" @click="$emit('close')" />
      </div>

      <div class="sp-flags">
        <span v-if="student.excluded" class="flag flag--excluded"><v-icon icon="mdi-account-cancel-outline" size="15" />Exclu de la répartition</span>
        <span v-if="student.locked" class="flag flag--locked"><v-icon icon="mdi-lock" size="15" />Affectation verrouillée</span>
      </div>

      <div v-if="frozen" class="frozen" data-testid="panel-frozen">
        <v-icon icon="mdi-lock" size="18" class="flex-none mt-px" />
        <div class="flex-grow-1">
          <div>{{ projectLocked ? `Son projet « ${assignedProject.title} » est verrouillé : son affectation ne peut pas changer.` : 'Son affectation est verrouillée : elle ne peut pas changer.' }}</div>
          <v-btn
            v-if="projectLocked"
            class="mt-2"
            size="small"
            variant="outlined"
            prepend-icon="mdi-lock-open-variant-outline"
            :loading="busy === 'unlock-project'"
            data-testid="panel-unlock-project"
            @click="run('unlock-project', () => onToggleLock(assignedProject))"
          >
            Déverrouiller le projet
          </v-btn>
          <div v-else class="text-caption mt-1">Déverrouillez-la plus bas (« Verrouiller son affectation »).</div>
        </div>
      </div>

      <section class="sp-section">
        <h3 class="sp-title">Affectation actuelle</h3>
        <div v-if="assignedProject" class="current">
          <div class="min-w-0 flex-grow-1">
            <div class="font-weight-bold text-truncate">{{ assignedProject.title }}</div>
            <div class="text-caption muted">#{{ assignedProject.id }} · {{ assignedProject.ownerName }}</div>
          </div>
          <span class="rank-badge" :class="`rank--${rankTone(assignedRank)}`">
            {{ assignedRank == null ? 'hors choix' : `choix ${assignedRank}` }}
            <v-tooltip activator="parent" location="top">{{ assignedRank == null ? "Ce projet n'est pas dans ses 5 choix" : `Ce projet est son choix n°${assignedRank}` }}</v-tooltip>
          </span>
        </div>
        <div v-else class="text-body-2 muted">{{ student.excluded ? 'Exclu : non affecté.' : 'Non affecté.' }}</div>
        <v-btn
          v-if="assignedProject && !student.excluded"
          class="mt-2"
          variant="text"
          size="small"
          prepend-icon="mdi-account-remove-outline"
          :disabled="!!frozen"
          :loading="busy === 'unassign'"
          data-testid="panel-unassign"
          @click="run('unassign', () => onUnassign(student))"
        >
          Retirer de ce projet
        </v-btn>
      </section>

      <section class="sp-section">
        <h3 class="sp-title">Ses choix</h3>
        <ol class="choices">
          <li v-for="c in choices" :key="c.rank" class="choice" :class="{ 'choice--assigned': c.assigned }" :data-testid="`panel-choice-${c.rank}`">
            <span class="choice-rank" :class="`rank--${rankTone(c.rank)}`">
              {{ c.rank }}
              <v-tooltip activator="parent" location="left">Choix n°{{ c.rank }}</v-tooltip>
            </span>
            <template v-if="c.project">
              <div class="min-w-0 flex-grow-1">
                <div class="choice-title text-truncate">
                  {{ c.project.title }}
                  <v-tooltip activator="parent" location="top" :open-delay="300">#{{ c.project.id }} · {{ c.project.title }} · {{ c.project.ownerName }}</v-tooltip>
                </div>
                <div class="text-caption muted">
                  #{{ c.project.id }} ·
                  <span class="hint">{{ plural(c.count, 'étudiant') }}<v-tooltip activator="parent" location="bottom">{{ plural(c.count, 'étudiant déjà affecté', 'étudiants déjà affectés') }} à ce projet</v-tooltip></span>
                  <template v-if="!c.project.selected"> · <span class="text-error hint" :data-testid="`panel-unselected-${c.rank}`">non sélectionné<v-tooltip activator="parent" location="bottom">Projet non sélectionné pour le cours : il n'est pas prévu de l'ouvrir (page « Sélection »).</v-tooltip></span></template>
                  <template v-if="c.project.isLocked"> · <span class="hint"><v-icon icon="mdi-lock" size="12" aria-label="projet verrouillé" /> verrouillé<v-tooltip activator="parent" location="bottom">Projet verrouillé : son équipe ne peut pas changer.</v-tooltip></span></template>
                </div>
              </div>
              <span v-if="c.assigned" class="assigned">
                <v-icon icon="mdi-check" size="15" />Affecté
                <v-tooltip activator="parent" location="top">Il est actuellement affecté à ce projet</v-tooltip>
              </span>
              <span v-else-if="!student.excluded" class="d-inline-flex">
                <v-btn
                  size="small"
                  variant="outlined"
                  :disabled="!!assignBlock(c.project)"
                  :loading="busy === `assign-${c.project.id}`"
                  :data-testid="`assign-choice-${c.rank}`"
                  @click="run(`assign-${c.project.id}`, () => onAssign(student, c.project))"
                >
                  Affecter
                </v-btn>
                <v-tooltip activator="parent" location="left" max-width="280">{{ assignBlock(c.project) || `Affecter à ce projet (son choix n°${c.rank})` }}</v-tooltip>
              </span>
            </template>
            <span v-else-if="c.unknownId" class="text-body-2 muted">Projet #{{ c.unknownId }} (hors du cours)</span>
            <span v-else class="text-body-2 muted font-italic">Aucun</span>
          </li>
        </ol>
      </section>

      <section v-if="!student.excluded" class="sp-section">
        <h3 class="sp-title">Affecter à un autre projet</h3>
        <div class="d-flex ga-2 align-center">
          <v-autocomplete
            v-model="target"
            :items="projectItems"
            :disabled="!!frozen"
            label="Projet"
            density="compact"
            hide-details
            clearable
            class="flex-grow-1"
          />
          <v-btn variant="outlined" :disabled="!target || !!frozen" :loading="busy === 'assign-other'" @click="assignOther">Affecter</v-btn>
        </div>
        <p class="text-caption muted mt-1 mb-0">Les projets verrouillés ne sont pas proposés.</p>
      </section>

      <section class="sp-section">
        <h3 class="sp-title">Répartition automatique</h3>
        <v-switch
          :model-value="student.locked"
          :disabled="student.excluded || (!student.locked && !assignedProject) || busy === 'lock'"
          label="Verrouiller son affectation"
          data-testid="student-lock"
          @update:model-value="(v) => run('lock', () => onFlags(student, { locked: !!v }))"
        />
        <p class="text-caption muted mt-1 mb-3">
          {{ assignedProject || student.locked ? "Son projet ne change plus : ni glisser-déposer, ni calcul automatique. Déverrouillez pour le déplacer." : "Affectez-le d'abord à un projet pour pouvoir verrouiller son affectation." }}
        </p>
        <span v-if="!student.excluded" class="d-inline-flex">
          <v-btn
            variant="outlined"
            color="error"
            prepend-icon="mdi-account-cancel-outline"
            :disabled="!!frozen"
            :loading="busy === 'exclude'"
            data-testid="student-exclude"
            @click="exclude"
          >
            Exclure de la répartition
          </v-btn>
          <v-tooltip v-if="frozen" activator="parent" location="top" max-width="300">{{ frozen }}</v-tooltip>
        </span>
        <v-btn
          v-else
          variant="outlined"
          prepend-icon="mdi-account-reactivate-outline"
          :loading="busy === 'exclude'"
          data-testid="student-include"
          @click="run('exclude', () => onFlags(student, { excluded: false }))"
        >
          Réintégrer dans la répartition
        </v-btn>
        <p class="text-caption muted mt-2">Exclure : sujet personnel, abandon… L'étudiant est retiré de son projet et ignoré par le calcul.</p>
      </section>

      <section class="sp-section">
        <v-switch
          :model-value="onlyChoices"
          label="Afficher seulement ses choix dans le tableau"
          @update:model-value="$emit('update:onlyChoices', !!$event)"
        />
      </section>
    </template>
  </v-navigation-drawer>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useConfirmStore } from '@/stores/confirm'
import { lockedProjectText, lockReason, rankTone } from '@/utils/board'
import { plural } from '@/utils/text'
import './boardStyles.css'

const props = defineProps({
  student: { type: Object, default: null },
  projectById: { type: Map, required: true },
  memberCounts: { type: Map, required: true },
  boardProjects: { type: Array, required: true },
  onlyChoices: { type: Boolean, default: false },
  // Actions fournies par le parent (@assign, @unassign, @flags) : elles renvoient une promesse.
  onAssign: { type: Function, required: true },
  onUnassign: { type: Function, required: true },
  onFlags: { type: Function, required: true },
  onToggleLock: { type: Function, required: true },
})
const emit = defineEmits(['close', 'update:onlyChoices'])
const { xs } = useDisplay()
const confirm = useConfirmStore()

const busy = ref(null)
const target = ref(null)

watch(() => props.student && props.student.id, () => { target.value = null })

// Échap ferme la fiche (le tableau reste utilisable pendant qu'elle est ouverte).
function onKey(e) {
  if (e.key === 'Escape' && props.student && !document.querySelector('.v-dialog.v-overlay--active, .v-menu.v-overlay--active')) emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

const assignedProject = computed(() => {
  const pid = props.student && props.student.assignedProjectId
  return pid ? props.projectById.get(pid) || { id: pid, title: `Projet #${pid}`, ownerName: '' } : null
})
// Affectation figée : étudiant verrouillé ou projet actuel verrouillé (raison affichée).
const frozen = computed(() => (props.student ? lockReason(props.student, props.projectById) : null))
const projectLocked = computed(() => !!(assignedProject.value && assignedProject.value.isLocked))
function assignBlock(project) {
  if (frozen.value) return frozen.value
  if (project.isLocked) return lockedProjectText(project)
  return null
}
const assignedRank = computed(() => (assignedProject.value ? props.student.rankOf(assignedProject.value.id) : null))
const choices = computed(() =>
  [1, 2, 3, 4, 5].map((rank) => {
    const pref = props.student.preferences.find((p) => p.priority === rank)
    const project = pref ? props.projectById.get(pref.project_id) : null
    return {
      rank,
      project,
      unknownId: pref && !project ? pref.project_id : null,
      count: project ? props.memberCounts.get(project.id) || 0 : 0,
      assigned: project && props.student.assignedProjectId === project.id,
    }
  }),
)
const projectItems = computed(() =>
  props.boardProjects
    .filter((p) => !props.student || p.id !== props.student.assignedProjectId)
    .filter((p) => !p.isLocked)
    .map((p) => ({ title: `#${p.id} · ${p.title}`, value: p.id })),
)

async function run(key, fn) {
  busy.value = key
  try {
    await fn()
  } finally {
    busy.value = null
  }
}

async function assignOther() {
  const p = props.projectById.get(target.value)
  if (!p) return
  await run('assign-other', () => props.onAssign(props.student, p))
  target.value = null
}

async function exclude() {
  const ok = await confirm.ask({
    title: `Exclure ${props.student.fullName} ?`,
    text: "L'étudiant sera retiré de son projet et ignoré par le calcul de la répartition (sujet personnel, abandon…). Vous pourrez le réintégrer.",
    confirmText: 'Exclure',
    color: 'error',
    icon: 'mdi-account-cancel-outline',
  })
  if (ok) await run('exclude', () => props.onFlags(props.student, { excluded: true }))
}
</script>

<style scoped>
.student-panel { border-left: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }
.student-panel.v-navigation-drawer--active { box-shadow: -12px 0 32px -16px rgba(0, 0, 0, 0.25) !important; }
.sp-head { display: flex; align-items: flex-start; gap: 12px; padding: 18px 8px 10px 18px; }
.ori-lg { min-width: 44px; height: 30px; font-size: 0.8rem; margin-top: 2px; }
.sp-name { font-size: 1.15rem; font-weight: 700; margin: 0; line-height: 1.3; }
.sp-mail { color: var(--link); text-decoration: none; }
.sp-flags { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 18px; }
.flag { display: inline-flex; align-items: center; gap: 4px; font-size: 0.78rem; font-weight: 600; padding: 3px 10px; border-radius: 999px; }
.flag--excluded { background: var(--error-bg); color: rgb(var(--v-theme-error)); }
.flag--locked { background: var(--neutral-chip-bg); }
.sp-section { padding: 14px 18px; border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); margin-top: 10px; }
.sp-section + .sp-section { margin-top: 0; }
.sp-title { font-size: 0.78rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-secondary); margin: 0 0 10px; }
.current { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: var(--radius-control); background: var(--neutral-chip-bg); }
.choices { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
.choice { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: var(--radius-control); border: 1px solid rgba(var(--v-border-color), 0.12); }
.choice--assigned { border: 2px solid var(--sel); padding: 7px 9px; }
.choice-rank { flex: none; width: 26px; height: 26px; border-radius: 999px; display: grid; place-items: center; font-weight: 700; font-size: 0.8rem; }
.choice-title { font-weight: 600; font-size: 0.9rem; }
.assigned { display: inline-flex; align-items: center; gap: 3px; font-size: 0.78rem; font-weight: 700; }
.hint { text-decoration: underline dotted; text-underline-offset: 2px; cursor: help; }
.frozen {
  display: flex; gap: 10px; margin: 12px 18px 0; padding: 10px 12px; border-radius: var(--radius-control);
  background: var(--neutral-chip-bg); font-size: 0.86rem; line-height: 1.4;
}
.mt-px { margin-top: 1px; }
</style>
