<template>
  <div class="domain-badges" :class="`domain-badges--${mode}`">
    <template v-if="mode === 'icons'">
      <span
        v-for="d in domains"
        :key="d.id"
        class="domain-icon"
        :style="tint(d)"
        role="img"
        :aria-label="d.name"
      >
        <v-icon :icon="domainIcon(d)" :size="size === 'small' ? 15 : 17" />
        <v-tooltip activator="parent">{{ d.name }}</v-tooltip>
      </span>
    </template>
    <template v-else>
      <span v-for="d in domains" :key="d.id" class="domain-chip" :style="tint(d)">
        <v-icon :icon="domainIcon(d)" size="16" />
        <span>{{ d.name }}</span>
      </span>
    </template>
  </div>
</template>

<script setup>
import { useDark } from '@/composables/useDark'
import { domainColor, domainIcon } from '@/utils/palette'

defineProps({
  domains: { type: Array, default: () => [] },
  mode: { type: String, default: 'icons' }, // icons | chips
  size: { type: String, default: 'default' },
})

const dark = useDark()

function tint(d) {
  const c = domainColor(d, dark.value)
  return { color: c, background: `color-mix(in srgb, ${c} ${dark.value ? 16 : 11}%, transparent)` }
}
</script>

<style scoped>
.domain-badges { display: flex; flex-wrap: wrap; gap: 6px; }
.domain-icon {
  width: 28px; height: 28px; border-radius: 8px;
  display: inline-grid; place-items: center;
}
.domain-badges--icons :deep(.v-icon) { opacity: 0.95; }
.domain-chip {
  display: inline-flex; align-items: center; gap: 6px;
  height: 28px; padding: 0 10px; border-radius: 8px;
  font-size: 0.82rem; font-weight: 550; white-space: nowrap;
}
</style>
