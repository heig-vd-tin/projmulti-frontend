<template>
  <v-container fluid style="max-height: 100%; overflow-y: auto">
    <v-row>
      <v-col>
        <v-select label="Filtrer par domains" v-model="selectedDomains" :items="selectDomains" item-text="name" multiple
          clearable>
          <template v-slot:selection="{ item }">
            <v-chip outlined :color="getColor(item)">
              <v-icon center>
                {{ item.icon }}
              </v-icon>
            </v-chip>
          </template>
        </v-select>
      </v-col>
      <!-- <v-col>
        <v-select label="Filtrer par tags" v-model="selectedTags" :items="getTags" item-text="name" multiple clearable>
          <template v-slot:selection="{ item }">
            <v-chip>
              <span>{{ item.name }}</span>
            </v-chip>
          </template>
        </v-select>
      </v-col> -->
      <v-col v-if="isTeacher" cols="12" sm="2">
        <v-select label="Cours" :value="getSelectedYear" :items="yearItems" @change="onYearChange" :loading="loading"></v-select>
      </v-col>
      <v-col>
        <v-switch v-model="filterMyProject" :label="isStudent ? 'Mes choix' : 'Mes projets'"></v-switch>
      </v-col>

      <v-col>
        <div v-show="isTeacher && canEditProjects && isCurrentYearSelected">
          Ajouter un projet
          <v-btn class="mx-2" small fab dark color="cyan" to="/new-project">
            <v-icon dark>
              mdi-plus
            </v-icon>
          </v-btn>
        </div>
      </v-col>

    </v-row>
    <v-alert v-if="isTeacher && !isCurrentYearSelected" type="info" text dense>
      Projets du cours {{ getSelectedYear }} (lecture seule). Pour reprendre un de vos projets cette année,
      ouvrez-le et cliquez sur « Reprendre pour {{ getSettings.current_year }} ».
    </v-alert>
    <div v-if="!loading && filteredProjects.length === 0" class="text-center grey--text my-10">
      Aucun projet pour le moment.
    </div>
    <div id="col_project">
      <project-view-component :canEdit="true" class="card_project" v-for="(project, index) in filteredProjects"
        :key="index" @removepref="onRemovePref(project.id)" @click="onSelectedProjects(project)"
        :project="project" :light=true />
    </div>

    <v-dialog v-model="dialog" v-if="selectedProject !== null" max-width="70%">
      <v-card>
        <project-view-component @close="dialog=false" :project="selectedProject" :light=false :canEdit=true />
      </v-card>
    </v-dialog>
  </v-container>
</template>
<script>
import { mapGetters, mapActions } from "vuex";
import { getDomainColor } from "@/data/helpers.js";
import ProjectViewComponent from "../ProjectViewComponent.vue";
import axios from "axios";

export default {
  name: "AllProjects",
  components: {
    "project-view-component": ProjectViewComponent
  },
  data: () => ({
    loading: false,
    selectedDomains: [],
    selectedOrientations: [],
    selectedTags: [],
    selectedProject: null,
    dialog: false,
    maxProjects: 5,
    filterMyProject: false
  }),
  methods: {
    ...mapActions(["removeProjectPreference", "changeSelectedYear"]),
    onYearChange(year) {
      this.loading = true
      this.changeSelectedYear(year)
        .catch((error) => this.$notify({ title: "Erreur", text: error.userMessage, type: "error" }))
        .finally(() => { this.loading = false })
    },
    getColor: function (domain) {
      return getDomainColor(domain);
    },
    onRemovePref(prj_id) {
      //this.project.loading = true;
      this.removeProjectPreference({ projects: [prj_id] })
        .catch((error) => {
          this.$notify({
            title: "La préférence n'a pas pu être effacée",
            text: error.userMessage,
            type: "error",
          })
        })
        .finally(() => {
          //this.project.loading = false
        })
    },
    onSelectedProjects(projects) {
      axios
        .get("project/getdesc/" + projects.id)
        .then((response) => {

          this.selectedProject = projects;
          this.selectedProject.description = response.data[0].description;
          this.dialog = true;
          console.log("end lad")
        })
        .catch((error) => {
          console.log(error);
        });      
    },
  },
  mounted() {
  },
  computed: {
    ...mapGetters(["getAllProjects",
      "getMyProjects",
      "getDomains",
      "getTags",
      "getUser",
      "getSettings",
      "getSelectedYear",
      "isCurrentYearSelected",
      "canEditProjects",
    ]),
    yearItems() {
      return this.getSettings.years.map((y) => ({ text: `${y}`, value: y }))
    },
    selectDomains() {
      return this.getDomains.flatMap((item, index, array) => {
        if (index == 0 || array[index - 1].name !== item.name)
          return [{ header: item.name }, item];
        else return item;
      });
    },
    isStudent() {
      return this.getUser.isStudent
    },
    isTeacher() {
      return this.getUser.isTeacher || this.getUser.isAdmin
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
          if (this.isTeacher) {
            return !this.filterMyProject || project.owner_id == this.getUser.id
          }

          if (this.isStudent) {
            //console.log(this.getMyProjects)
            return (!this.filterMyProject || this.getMyProjects.some((item) => item.id == project.id));
          }
        });
    }
  },
};
</script>

<style scoped>
#col_project {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: stretch;
}

.card_project {
  flex: 0 0.5 30%;
  margin: 10px;
  background-color: lightblue;
}

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
