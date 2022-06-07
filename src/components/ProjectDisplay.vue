<template>
  <v-card>
    <v-card-title style="justify-content: center">
      {{ project.title }}
    </v-card-title>
    <v-card-text>
      {{ project.description }}
    </v-card-text>
    <v-chip-group column>
      <v-chip v-for="(tag, index) in project.tags" :key="index">
        {{ tag }}
      </v-chip>
    </v-chip-group>
  </v-card>
</template>

<script>
export default {
  name: "ProjectComponent",
  props: {
    project: {
      type: Object,
      required: true,
    },
  },
};
</script>
