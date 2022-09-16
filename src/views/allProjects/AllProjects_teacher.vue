<template>
  <v-container fluid style="max-height: 100%; overflow-y: auto">
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
      <v-col
        v-for="(project, index) in filteredProjects"
        :key="index"
        cols="auto"
        md="4"
      >
        <v-card style="margin-bottom: 50px" elevation="2">
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
                :color="`importance${orientation.pivot.importance}`"
              >
                {{ orientation.acronym }}
              </v-chip>
            </v-chip-group>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import { mapGetters } from "vuex";

export default {
  name: "AllProjects",
  components: {},
  data: () => ({
    selectedOrientations: [],
    selectedTags: [],
  }),
  methods: {},
  computed: {
    ...mapGetters(["getAllProjects", "getOrientations", "getTags"]),
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
