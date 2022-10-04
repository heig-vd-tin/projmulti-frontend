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
        <!-- tmz : add project -->
        <div v-show="isTeacher">
          Add project
          <v-btn class="mx-2" small v-show=true fab dark color="cyan" to="/new-project">
            <v-icon dark>
              mdi-plus
            </v-icon>
          </v-btn>
        </div>
      </v-col>

    </v-row>
    <div id="col_project">
        <project-view-component class="card_project" v-for="(project, index) in filteredProjects" :key="index" @removepref="onRemovePref(project.id)" @click="dialog = true; selectedProject = project" :project="project" :light=true />
    </div>

    <v-dialog v-model="dialog" v-if="selectedProject !== null" max-width="60%">
      <v-card>
        <project-view-component @close="dialog=false" :project="selectedProject" :light=false />
      </v-card>
    </v-dialog>
  </v-container>
</template>
<script>
import { mapGetters, mapActions } from "vuex";
import { getDomainColor } from "@/data/helpers.js";
import ProjectViewComponent from "../ProjectViewComponent.vue";

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
    ...mapActions(["removeProjectPreference"]),
    getColor: function (domain) {
      return getDomainColor(domain);
    },
    onRemovePref(prj_id) {
      //this.project.loading = true;
      this.removeProjectPreference({ projects: [prj_id] })
        .catch(() => {
          this.$notify({
            title: "Erreur",
            text: "La préférence n'a pas pu être effacée",
            type: "error",
          })
        })
        .finally(() => {
          //this.project.loading = false
        })
    }
  },
  mounted() {
  },
  computed: {
    ...mapGetters(["getAllProjects",
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
    isStudent() {
      return this.getUser.isStudent
    },
    isTeacher() {
      return this.getUser.isTeacher
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
            return !this.filterMyProject || this.getMyProjects.some((item) => item.id == project.id);
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