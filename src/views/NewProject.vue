<template>
  <v-container fluid style="max-height: 100%; overflow-y: auto">
    <ProjectForm></ProjectForm>
  </v-container>
</template>
<script>
import ProjectForm from "@/components/ProjectForm.vue";

export default {
  name: "NewProject",
  components: {
    ProjectForm,
  },
  data: () => ({}),
  methods: {},
  computed: {},
};
</script>