<template>
  <v-container fluid style="max-height: 100%; overflow-y: auto">
    <v-row>
      <v-col>
        <v-select label="Filtrer par domains" v-model="selectedDomains" :items="selectDomains" item-text="name" multiple
          clearable>
          <template v-slot:selection="{ item }">
            <v-chip>
              <span>{{ item.acronym }}</span>
            </v-chip>
          </template>
        </v-select>
        </v-col>
        <v-col>
        <v-select label="Filtrer par tags" v-model="selectedTags" :items="getTags" item-text="name" multiple clearable>
          <template v-slot:selection="{ item }">
            <v-chip>
              <span>{{ item.name }}</span>
            </v-chip>
          </template>
        </v-select>
      </v-col>
      <v-col>
        <v-switch v-model="filterMyProject" label="My project"></v-switch>
      </v-col>
      <v-col> 
      <!-- tmz : format code -->
            <div>
            Add project
            <v-btn
      class="mx-2"
      small
      v-show=true
      fab
      dark
      color="cyan"
      to="/new-project"
    >
      <v-icon dark>
        mdi-plus
      </v-icon>
    </v-btn>
    </div>
      </v-col>
    </v-row>
    <v-row>
      <v-col v-for="(project, index) in filteredProjects" :key="index" cols="auto" md="4" >
        <project-view-component @click="dialog = true; selectedProject = project" :project="project" :light=true />
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
import { mapGetters } from "vuex";
import { getDomainColor } from "@/data/helpers.js";
import ProjectViewComponent from "../ProjectViewComponent.vue";

export default {
  name: "AllProjects",
  components: {
    "project-view-component": ProjectViewComponent
  },
  data: () => ({
    selectedDomains: [],
    selectedOrientations: [],
    selectedTags: [],
    selectedProject: null,
    dialog: false,
    filterMyProject: false
  }),
  methods: {
    getColor: function (domain) {
      return getDomainColor(domain);
    },
  },
  mounted() {
  },
  computed: {
    ...mapGetters(["getAllProjects", "getOrientations", "getDomains", "getTags", "getUser"]), // tmz : getOrientation can be deleted ?
    selectDomains() {
      return this.getDomains.flatMap((item, index, array) => {
        if (index == 0 || array[index - 1].name !== item.name)
          return [{ header: item.name }, item];
        else return item;
      });
    },
    is_student() {
      return this.getUser.isStudent
    },
    filteredProjects() {
      return this.getAllProjects
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
        })
        .filter((project) => {
            return !this.filterMyProject || project.owner_id == this.getUser.id
        });
    }
  },
};
</script>
