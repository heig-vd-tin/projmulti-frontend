<template>
  <v-container fluid style="max-height: 100%; overflow-y: auto">
    <v-row>
      <v-col>
        <v-select
          label="Filtrer par domains"
          v-model="selectedDomains"
          :items="selectDomains"
          item-text="name"
          multiple
          clearable
        >
          <template v-slot:selection="{ item }">
            <v-chip>
              <span>{{ item.acronym }}</span>
            </v-chip>
          </template>
        </v-select>
        <v-select
          label="Filtrer par tags"
          v-model="selectedTags"
          :items="getTags"
          item-text="name"
          multiple
          clearable
        >
          <template v-slot:selection="{ item }">
            <v-chip>
              <span>{{ item.name }}</span>
            </v-chip>
          </template>
        </v-select>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <draggable
          :list="[]"
          @change="changed"
          id="dropzone"
          group="projects"
          ghost-class="hidden-ghost"
          class="dropzone"
        >
          <v-icon> mdi-arrow-down-box </v-icon>
          Glissez vos préférences ici
        </draggable>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <draggable
          :list="filteredProjects"
          :disabled="getMyProjects.length >= maxProjects"
          class="row"
          group="projects"
        >
    <v-row>
      <v-col v-for="(project, index) in filteredProjects" :key="index" cols="auto" md="4" >
        <project-view-component @click="dialog = true; selectedProject = project" :project="project" :light=true />
      </v-col>
    </v-row>
        </draggable>

      </v-col>
    </v-row>

      <v-dialog v-model="dialog" v-if="selectedProject !== null" max-width="60%">
      <v-card>
        <project-view-component :project="selectedProject" :light=false />
      </v-card>
    </v-dialog>

  </v-container>
</template>
<script>
import { mapGetters, mapActions } from "vuex";
import draggable from "vuedraggable";
import ProjectViewComponent from "../ProjectViewComponent.vue";

export default {
  name: "AllProjects",
  components: {
    draggable,
    "project-view-component": ProjectViewComponent
  },
  data: () => ({
    loading: false,
    selectedDomains: [],
    selectedTags: [],
    selectedProject: null,
    maxProjects: 5,
    dialog: false
  }),
  methods: {
    ...mapActions(["addProjectPreference"]),
    changed(event) {
      if (!event.added) return;
      let project = event.added.element;
      let projects = this.getMyProjects.slice(0);
      if (projects.push(project) > this.maxProjects) return;
      this.loading = true;
      this.addProjectPreference({
        projects: projects.map((item, index) => {
          return { id: item.id, priority: index + 1 };
        }),
      })
        .catch(() => {
          this.$notify({
            title: "Erreur",
            text: "La préférence n'a pas pu être ajoutée",
            type: "error",
          });
        })
        .finally(() => {
          this.loading = false;
        });
    },
  },
  computed: {
    ...mapGetters([
      "getAllProjects",
      "getMyProjects",
      "getDomains",
      "getTags",
      "getUser",
    ]),
    selectDomains() {
      return this.getDomains.flatMap((item, index, array) => {
        if (index == 0 || array[index - 1].name !== item.name)
          return [{ header: item.name }, item];
        else return item;
      });
    },
    filteredProjects() {
      return this.getAllProjects
        .filter((project) => {
          return !this.getMyProjects.some((item) => item.id == project.id);
        })
        .filter((project) => {
          if (!this.selectedDomains.length) return true;
          return project.domains.some((domain) =>
            this.selectedDomains.includes(domain.name)
          );
        })
        .filter((project) => {
          if (!this.selectedTags.length) return true;
          return project.tags.some((tag) =>
            this.selectedTags.includes(tag.name)
          );
        });
    },
  },
};
</script>
<style scoped>
.hidden-ghost {
  display: none;
}
.dropzone {
  border-style: solid;
  border-width: 1px;
  border-radius: 10px;
  border-color: lightslategray;
  height: 70px;
  line-height: 70px;
  text-align: center;
}
</style>
