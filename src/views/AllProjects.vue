<template>
  <div>
    <div v-for="(project, index) in getProjects" :key="index">
      <ProjectDisplay :project="project"></ProjectDisplay>
    </div>
  </div>
</template>
<script>
import { mapGetters } from "vuex";
import ProjectDisplay from "@/components/ProjectDisplay.vue";

export default {
  name: "AllProjects",
  components: {
    ProjectDisplay,
  },
  data: () => ({}),
  methods: {},
  computed: {
    ...mapGetters(["getProjects"]),
  },
};
</script>
