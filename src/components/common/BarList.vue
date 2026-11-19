<template>
  <ul class="bar-list" :aria-label="label">
    <li v-for="item in items" :key="item.label" class="bar-row" :title="item.hint || `${item.label} : ${item.value}`">
      <span class="bar-label text-truncate">{{ item.label }}</span>
      <span class="bar-track" aria-hidden="true">
        <span class="bar-fill" :style="{ width: pct(item.value) }"></span>
      </span>
      <span class="bar-value tabular">
        {{ item.value }}<span v-if="total" class="muted"> · {{ share(item.value) }}</span>
      </span>
    </li>
  </ul>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: { type: Array, required: true }, // [{ label, value, hint? }]
  label: { type: String, default: '' },
  total: { type: Number, default: 0 }, // si fourni : part en %
})

const max = computed(() => Math.max(1, ...props.items.map((i) => i.value)))
const pct = (v) => `${Math.round((v / max.value) * 100)}%`
const share = (v) => `${Math.round((v / props.total) * 100)} %`
</script>

<style scoped>
.bar-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
.bar-row { display: grid; grid-template-columns: minmax(90px, 150px) minmax(0, 1fr) 84px; align-items: center; gap: 12px; font-size: 0.9rem; }
.bar-label { font-weight: 550; }
.bar-track { height: 10px; border-radius: 4px; background: rgb(var(--v-theme-surface-light)); overflow: hidden; }
.bar-fill { display: block; height: 100%; border-radius: 4px; background: rgba(var(--v-theme-secondary), 0.75); min-width: 2px; }
.bar-value { text-align: right; font-weight: 650; }
</style>
