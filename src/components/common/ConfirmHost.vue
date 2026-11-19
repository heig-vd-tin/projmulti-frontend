<template>
  <v-dialog :model-value="!!confirm.current" max-width="480" @update:model-value="(v) => !v && confirm.answer(false)">
    <v-card v-if="confirm.current" class="pa-2">
      <v-card-item>
        <template #prepend>
          <v-avatar :color="confirm.current.color === 'primary' ? 'selected' : confirm.current.color" variant="tonal" rounded="lg">
            <v-icon :icon="confirm.current.icon" />
          </v-avatar>
        </template>
        <v-card-title class="text-h6 font-weight-bold text-wrap">{{ confirm.current.title }}</v-card-title>
      </v-card-item>
      <v-card-text class="text-body-1" style="white-space: pre-line">{{ confirm.current.text }}</v-card-text>
      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="confirm.answer(false)">{{ confirm.current.cancelText }}</v-btn>
        <v-btn :color="confirm.current.color" variant="flat" data-testid="confirm-ok" @click="confirm.answer(true)">
          {{ confirm.current.confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { useConfirmStore } from '@/stores/confirm'

const confirm = useConfirmStore()
</script>
