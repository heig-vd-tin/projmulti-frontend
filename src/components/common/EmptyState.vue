<template>
  <div class="empty-state" :class="{ 'empty-state--compact': compact }">
    <div class="empty-icon"><v-icon :icon="icon" :size="compact ? 26 : 32" /></div>
    <div class="empty-title">{{ title }}</div>
    <div v-if="text || $slots.default" class="empty-text"><slot>{{ text }}</slot></div>
    <div v-if="$slots.actions" class="mt-4 d-flex flex-wrap justify-center ga-2"><slot name="actions" /></div>
  </div>
</template>

<script setup>
defineProps({
  icon: { type: String, default: 'mdi-folder-open-outline' },
  title: { type: String, required: true },
  text: { type: String, default: '' },
  compact: { type: Boolean, default: false },
})
</script>

<style scoped>
.empty-state { text-align: center; padding: 56px 16px; }
.empty-state--compact { padding: 24px 12px; }
.empty-icon {
  width: 64px; height: 64px; margin: 0 auto 16px; border-radius: var(--radius-card);
  display: grid; place-items: center;
  background: var(--neutral-chip-bg);
  color: var(--text-secondary);
}
.empty-state--compact .empty-icon { width: 48px; height: 48px; margin-bottom: 10px; }
.empty-title { font-weight: 650; font-size: 1.05rem; }
.empty-text { margin: 6px auto 0; max-width: 460px; color: var(--text-secondary); }
</style>
