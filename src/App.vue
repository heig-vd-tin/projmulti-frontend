<template>
  <v-app>
    <v-row>
      <v-col>
        <h1>Liste 1</h1>
        <draggable v-model="projects" group="projects">
          <div v-for="(project, index) in projects" :key="index">
            <projectDisplay :project="project"></projectDisplay>
          </div>
        </draggable>
      </v-col>
      <v-col>
        <h1>Liste 2</h1>
        <draggable v-model="selectedProjects" group="projects">
          <div v-for="(project, index) in selectedProjects" :key="index">
            <projectDisplay :project="project"></projectDisplay>
          </div>
        </draggable>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <projectForm></projectForm>
      </v-col>
    </v-row>
  </v-app>
</template>

<script>
import draggable from "vuedraggable";
import projectDisplay from "./components/ProjectDisplay.vue";
import projectForm from "./components/ProjectForm.vue";

export default {
  components: {
    draggable,
    projectDisplay,
    projectForm,
  },
  data: () => ({
    selectedProjects: [
      {
        id: 3,
        title: "Imposter",
        description: "Lorem ispum is sus",
        owner_id: 3,
        priority: 3,
        orientations: ["eai", "eem"],
        tags: ["web", "hmi"],
      },
    ],
    projects: [
      {
        id: 0,
        title: "Amongus",
        description: "Lorem ispum is sus",
        owner_id: 0,
        priority: 2,
        orientations: ["en", "eem"],
        tags: ["programming", "hmi", "electronics"],
      },
      {
        id: 1,
        title: "Sugoma",
        description: "Lorem ispum is sus",
        owner_id: 6,
        priority: 2,
        orientations: ["mi"],
        tags: ["web"],
      },
      {
        id: 2,
        title: "Sus",
        description: "Lorem ispum is sus",
        owner_id: 4,
        priority: 6,
        orientations: ["si", "mi"],
        tags: [],
      },
    ],
  }),
};
</script>


<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
