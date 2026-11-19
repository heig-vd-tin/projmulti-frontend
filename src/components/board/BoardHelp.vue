<template>
  <v-dialog :model-value="modelValue" max-width="760" @update:model-value="$emit('update:modelValue', $event)">
    <v-card class="pa-2">
      <v-card-item>
        <v-card-title class="text-h6 font-weight-bold">Tableau de répartition : aide</v-card-title>
      </v-card-item>
      <v-card-text class="help">
        <h3>Déplacer les étudiants</h3>
        <ul>
          <li>Glissez une puce d'étudiant vers un projet pour l'y affecter, ou vers la liste de droite pour le retirer de son projet.</li>
          <li>Un projet <v-icon icon="mdi-lock" size="15" /> verrouillé garde ses étudiants lors du calcul automatique ; le glisser-déposer reste possible.</li>
          <li>Cliquez sur un étudiant pour ouvrir sa fiche : ses 5 choix dans l'ordre, son affectation, l'affectation en un clic, le verrouillage et l'exclusion.</li>
          <li><v-icon icon="mdi-account-search-outline" size="15" /> sur un projet : liste des étudiants qui l'ont choisi, triés par rang.</li>
        </ul>
        <h3>Légende</h3>
        <div class="legend">
          <span class="rank-badge rank--r1">1</span><span>rang du projet dans les choix de l'étudiant : 1er choix</span>
          <span class="rank-badge rank--r2">2</span><span>2e choix</span>
          <span class="rank-badge rank--r3">3</span><span>3e choix</span>
          <span class="rank-badge rank--r45">4</span><span>4e ou 5e choix</span>
          <span class="rank-badge rank--out">✕</span><span>affecté hors de ses choix</span>
          <span class="ori-badge">MI</span><span>orientation de l'étudiant</span>
          <span class="size ok">5</span><span>nombre d'étudiants dans la taille visée (paramètres du calcul)</span>
          <span class="size low">3</span><span>groupe trop petit</span>
          <span class="size high">6</span><span>groupe trop grand</span>
          <span class="mark ok"><v-icon icon="mdi-check-bold" size="9" /></span><span>domaine couvert par l'orientation d'un étudiant</span>
          <span class="mark partial"><v-icon icon="mdi-approximately-equal" size="9" /></span><span>domaine couvert seulement en élargissant</span>
          <span class="mark missing"><v-icon icon="mdi-exclamation-thick" size="9" /></span><span>domaine non couvert (icône dans un cadre en pointillés)</span>
          <span class="choice closed">2 #12</span><span>dans la liste : choix d'un projet non sélectionné</span>
          <span class="choice assigned">1 #62</span><span>projet auquel l'étudiant est affecté</span>
        </div>
        <h3>Calcul automatique</h3>
        <p>
          « Calculer la répartition » maximise la satisfaction de tous les étudiants en respectant la taille des groupes et le nombre
          maximal d'étudiants d'une même orientation. Sauvegardez la répartition actuelle avant de calculer : le fichier .prjmult peut être rechargé.
          Les anciennes actions restent dans le menu « Ancien algorithme ».
        </p>
      </v-card-text>
      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn variant="flat" color="primary" @click="$emit('update:modelValue', false)">Compris</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import '@/components/board/boardStyles.css'

defineProps({ modelValue: { type: Boolean, default: false } })
defineEmits(['update:modelValue'])
</script>

<style scoped>
.help h3 { font-size: 0.95rem; font-weight: 700; margin: 16px 0 8px; }
.help h3:first-child { margin-top: 0; }
.help ul { padding-left: 1.2em; line-height: 1.6; }
.legend { display: grid; grid-template-columns: 48px 1fr; gap: 8px 10px; align-items: center; font-size: 0.9rem; }
.legend > :nth-child(odd) { justify-self: center; }
.size { min-width: 28px; height: 24px; border-radius: 999px; display: grid; place-items: center; font-weight: 700; font-size: 0.82rem; }
.size.ok { background: var(--success-bg); color: rgb(var(--v-theme-success)); }
.size.low { background: var(--warn-bg); color: rgb(var(--v-theme-warning)); }
.size.high { background: var(--error-bg); color: rgb(var(--v-theme-error)); }
.mark { width: 16px; height: 16px; border-radius: 50%; display: grid; place-items: center; color: #fff; }
.mark.ok { background: rgb(var(--v-theme-success)); }
.mark.partial { background: rgb(var(--v-theme-warning)); }
.mark.missing { background: rgb(var(--v-theme-error)); }
.choice { font-size: 0.72rem; padding: 2px 8px; border-radius: 999px; background: var(--neutral-chip-bg); }
.choice.closed { background: transparent; border: 1px dashed rgba(var(--v-theme-error), 0.5); text-decoration: line-through; }
.choice.assigned { border: 1.5px solid var(--sel); font-weight: 700; }
</style>
