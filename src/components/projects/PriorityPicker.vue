<template>
  <section class="priority-picker" aria-labelledby="pp-title">
    <div class="d-flex align-center flex-wrap ga-2 mb-3">
      <h3 id="pp-title" class="pp-title">
        <template v-if="current">Ce projet est votre choix n°{{ current }}</template>
        <template v-else>Ajouter à mes choix</template>
      </h3>
      <v-spacer />
      <span class="text-caption muted">1 = meilleur choix · 5 = dernier choix</span>
    </div>
    <div class="pp-slots" role="group" aria-label="Priorité du projet dans vos choix">
      <button
        v-for="n in MAX_CHOICES"
        :key="n"
        type="button"
        class="pp-slot"
        :class="{ 'pp-slot--current': current === n, 'pp-slot--taken': occupantOf(n) && current !== n }"
        :disabled="prefs.saving"
        :aria-pressed="current === n"
        :aria-label="slotLabel(n)"
        :data-testid="`priority-${n}`"
        @click="pick(n)"
      >
        <span class="pp-num">{{ n }}</span>
        <span class="pp-sub text-truncate">
          <template v-if="current === n">Ce projet</template>
          <template v-else-if="occupantOf(n)">{{ occupantOf(n).title }}</template>
          <template v-else>Libre</template>
        </span>
      </button>
    </div>
    <div class="d-flex align-center flex-wrap ga-2 mt-3">
      <span class="text-body-2 muted">
        <template v-if="current">Choisissez un autre numéro pour changer sa place (échange avec le projet qui l'occupe).</template>
        <template v-else-if="prefs.isFull">Vos 5 choix sont faits : choisir un numéro remplace le projet qui l'occupe.</template>
        <template v-else>Il vous reste {{ MAX_CHOICES - prefs.count }} choix.</template>
      </span>
      <v-spacer />
      <v-btn v-if="current" variant="text" color="error" prepend-icon="mdi-close" :loading="prefs.saving" @click="removeIt">
        Retirer de mes choix
      </v-btn>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useConfirmStore } from '@/stores/confirm'
import { useNotifyStore } from '@/stores/notify'
import { MAX_CHOICES, usePreferencesStore } from '@/stores/preferences'

const props = defineProps({ project: { type: Object, required: true } })

const prefs = usePreferencesStore()
const notify = useNotifyStore()
const confirm = useConfirmStore()

const current = computed(() => prefs.priorityOf(props.project.id))

function occupantOf(n) {
  const p = prefs.occupant(n)
  return p && p.id !== props.project.id ? p : null
}

function slotLabel(n) {
  if (current.value === n) return `Choix n°${n} : ce projet`
  const o = occupantOf(n)
  return o ? `Choix n°${n}, actuellement « ${o.title} »` : `Choix n°${n}, libre`
}

async function pick(n) {
  if (current.value === n) return
  const other = occupantOf(n)
  try {
    if (other && !current.value) {
      const ok = await confirm.ask({
        title: `Remplacer votre choix n°${n} ?`,
        text: `« ${other.title} » sera retiré de vos choix et remplacé par « ${props.project.title} ».`,
        confirmText: 'Remplacer',
        icon: 'mdi-swap-horizontal',
      })
      if (!ok) return
      await prefs.choose(props.project.id, n, { replace: true })
    } else {
      await prefs.choose(props.project.id, n)
    }
    notify.success(`« ${props.project.title} » est votre choix n°${n}.`)
  } catch (error) {
    notify.error(error, "Le choix n'a pas été enregistré")
    prefs.fetch().catch(() => {})
  }
}

async function removeIt() {
  try {
    await prefs.remove(props.project.id)
    notify.success(`« ${props.project.title} » a été retiré de vos choix.`)
  } catch (error) {
    notify.error(error, "Le choix n'a pas pu être retiré")
  }
}
</script>

<style scoped>
.priority-picker {
  padding: 16px;
  border-radius: 12px;
  background: rgb(var(--v-theme-surface-light));
}
.pp-title { font-size: 0.98rem; font-weight: 650; margin: 0; }
.pp-slots { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
.pp-slot {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 10px 6px; border-radius: 10px; min-width: 0;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), 0.14);
  color: inherit; cursor: pointer; font: inherit;
  transition: border-color 0.15s, background 0.15s;
}
.pp-slot:hover:not(:disabled) { border-color: rgba(var(--v-theme-primary), 0.6); }
.pp-slot:disabled { opacity: 0.6; cursor: progress; }
.pp-slot--current {
  background: rgb(var(--v-theme-primary)); color: rgb(var(--v-theme-on-primary));
  border-color: rgb(var(--v-theme-primary));
}
.pp-num { font-size: 1.35rem; font-weight: 700; line-height: 1.1; }
.pp-sub { font-size: 0.72rem; max-width: 100%; opacity: 0.8; }
.pp-slot--taken .pp-sub { font-style: italic; }
@media (max-width: 480px) {
  .pp-slots { gap: 6px; }
  .pp-sub { display: none; }
}
</style>
