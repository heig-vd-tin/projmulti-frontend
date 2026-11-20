<template>
  <div class="page page--narrow">
    <header class="page-header">
      <div>
        <h1>Réglages</h1>
        <div class="subtitle">Cours {{ session.currentYear }} · le responsable a toujours accès à tout.</div>
      </div>
    </header>

    <section class="surface-card pa-5 pa-sm-6 mb-5" aria-labelledby="phase-title">
      <h2 id="phase-title" class="section-title">Phase de la plateforme</h2>
      <p class="section-hint">Ce que les enseignants et les étudiants peuvent faire en ce moment.</p>
      <div class="phase-grid" role="radiogroup" aria-labelledby="phase-title">
        <button
          v-for="(info, key) in PHASES"
          :key="key"
          type="button"
          role="radio"
          class="phase-option"
          :class="{ 'phase-option--on': phase === key }"
          :aria-checked="phase === key"
          :data-testid="`phase-${key}`"
          @click="phase = key"
        >
          <div class="d-flex align-center ga-2 mb-2 pr-6">
            <v-icon :icon="info.icon" size="20" />
            <span class="font-weight-bold">{{ info.title }}</span>
          </div>
          <span class="option-check" aria-hidden="true"><v-icon v-if="phase === key" icon="mdi-check" size="15" /></span>
          <div class="text-body-2 phase-desc">{{ info.description }}</div>
          <span v-if="session.phase === key" class="tag mt-3 current-tag">phase actuelle</span>
        </button>
      </div>
      <div class="card-actions">
        <v-btn color="primary" variant="flat" :disabled="phase === session.phase" :loading="savingPhase" data-testid="save-phase" @click="savePhase">
          Enregistrer la phase
        </v-btn>
      </div>
    </section>

    <section class="surface-card pa-5 pa-sm-6 mb-5" aria-labelledby="mapping-title">
      <h2 id="mapping-title" class="section-title">Correspondance domaines → orientations</h2>
      <p class="section-hint">
        Quelles orientations peuvent tenir le rôle d'un domaine dans un projet. Les orientations EBA, THI et THO ne participent pas cette année (atténuées).
      </p>
      <DomainMappingEditor />
    </section>

    <section class="surface-card pa-5 pa-sm-6 mb-5" aria-labelledby="students-title">
      <h2 id="students-title" class="section-title">Étudiants inscrits</h2>
      <div>
        <p class="section-hint">
          {{ plural(admin.students.length, 'étudiant') }} {{ admin.students.length > 1 ? 'se sont connectés' : 's\'est connecté' }}
          à la plateforme pour le cours {{ session.currentYear }} ({{ withChoices }} avec au moins un choix).
        </p>
      </div>
      <div class="card-actions">
        <v-btn variant="outlined" prepend-icon="mdi-file-delimited-outline" data-testid="export-students" @click="exportStudents">
          Exporter la liste (CSV)
        </v-btn>
      </div>
    </section>

    <section class="surface-card danger pa-5 pa-sm-6" aria-labelledby="year-title">
      <h2 id="year-title" class="section-title">Démarrer une nouvelle année</h2>
      <p class="section-hint mb-2">À faire une fois la répartition du cours {{ session.currentYear }} terminée et exportée. Cette action :</p>
      <ul class="year-list mb-3">
        <li><strong>supprime</strong> les choix des étudiants, la répartition et la liste des étudiants ;</li>
        <li><strong>garde</strong> tous les projets (consultables en choisissant l'année {{ session.currentYear }}) et les enseignants ;</li>
        <li>ouvre la saisie des projets de la nouvelle année aux enseignants.</li>
      </ul>
      <p class="text-body-2 muted mb-4">Une sauvegarde de la base est faite automatiquement deux fois par jour sur le serveur.</p>
      <div class="d-flex align-center flex-wrap ga-3 justify-end">
        <v-text-field
          v-model="yearInput"
          label="Nouvelle année"
          inputmode="numeric"
          maxlength="4"
          density="compact"
          :hint="yearError || `Par exemple ${nextYear}`"
          :error="!!yearInput && !!yearError"
          persistent-hint
          class="year-field"
          autocomplete="off"
          data-testid="new-year-input"
          @keyup.enter="yearOk && newYear()"
        />
        <v-btn color="error" variant="flat" :disabled="!yearOk" :loading="starting" data-testid="start-new-year" @click="newYear">
          {{ yearOk ? `Démarrer le cours ${newYearValue}` : 'Démarrer la nouvelle année' }}
        </v-btn>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import DomainMappingEditor from '@/components/admin/DomainMappingEditor.vue'
import { useAdminStore } from '@/stores/admin'
import { useConfirmStore } from '@/stores/confirm'
import { useNotifyStore } from '@/stores/notify'
import { useProjectsStore } from '@/stores/projects'
import { PHASES, useSessionStore } from '@/stores/session'
import { exportStudentsCsv } from '@/utils/exports'
import { plural } from '@/utils/text'

const session = useSessionStore()
const admin = useAdminStore()
const projects = useProjectsStore()
const notify = useNotifyStore()
const confirm = useConfirmStore()

const phase = ref(session.phase)
const savingPhase = ref(false)
const yearInput = ref('')
const starting = ref(false)

const nextYear = computed(() => (session.currentYear || 0) + 1)
// Année tapée en chiffres : après l'année courante, au plus 5 ans plus tard (comme le serveur).
const newYearValue = computed(() => Number(String(yearInput.value || '').trim()))
const yearError = computed(() => {
  const y = newYearValue.value
  const cur = session.currentYear || 0
  if (!yearInput.value) return ''
  if (!Number.isInteger(y)) return 'Entrez une année en chiffres.'
  if (y <= cur) return `Doit être après ${cur}.`
  if (y > cur + 5) return `Au plus ${cur + 5}.`
  return ''
})
const yearOk = computed(() => !!yearInput.value && !yearError.value)
const withChoices = computed(() => admin.students.filter((s) => s.preferences.length).length)

watch(() => session.phase, (p) => { phase.value = p })

onMounted(() => {
  admin.fetchStudents().catch((e) => notify.error(e))
  if (!admin.projects.length) admin.fetchProjects().catch(() => {})
})

async function savePhase() {
  savingPhase.value = true
  try {
    await session.updateSettings({ phase: phase.value })
    notify.success(PHASES[phase.value].title, 'Phase enregistrée')
  } catch (error) {
    notify.error(error)
  } finally {
    savingPhase.value = false
  }
}

async function newYear() {
  const year = newYearValue.value
  const n = admin.students.length
  const ok = await confirm.ask({
    title: `Démarrer le cours ${year}\u00a0?`,
    text: `Êtes-vous sûr de vouloir démarrer une nouvelle année\u00a0? ${n ? `Les ${plural(n, 'étudiant')}, leurs choix` : 'Les choix des étudiants'} et la répartition du cours ${session.currentYear} seront supprimés définitivement. Les projets et les enseignants sont gardés.`,
    confirmText: `Oui, démarrer ${year}`,
    cancelText: 'Annuler',
    color: 'error',
    icon: 'mdi-calendar-alert',
  })
  if (!ok) return
  starting.value = true
  try {
    await session.startNewYear({ year })
    await Promise.all([projects.fetchAll(), projects.fetchOwned(), admin.fetchStudents(), admin.fetchUsers(), admin.fetchProjects()])
    yearInput.value = ''
    notify.success('La saisie des projets est ouverte aux enseignants.', `Cours ${session.currentYear} démarré`)
  } catch (error) {
    notify.error(error)
  } finally {
    starting.value = false
  }
}

function exportStudents() {
  const n = exportStudentsCsv(admin.students, admin.projectById)
  notify.success(`${plural(n, 'étudiant exporté', 'étudiants exportés')}.`)
}
</script>

<style scoped>
.section-title { font-size: 1.05rem; font-weight: 700; margin: 0 0 2px; }
.section-hint { margin: 0 0 16px; color: var(--text-secondary); font-size: 0.92rem; }
.card-actions { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.phase-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
.phase-option {
  position: relative; display: flex; flex-direction: column; align-items: flex-start;
  text-align: left; padding: 14px 16px; border-radius: var(--radius-card); cursor: pointer; font: inherit; color: inherit;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), 0.18);
  transition: border-color 0.15s, background 0.15s;
}
.phase-option:hover { border-color: rgba(var(--v-border-color), 0.4); }
/* Option choisie : bord neutre foncé de 2 px et coche (pas de rouge) */
.phase-option--on { border: 2px solid var(--sel); padding: 13px 15px; background: rgba(var(--v-theme-selected), 0.04); }
.option-check {
  position: absolute; top: 12px; right: 12px; width: 20px; height: 20px; border-radius: 50%;
  display: grid; place-items: center; border: 1.5px solid rgba(var(--v-border-color), 0.35);
}
.phase-option--on .option-check { background: var(--sel); border-color: var(--sel); color: rgb(var(--v-theme-surface)); }
.phase-desc { color: var(--text-secondary); }
.current-tag { align-self: flex-start; }
.danger { border-color: rgba(var(--v-theme-error), 0.35) !important; }
.year-list { padding-left: 1.3em; line-height: 1.7; }
.year-field { flex: 0 1 200px; }
</style>
