<template>
  <v-dialog
    :model-value="projectId != null"
    max-width="980"
    :fullscreen="xs"
    scrollable
    @update:model-value="(v) => !v && close()"
  >
    <v-card class="detail-card" :aria-label="base ? `Projet ${base.title}` : 'Projet'" data-testid="project-detail">
      <div class="detail-head">
        <div class="min-w-0 flex-grow-1">
          <div v-if="base" class="eyebrow">
            Cours {{ base.year || session.currentYear }}
            <span v-if="pastYear" class="eyebrow-tag">archive · lecture seule</span>
          </div>
          <h2 class="detail-title">
            <template v-if="base">{{ base.title }}</template>
            <v-skeleton-loader v-else type="heading" class="bg-transparent" />
          </h2>
          <div v-if="base && base.owner" class="owner">
            <v-avatar size="28" color="secondary" variant="tonal"><span class="text-caption font-weight-bold">{{ ownerInitials }}</span></v-avatar>
            <span class="font-weight-medium">{{ base.ownerName }}</span>
            <a v-if="base.owner.email" :href="`mailto:${base.owner.email}`" class="muted text-body-2 owner-mail">{{ base.owner.email }}</a>
          </div>
        </div>
        <v-btn icon="mdi-close" variant="text" aria-label="Fermer le détail du projet" @click="close" />
      </div>
      <v-divider />

      <v-card-text class="detail-body">
        <template v-if="base">
          <div class="d-flex flex-wrap align-center ga-2 mb-4">
            <DomainBadges :domains="base.domains" mode="chips" />
            <template v-if="session.user.isAdmin">
              <span class="status-tag" :class="{ 'status-tag--ok': base.selected }">
                <v-icon :icon="base.selected ? 'mdi-check-circle-outline' : 'mdi-circle-outline'" size="15" />
                {{ base.selected ? 'Sélectionné' : 'Non sélectionné' }}
              </span>
              <span v-if="base.isLocked" class="status-tag"><v-icon icon="mdi-lock-outline" size="15" />Verrouillé</span>
            </template>
          </div>
          <p class="lead">{{ base.short_description }}</p>
        </template>

        <PriorityPicker v-if="session.user.isStudent && base" :project="base" class="my-5" />

        <section class="mt-5" aria-label="Description du projet">
          <div v-if="loading" aria-busy="true">
            <v-skeleton-loader type="paragraph, image, paragraph" class="bg-transparent" />
          </div>
          <v-alert v-else-if="error" type="error" variant="tonal" density="comfortable">{{ error }}</v-alert>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div v-else-if="hasDescription" class="rich-content" v-html="safeHtml"></div>
          <div v-else class="muted font-italic">Pas de description détaillée.</div>
        </section>
      </v-card-text>

      <v-divider />
      <div class="detail-actions">
        <v-switch
          v-if="session.user.isAdmin && base && isCurrent"
          :model-value="base.selected"
          :loading="selecting"
          label="Sélectionné pour la répartition"
          class="flex-grow-0 mr-2"
          @update:model-value="toggleSelected"
        />
        <v-spacer />
        <v-btn variant="text" prepend-icon="mdi-file-pdf-box" :loading="exporting" :disabled="!base" @click="exportPdf">
          Exporter en PDF
        </v-btn>
        <v-btn
          v-if="canDuplicate"
          variant="tonal"
          color="primary"
          prepend-icon="mdi-content-copy"
          :loading="duplicating"
          @click="duplicate"
        >
          Reprendre pour {{ session.currentYear }}
        </v-btn>
        <v-btn v-if="canEdit" variant="flat" color="primary" prepend-icon="mdi-pencil-outline" :to="`/edit-project/${projectId}`">
          Modifier
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import DomainBadges from '@/components/projects/DomainBadges.vue'
import PriorityPicker from '@/components/projects/PriorityPicker.vue'
import { useAdminStore } from '@/stores/admin'
import { useNotifyStore } from '@/stores/notify'
import { useProjectsStore } from '@/stores/projects'
import { useSessionStore } from '@/stores/session'
import { isEmptyHtml, sanitizeHtml } from '@/utils/html'
import { initials } from '@/utils/text'

const props = defineProps({
  projectId: { type: Number, default: null },
  // Projet de la liste (sans description), affiché immédiatement.
  project: { type: Object, default: null },
})
const emit = defineEmits(['close'])

const session = useSessionStore()
const projects = useProjectsStore()
const admin = useAdminStore()
const notify = useNotifyStore()
const router = useRouter()
const { xs } = useDisplay()

const full = ref(null)
const loading = ref(false)
const error = ref('')
const exporting = ref(false)
const duplicating = ref(false)
const selecting = ref(false)

const base = computed(() => props.project || full.value)
const ownerInitials = computed(() => initials(base.value && base.value.owner))
const isCurrent = computed(() => !base.value || !base.value.year || base.value.year === session.currentYear)
const pastYear = computed(() => !isCurrent.value)
const isOwner = computed(() => base.value && session.user.isTeacher && base.value.owner_id === session.user.id)
// L'admin peut tout faire (comme côté serveur) ; le prof seulement sur ses projets, en phase de saisie.
const canManage = computed(() => session.user.isAdmin || (isOwner.value && session.canEditProjects))
const canEdit = computed(() => base.value && canManage.value && isCurrent.value)
const canDuplicate = computed(() => base.value && canManage.value && !isCurrent.value)
const description = computed(() => (full.value ? full.value.description : null))
const hasDescription = computed(() => !isEmptyHtml(description.value))
const safeHtml = computed(() => sanitizeHtml(description.value))

watch(
  () => props.projectId,
  async (id) => {
    full.value = null
    error.value = ''
    if (id == null) return
    loading.value = true
    try {
      const p = await projects.fetchFull(id)
      if (props.projectId === id) full.value = p
    } catch (e) {
      if (props.projectId === id) error.value = e.userMessage || 'Projet introuvable.'
    } finally {
      if (props.projectId === id) loading.value = false
    }
  },
  { immediate: true },
)

function close() {
  emit('close')
}

async function exportPdf() {
  exporting.value = true
  try {
    await projects.exportPdf(base.value)
  } catch (e) {
    notify.error(e, 'Export PDF impossible')
  } finally {
    exporting.value = false
  }
}

async function duplicate() {
  duplicating.value = true
  try {
    const copy = await projects.duplicate(base.value.id)
    notify.success(`« ${copy.title} » a été ajouté au cours ${copy.year}. Vous pouvez le modifier.`, 'Projet repris')
    router.push(`/edit-project/${copy.id}`)
  } catch (e) {
    notify.error(e, 'Impossible de reprendre le projet')
  } finally {
    duplicating.value = false
  }
}

async function toggleSelected(value) {
  selecting.value = true
  try {
    await admin.setProjectSelected(base.value.id, !!value)
    if (full.value) full.value.selected = !!value
  } catch (e) {
    notify.error(e, 'La sélection n’a pas été modifiée')
  } finally {
    selecting.value = false
  }
}
</script>

<style scoped>
.detail-card { border-radius: 16px !important; }
.detail-head { display: flex; align-items: flex-start; gap: 12px; padding: 20px 16px 16px 24px; }
.eyebrow { font-size: 0.78rem; font-weight: 600; letter-spacing: 0.02em; color: rgba(var(--v-theme-on-surface), 0.6); margin-bottom: 4px; }
.eyebrow-tag { margin-left: 6px; padding: 1px 8px; border-radius: 999px; background: rgb(var(--v-theme-surface-light)); }
.detail-title { font-size: 1.45rem; font-weight: 700; line-height: 1.25; letter-spacing: -0.015em; margin: 0 0 10px; }
.owner { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.owner-mail { text-decoration: none; }
.owner-mail:hover { text-decoration: underline; }
.detail-body { padding: 20px 24px 28px !important; }
.lead { font-size: 1.05rem; line-height: 1.55; margin: 0; color: rgba(var(--v-theme-on-surface), 0.88); }
.detail-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; padding: 12px 16px 12px 24px; }
.status-tag {
  display: inline-flex; align-items: center; gap: 5px; height: 28px; padding: 0 10px; border-radius: 8px;
  font-size: 0.82rem; font-weight: 550; background: rgb(var(--v-theme-surface-light));
}
.status-tag--ok { background: rgba(var(--v-theme-success), 0.1); color: rgb(var(--v-theme-success)); }
@media (max-width: 600px) {
  .detail-head { padding: 16px 8px 12px 16px; }
  .detail-body { padding: 16px !important; }
  .detail-title { font-size: 1.2rem; }
  .detail-actions { padding: 10px 12px; }
}
</style>
