<template>
  <v-container fluid>
    <v-row style="height: 10%">
      <v-col>
        <v-select label="Filtrer par orientations" v-model="selectedOrientations" :items="selectOrientations"
          item-text="name" multiple clearable>
          <template v-slot:selection="{ item }">
            <v-chip>
              <span>{{ item.acronym }}</span>
            </v-chip>
          </template>
        </v-select>
      </v-col>
    </v-row>
    <v-row style="height: 90%">
      <v-col style="height: 100%">
        <v-list nav style="height: 100%; overflow-y: auto" class="dropzone">
          <v-list-item-group v-model="selectedProjectIndex" color="blue" @change="projectSelected">
            <v-list-item v-for="(project, index) in projects" :key="index" :disabled="project.loading">
              <v-list-item-content>
                <v-list-item-title v-text="`PROJ#${project.id}`"></v-list-item-title>
                <v-list-item-subtitle>{{project.title}} / {{project.reference}} / {{project.owner_id}}</v-list-item-subtitle>

                <v-chip-group>
                  <v-chip v-for="domain in project.domains" :key="domain.id" outlined label
                    :color="getProjectDomainColor(domain, project)">
                    {{ domain.name }} :
                    <!--{{ project.getAssignedUsers(domain.id).length }}-->
                  </v-chip>
                </v-chip-group>

                <draggable :list="project.assigned_users" group="people" @change="(event) => assigned(event, project)"
                  class="dropzone">
                  <v-list-item v-for="user in project.assigned_users" :key="user.id">
                    <v-list-item-content>
                      <v-chip outlined label>
                        STU#{{ user.id }} : {{ user.orientation.acronym }} : {{ project.getUserPreference(user)}}
                      </v-chip>
                    </v-list-item-content>
                  </v-list-item>
                </draggable>
              </v-list-item-content>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-col>

      <v-col style="height: 100%">
        <!--v-text-field v-model="search" autofocus label="Recherche..." /-->
        <v-list nav style="height: 100%; overflow-y: auto" class="dropzone">
          <v-list-item-group v-model="selectedStudentIndex" color="blue" @change="studentSelected">
            <draggable :list="[]" group="people" @change="unassigned">
              <v-list-item v-for="(user, index) in students" :key="index">
                <v-list-item-content>
                  <v-list-item-title> STU#{{ user.id }} </v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip outlined label>
                      {{ user.orientation.acronym }}
                    </v-chip>
                    <v-chip-group>
                      <v-chip v-for="preferred in user.preferences" :key="preferred.id" outlined label
                        :color="getUserPreferenceColor(preferred.project_id, user)">
                        PROJ#{{ getProjectFromId(preferred.project_id).id }}
                      </v-chip>
                    </v-chip-group>
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </draggable>
          </v-list-item-group>
        </v-list>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import { mapActions, mapGetters } from "vuex";
import draggable from "vuedraggable";

export default {
  name: "GlobalView",
  components: {
    draggable,
  },
  data: () => ({
    search: "",
    selectedOrientations: [],
    selectedProjectIndex: null,
    selectedStudentIndex: null,
    projects: [],
    students: [],
  }),
  methods: {
    ...mapActions(["addAssignment", "removeAssignment"]),
    assigned(event, project) {
      if (!event.added) return;
      project.loading = true;
      this.addAssignment({
        project_id: project.id,
        user_id: event.added.element.id,
      })
        .catch(() => {
          this.$notify({
            title: "Erreur",
            text: "La sélection n'a pas pu être enregistrée",
            type: "error",
          });
        })
        .finally(() => (project.loading = false));
    },
    unassigned(event) {
      if (!event.added) return;
      this.removeAssignment({ user_id: event.added.element.id });
    },
    getProjectDomainColor(domain, project) {
      if (domain || project)
        return 'green'
    },
    getProjectOrientationColor(orientation, project) {
      if (project.getAssignedUsers(orientation).length) return "green";
      else if (
        this.selectedStudentIndex != null &&
        this.selectedStudent.orientation.id == orientation.id
      )
        return "blue";
      else return orientation.pivot.importance >= 3 ? "red" : "gray";
    },
    getUserPreferenceColor(projectId, user) {
      let res = user.assignments.find( a => a.project_id == projectId )
      if( res ){
        console.log("vert find")
        return "green"
      } 
      
      if ( this.selectedProjectIndex == null || this.selectedProject.id != projectId )
        return "";

      return "blue";
    },
    getProjectFromId(id) {
      return this.getAllProjects.find((project) => project.id == id);
    },
    initArrays() {
      this.projects = this.getAllProjects.filter(p => p.selected).slice();
      this.students = this.getAllStudents.slice();
    },
    projectSelected() {
      if (this.selectedProjectIndex == null) {
        this.initArrays();
        return;
      }
      this.selectedStudentIndex = undefined;
      this.students = this.getAllStudents
        .filter((user) => {
          return this.selectedProject.preferred_users.some(
            (usr) => usr.id == user.id
          );
        })
        .sort((a, b) => {
          let priority_a = a.preferences.find(
            (pref) => pref.project_id == this.selectedProject.id
          ).priority;
          let priority_b = b.preferences.find(
            (pref) => pref.project_id == this.selectedProject.id
          ).priority;
          return priority_a - priority_b;
        });
    },
    studentSelected() {
      if (this.selectedStudentIndex == null) {
        this.initArrays();
        return;
      }
      this.selectedProjectIndex = undefined;
      this.projects = this.getAllProjects
        .filter((project) => {
          return this.selectedStudent.preferences.some(
            (pref) => pref.project_id == project.id && project.selected
          );
        })
        .reverse();
    },
  },
  computed: {
    ...mapGetters(["getAllProjects", "getAllStudents", "getOrientations", "getDomains"]),
    selectOrientations() {
      return this.getOrientations.flatMap((item, index, array) => {
        if (index == 0 || array[index - 1].faculty_name != item.faculty_name)
          return [{ header: item.faculty_name }, item];
        else return item;
      });
    },
    selectedProject() {
      return this.projects[this.selectedProjectIndex];
    },
    selectedStudent() {
      return this.students[this.selectedStudentIndex];
    },
  },
  mounted() {
    this.initArrays();
  },
};
</script>
<style scoped>
/*.v-list-item {
  border-style: solid;
  border-width: 1px;
  border-radius: 10px;
  border-color: lightslategray;
  text-align: center;
  margin: 5px;
}*/
.dropzone {
  border-style: solid;
  border-width: 1px;
  /*border-radius: 10px;*/
  border-color: lightslategray;
  min-height: 60px;
}
</style>
