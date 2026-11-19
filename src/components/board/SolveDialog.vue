<template>
  <v-dialog :model-value="modelValue" max-width="640" persistent @update:model-value="$emit('update:modelValue', $event)">
    <v-card class="pa-2" data-testid="solve-dialog">
      <v-card-item>
        <template #prepend>
          <v-avatar color="primary" variant="tonal" rounded="lg"><v-icon icon="mdi-auto-fix" /></v-avatar>
        </template>
        <v-card-title class="text-h6 font-weight-bold">Calculer la répartition</v-card-title>
        <v-card-subtitle>Optimisation des choix de tous les étudiants (solveur exact)</v-card-subtitle>
      </v-card-item>

      <v-card-text>
        <div class="params">
          <v-number-input v-model="form.min_size" label="Taille minimale d'un groupe" :min="1" :max="10" control-variant="split" density="compact" hide-details="auto" />
          <v-number-input v-model="form.max_size" label="Taille maximale d'un groupe" :min="1" :max="10" control-variant="split" density="compact" hide-details="auto" :error-messages="sizeError" />
          <v-number-input v-model="form.max_same_orientation" label="Max. étudiants d'une même orientation" :min="1" :max="10" control-variant="split" density="compact" hide-details="auto" />
        </div>
        <div class="switches mt-4">
          <v-switch v-model="form.allow_fifth_choice" label="Autoriser le 5e choix" />
          <v-switch v-model="form.allow_out_of_choice" label="Autoriser une affectation hors des choix (en dernier recours)" />
        </div>

        <ul class="rules text-body-2 mt-4">
          <li><v-icon icon="mdi-lock" size="15" /> Les projets verrouillés gardent exactement leurs étudiants ; les étudiants verrouillés gardent leur projet.</li>
          <li><v-icon icon="mdi-account-cancel-outline" size="15" /> Les étudiants exclus sont ignorés.</li>
          <li><v-icon icon="mdi-check-circle-outline" size="15" /> Les projets sélectionnés sont forcément ouverts.</li>
        </ul>

        <v-alert type="warning" variant="tonal" density="comfortable" class="mt-4" icon="mdi-content-save-alert-outline">
          Le calcul <strong>remplace la répartition actuelle</strong> (hors éléments verrouillés).
          Sauvegardez-la d'abord pour pouvoir revenir en arrière.
          <div class="mt-2">
            <v-btn size="small" variant="flat" color="warning" prepend-icon="mdi-download" :loading="saving" data-testid="solve-save-first" @click="$emit('save')">
              Sauvegarder la répartition actuelle (.prjmult)
            </v-btn>
            <span v-if="saved" class="ml-2 text-body-2"><v-icon icon="mdi-check" size="16" /> sauvegardée</span>
          </div>
        </v-alert>

        <v-alert v-if="error" type="error" variant="tonal" density="comfortable" class="mt-4" data-testid="solve-error">{{ error }}</v-alert>
      </v-card-text>

      <v-card-actions class="px-4 pb-3">
        <v-btn variant="text" @click="reset">Valeurs par défaut</v-btn>
        <v-spacer />
        <v-btn variant="text" :disabled="running" @click="$emit('update:modelValue', false)">Annuler</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-auto-fix" :loading="running" :disabled="!!sizeError" data-testid="solve-run" @click="submit">
          Calculer
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { DEFAULT_SOLVE_PARAMS } from '@/stores/admin'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  params: { type: Object, required: true },
  running: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
  saved: { type: Boolean, default: false },
  error: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue', 'run', 'save'])

const form = reactive({ ...props.params })
watch(() => props.modelValue, (open) => { if (open) Object.assign(form, props.params) })

const sizeError = computed(() => (Number(form.max_size) < Number(form.min_size) ? 'Doit être au moins égale à la taille minimale.' : ''))

function reset() {
  Object.assign(form, DEFAULT_SOLVE_PARAMS)
}

function submit() {
  emit('run', {
    min_size: Number(form.min_size),
    max_size: Number(form.max_size),
    max_same_orientation: Number(form.max_same_orientation),
    allow_fifth_choice: !!form.allow_fifth_choice,
    allow_out_of_choice: !!form.allow_out_of_choice,
  })
}
</script>

<style scoped>
.params { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; }
.switches { display: flex; flex-direction: column; gap: 4px; }
.rules { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; color: rgba(var(--v-theme-on-surface), 0.75); }
.rules .v-icon { margin-right: 4px; vertical-align: -2px; }
</style>
