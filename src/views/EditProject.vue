<template>
  <v-container fluid style="max-height: 100%; overflow-y: auto">
    <ProjectForm :project="prj"></ProjectForm>
  </v-container>
</template>
<script>
import ProjectForm from "@/components/ProjectForm.vue";
import { mapGetters } from "vuex";

export default {
  name: "EditProject",
  components: {
    ProjectForm,
  },
  data: () => ({}),
  methods: {},
  computed: {
    ...mapGetters(["getAllProjects"]),
    prj() {
      let pid = this.$route.params.project_id
      return this.getAllProjects.find(e => e.id == pid)
    }
  },
};
</script>