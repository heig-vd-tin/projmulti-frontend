<template>
  <div class="domain-badges" :class="`domain-badges--${mode}`">
    <template v-if="mode === 'icons'">
      <span v-for="d in sorted" :key="d.id" class="domain-icon" role="img" :aria-label="d.name">
        <v-icon :icon="domainIcon(d)" :color="domainColor(d, dark)" :size="size === 'small' ? 16 : 18" />
        <v-tooltip activator="parent">{{ d.name }}</v-tooltip>
      </span>
    </template>
    <template v-else>
      <span v-for="d in sorted" :key="d.id" class="domain-chip">
        <v-icon :icon="domainIcon(d)" :color="domainColor(d, dark)" size="16" />
        <span>{{ d.name }}</span>
      </span>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDark } from '@/composables/useDark'
import { domainColor, domainIcon, sortDomains } from '@/utils/palette'

const props = defineProps({
  domains: { type: Array, default: () => [] },
  mode: { type: String, default: 'icons' }, // icons | chips
  size: { type: String, default: 'default' },
})

const dark = useDark()
// Ordre canonique : celui des filtres (par identifiant).
const sorted = computed(() => sortDomains(props.domains))
</script>

<style scoped>
.domain-badges { display: flex; flex-wrap: wrap; gap: 6px; }
.domain-icon {
  width: 30px; height: 28px; border-radius: var(--radius-control);
  display: inline-grid; place-items: center;
  background: var(--neutral-chip-bg);
}
.domain-chip {
  display: inline-flex; align-items: center; gap: 6px;
  height: 28px; padding: 0 12px 0 9px; border-radius: 999px;
  font-size: 0.82rem; font-weight: 550; white-space: nowrap;
  background: var(--neutral-chip-bg); color: rgb(var(--v-theme-on-surface));
}
</style>
