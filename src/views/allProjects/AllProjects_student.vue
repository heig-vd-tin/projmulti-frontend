<template>
  <div>
    <v-row>
      <v-col>
        <v-select
          label="Filtrer par orientations"
          v-model="selectedOrientations"
          :items="selectOrientations"
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
          <v-col
            v-for="(project, index) in filteredProjects"
            :key="index"
            cols="auto"
            md="4"
          >
            <v-card
              style="margin-bottom: 50px"
              elevation="2"
              :disabled="loading"
            >
              <v-card-title style="justify-content: center">
                {{ project.title }} #{{ project.id }}
              </v-card-title>
              <v-card-text v-html="project.description"></v-card-text>
              <v-card-text>
                Tags :
                <v-chip-group column>
                  <v-chip v-for="tag in project.tags" :key="tag.id">
                    {{ tag.name }}
                  </v-chip>
                </v-chip-group>
              </v-card-text>
              <v-card-text>
                Orientations :
                <v-chip-group column>
                  <v-chip
                    v-for="orientation in project.orientations"
                    :key="orientation.id"
                  >
                    {{ orientation.acronym }}
                  </v-chip>
                </v-chip-group>
              </v-card-text>
            </v-card>
          </v-col>
        </draggable>
      </v-col>
    </v-row>
  </div>
</template>
<script>
import { mapGetters, mapActions } from "vuex";
import draggable from "vuedraggable";
import { UserRole } from "@/data/constants.js";

export default {
  name: "AllProjects",
  components: {
    draggable,
  },
  data: () => ({
    loading: false,
    selectedOrientations: [],
    selectedTags: [],
    maxProjects: 5,
    UserRole: UserRole,
  }),
  methods: {
    ...mapActions(["submitProjectPreference"]),
    changed(event) {
      if (!event.added) return;
      let project = event.added.element;
      let projects = this.getMyProjects.slice(0);
      if (projects.push(project) > this.maxProjects) return;
      this.loading = true;
      this.submitProjectPreference({
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
      "getOrientations",
      "getTags",
      "getUser",
    ]),
    selectOrientations() {
      return this.getOrientations.flatMap((item, index, array) => {
        if (index == 0 || array[index - 1].faculty_name !== item.faculty_name)
          return [{ header: item.faculty_name }, item];
        else return item;
      });
    },
    filteredProjects() {
      return this.getAllProjects
        .filter((project) => {
          return !this.getMyProjects.some((item) => item.id == project.id);
        })
        .filter((project) => {
          if (!this.selectedOrientations.length) return true;
          return project.orientations.some((orientation) =>
            this.selectedOrientations.includes(orientation.name)
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
  height: 70px;
  line-height: 70px;
  text-align: center;
}
</style>
