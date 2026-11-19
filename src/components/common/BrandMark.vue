<template>
  <div class="brand-mark" :style="{ width: size + 'px', height: size + 'px', fontSize: size * 0.36 + 'px' }" aria-hidden="true">
    <v-icon icon="mdi-puzzle-outline" :size="size * 0.58" />
  </div>
</template>

<script setup>
defineProps({ size: { type: Number, default: 36 } })
</script>

<style scoped>
.brand-mark {
  flex: none;
  display: grid;
  place-items: center;
  border-radius: var(--radius-control);
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}
</style>
