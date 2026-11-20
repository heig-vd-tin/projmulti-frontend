<template>
  <!-- Pastille de rang d'un choix (1 = meilleur, le plus foncé). Libre : contour pointillé. -->
  <span
    class="rank-badge"
    :class="[`rank-badge--${size}`, rank && !empty ? `rank-badge--r${rank}` : 'rank-badge--empty', { 'rank-badge--pill': pill }]"
    aria-hidden="true"
  >
    <template v-if="pill"><v-icon icon="mdi-check" :size="14" />n°{{ rank }}</template>
    <template v-else>{{ rank }}</template>
  </span>
</template>

<script setup>
defineProps({
  rank: { type: Number, required: true },
  // sm : 24 px (cartes), md : 36 px (sélecteur), lg : 44 px (« Mes choix »)
  size: { type: String, default: 'md' },
  // Place libre (pas encore de projet à ce rang)
  empty: { type: Boolean, default: false },
  // Forme « ✓ n°2 » (cartes du catalogue, titre de la page projet)
  pill: { type: Boolean, default: false },
})
</script>

<style scoped>
.rank-badge {
  flex: none; display: inline-grid; place-items: center;
  font-weight: 700; line-height: 1; font-variant-numeric: tabular-nums;
  border-radius: var(--radius-control);
  background: var(--rank-bg); color: var(--rank-fg);
}
.rank-badge--r1 { --rank-bg: var(--rank-1); }
.rank-badge--r2 { --rank-bg: var(--rank-2); }
.rank-badge--r3 { --rank-bg: var(--rank-3); }
.rank-badge--r4 { --rank-bg: var(--rank-4); }
.rank-badge--r5 { --rank-bg: var(--rank-5); }
.rank-badge--empty { background: transparent; color: var(--text-secondary); border: 1.5px dashed rgba(var(--v-border-color), 0.35); }
.rank-badge--sm { width: 24px; height: 24px; font-size: 0.8rem; border-radius: 7px; }
.rank-badge--md { width: 36px; height: 36px; font-size: 1.1rem; }
.rank-badge--lg { width: 44px; height: 44px; font-size: 1.2rem; }
.rank-badge--pill { display: inline-flex; gap: 3px; width: auto; height: 24px; padding: 0 10px 0 7px; border-radius: 999px; font-size: 0.8rem; }
@media (max-width: 600px) {
  .rank-badge--lg { width: 36px; height: 36px; font-size: 1.05rem; }
}
</style>
