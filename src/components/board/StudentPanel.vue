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
        <span class="ori-badge ori-lg" :style="oriStyle">{{ student.orientationAcronym || '?' }}</span>
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

      <section class="sp-section">
        <h3 class="sp-title">Affectation actuelle</h3>
        <div v-if="assignedProject" class="current">
          <div class="min-w-0 flex-grow-1">
            <div class="font-weight-bold text-truncate">{{ assignedProject.title }}</div>
            <div class="text-caption muted">#{{ assignedProject.id }} · {{ assignedProject.ownerName }}</div>
          </div>
          <span class="rank-badge" :class="`rank--${rankTone(assignedRank)}`">{{ assignedRank == null ? 'hors choix' : `choix ${assignedRank}` }}</span>
        </div>
        <div v-else class="text-body-2 muted">{{ student.excluded ? 'Exclu : non affecté.' : 'Non affecté.' }}</div>
        <v-btn
          v-if="assignedProject && !student.excluded"
          class="mt-2"
          variant="text"
          size="small"
          prepend-icon="mdi-account-remove-outline"
          :loading="busy === 'unassign'"
          @click="run('unassign', () => onUnassign(student))"
        >
          Retirer de ce projet
        </v-btn>
      </section>

      <section class="sp-section">
        <h3 class="sp-title">Ses choix</h3>
        <ol class="choices">
          <li v-for="c in choices" :key="c.rank" class="choice" :class="{ 'choice--assigned': c.assigned }" :data-testid="`panel-choice-${c.rank}`">
            <span class="choice-rank">{{ c.rank }}</span>
            <template v-if="c.project">
              <div class="min-w-0 flex-grow-1">
                <div class="choice-title text-truncate" :title="c.project.title">{{ c.project.title }}</div>
                <div class="text-caption muted">
                  #{{ c.project.id }} · {{ plural(c.count, 'étudiant') }}
                  <template v-if="!c.project.selected"> · <span class="text-error">non sélectionné</span></template>
                  <v-icon v-if="c.project.isLocked" icon="mdi-lock" size="12" class="ml-1" aria-label="projet verrouillé" />
                </div>
              </div>
              <span v-if="c.assigned" class="assigned"><v-icon icon="mdi-check" size="15" />Affecté</span>
              <v-btn
                v-else-if="!student.excluded"
                size="small"
                variant="tonal"
                :loading="busy === `assign-${c.project.id}`"
                :data-testid="`assign-choice-${c.rank}`"
                @click="run(`assign-${c.project.id}`, () => onAssign(student, c.project))"
              >
                Affecter
              </v-btn>
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
            label="Projet"
            density="compact"
            hide-details
            clearable
            class="flex-grow-1"
          />
          <v-btn variant="tonal" :disabled="!target" :loading="busy === 'assign-other'" @click="assignOther">Affecter</v-btn>
        </div>
      </section>

      <section class="sp-section">
        <h3 class="sp-title">Répartition automatique</h3>
        <v-switch
          :model-value="student.locked"
          :disabled="student.excluded || busy === 'lock'"
          label="Verrouiller son affectation"
          data-testid="student-lock"
          @update:model-value="(v) => run('lock', () => onFlags(student, { locked: !!v }))"
        />
        <p class="text-caption muted mt-1 mb-3">Le calcul automatique ne changera pas son projet. Le glisser-déposer reste possible.</p>
        <v-btn
          v-if="!student.excluded"
          variant="outlined"
          color="error"
          prepend-icon="mdi-account-cancel-outline"
          :loading="busy === 'exclude'"
          data-testid="student-exclude"
          @click="exclude"
        >
          Exclure de la répartition
        </v-btn>
        <v-btn
          v-else
          variant="tonal"
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
import { useDark } from '@/composables/useDark'
import { useConfirmStore } from '@/stores/confirm'
import { rankTone } from '@/utils/board'
import { orientationColor } from '@/utils/palette'
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
})
const emit = defineEmits(['close', 'update:onlyChoices'])
const { xs } = useDisplay()
const dark = useDark()
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

const oriStyle = computed(() => {
  const c = orientationColor(props.student && props.student.orientationAcronym, dark.value)
  return { color: c, background: `color-mix(in srgb, ${c} ${dark.value ? 18 : 12}%, transparent)` }
})
const assignedProject = computed(() => {
  const pid = props.student && props.student.assignedProjectId
  return pid ? props.projectById.get(pid) || { id: pid, title: `Projet #${pid}`, ownerName: '' } : null
})
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
.ori-lg { min-width: 44px; height: 30px; font-size: 0.8rem; border-radius: 8px; margin-top: 2px; }
.sp-name { font-size: 1.15rem; font-weight: 700; margin: 0; line-height: 1.3; }
.sp-mail { color: rgb(var(--v-theme-primary)); text-decoration: none; }
.sp-flags { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 18px; }
.flag { display: inline-flex; align-items: center; gap: 4px; font-size: 0.78rem; font-weight: 600; padding: 3px 9px; border-radius: 8px; }
.flag--excluded { background: rgba(var(--v-theme-error), 0.1); color: rgb(var(--v-theme-error)); }
.flag--locked { background: rgb(var(--v-theme-surface-light)); }
.sp-section { padding: 14px 18px; border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); margin-top: 10px; }
.sp-section + .sp-section { margin-top: 0; }
.sp-title { font-size: 0.78rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: rgba(var(--v-theme-on-surface), 0.6); margin: 0 0 10px; }
.current { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; background: rgb(var(--v-theme-surface-light)); }
.choices { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
.choice { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 10px; border: 1px solid rgba(var(--v-border-color), 0.1); }
.choice--assigned { border-color: rgba(var(--v-theme-success), 0.45); background: rgba(var(--v-theme-success), 0.06); }
.choice-rank { flex: none; width: 26px; height: 26px; border-radius: 8px; display: grid; place-items: center; font-weight: 700; font-size: 0.85rem; background: rgb(var(--v-theme-surface-light)); }
.choice-title { font-weight: 600; font-size: 0.9rem; }
.assigned { display: inline-flex; align-items: center; gap: 3px; font-size: 0.78rem; font-weight: 700; color: rgb(var(--v-theme-success)); }
</style>
