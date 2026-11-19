<template>
  <v-container fluid style="max-height: 100%; overflow-y: auto">
    <!-- Le projet est rechargé en entier : la liste ne contient pas la description. -->
    <ProjectForm v-if="prj" :project="prj"></ProjectForm>
    <v-alert v-else-if="error" type="error" class="ma-4">{{ error }}</v-alert>
    <v-progress-linear v-else indeterminate class="mt-4"></v-progress-linear>
  </v-container>
</template>
<script>
import axios from "axios";
import ProjectForm from "@/components/ProjectForm.vue";
import Project from "@/data/project";

export default {
  name: "EditProject",
  components: {
    ProjectForm,
  },
  data: () => ({
    prj: null,
    error: null,
  }),
  created() {
    axios
      .get("/project/getdesc/" + this.$route.params.project_id)
      .then((response) => {
        this.prj = new Project(response.data[0]);
      })
      .catch((error) => {
        this.error = error.userMessage || "Projet introuvable";
      });
  },
};
</script>
