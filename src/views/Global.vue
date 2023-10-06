<template>
  <v-container fluid>
    <v-row style="height: 10%">
      <v-col>
        <!--<v-select label="Filtrer par orientations" v-model="selectedOrientations" :items="selectOrientations"
          item-text="name" multiple clearable>
          <template v-slot:selection="{ item }">
            <v-chip>
              <span>{{ item.acronym }}</span>
            </v-chip>
          </template>
        </v-select>-->
      </v-col>
      <v-col>
        <v-switch v-model="filterNoAssigned" @change="switchFilterAssignChange()" label="NoAssigned"></v-switch>
      </v-col>
    </v-row>
    <v-row style="height: 90%">
      <v-col style="height: 100%">
        <v-list nav style="height: 100%; overflow-y: auto" class="dropzone">

          <v-list-item-group ref="refGroupProject" v-model="selectedProjectIndex" color="blue"
            @change="projectSelected($event)">

            <v-list-item v-for="(project, index) in projects" :key="index" :disabled="project.loading">

              <v-list-item-content>
                <div class="d-flex justify-space-between align-center">
                  <div>
                    <v-list-item-title v-text="`PROJ#${project.id}`"></v-list-item-title>
                    <v-list-item-subtitle>{{project.title}} / {{project.owner.firstname}} {{project.owner.lastname}}
                    </v-list-item-subtitle>
                  </div>
                  <v-switch v-model="project.isLocked" @change="switchProjectLockChange(project)" label="Locked"></v-switch>
                </div>

                <v-chip-group class="chip_domain">
                  <v-chip v-for="domain in project.domains" :key="domain.id" outlined label
                    :color="getProjectDomainColor(domain, project)">
                    {{ domain.name }} :
                    <!--{{ project.getAssignedUsers(domain.id).length }}-->
                  </v-chip>
                </v-chip-group>

                <v-list-item-group class="students_list align-content-start flex-wrap">
                  <draggable width="100%" :list="project.assigned_users" :group="{name: 'people', pull: 'clone', put: true}"
                    @change="assigned($event, project)" class="dropzone" :clone="cloneFromProject">
                    <v-list-item v-for="user in project.assigned_users" :key="user.id" class="students_list_items">
                      <v-list-item-content>
                        <v-chip outlined label :color="getStudentColor(user)">

                          <div class="mx-2">
                            STU#{{ user.id }} : {{ user.orientation.acronym }} : {{ project.getUserPreference(user)}}
                          </div>

                        </v-chip>
                      </v-list-item-content>
                    </v-list-item>
                  </draggable>
                </v-list-item-group>

              </v-list-item-content>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-col>

      <v-col style="height: 100%" cols="5">
        <!--v-text-field v-model="search" autofocus label="Recherche..." /-->
        <v-list nav style="height: 100%; overflow-y: auto" class="dropzone">
          <v-list-item-group v-model="selectedStudentIndex" color="blue" @change="studentSelected($event)">
            <draggable :list="students" :group="{name: 'people', pull: 'clone', put: true}" @change="unassigned" :clone="cloneFromStudent">
              <v-list-item v-for="(user, index) in students" :key="index">
                <v-list-item-content>
                  <v-list-item-title> STU#{{ user.id }}  -  {{ user.orientation.acronym }}</v-list-item-title>
                  <v-list-item-subtitle>
                    <!--<v-chip outlined label>
                      {{ user.orientation.acronym }}
                    </v-chip>-->
                    <v-chip-group>
                      <v-chip v-for="preferred in user.preferences" :key="preferred.id" outlined label
                        :color="getUserPreferenceColor(preferred.project_id, user)">
                        PROJ#{{ getProjectFromId(preferred.project_id).id }} / {{ getProjectFromId(preferred.project_id).assigned_users.length }}
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
    filterNoAssigned: false,
    projects: [],
    students: [],
  }),
  methods: {
    ...mapActions(["addAssignment", "removeAssignment", "retrieveAllProjects", "retrieveAllStudents", "lockProject"]),

    cloneFromProject(e) {
      return this.getAllStudents.filter(std => std.id == e.id)[0]
    },

    // tmz bad patch for drag and drop
    cloneFromStudent(e) {
      e.pivot = {
        project_id: 1,
        user_id: 1,
        domain_id: 1
      }
      return e
    },

    // eslint-disable-next-line
    removeStudent(event, user, project) {
      //console.log(project.id, user.id)
      this.removeAssignment({ user_id: user.id });
    },

    async assigned(event, project) {
      if (!event.added) return;
      project.loading = true;
      await this.addAssignment({
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
        this.initArrays()
    },
    switchProjectLockChange(prj){
      console.log(prj.id)
      console.log(prj.isLocked)
      this.lockProject({id: prj.id, lock: prj.isLocked})
    },
    switchFilterAssignChange() {
      this.selectedProjectIndex = null
      this.selectedStudentIndex = null
      this.initArrays()      
    },
    async initArrays() {
      await this.retrieveAllProjects()
      await this.retrieveAllStudents()
      this.projects = this.getAllProjects.filter(p => p.selected).slice();
      this.students = this.filtredStudents.slice();
      this.$forceUpdate()
    },
    async unassigned(event) {
      if (!event.added) return;
      await this.removeAssignment({ user_id: event.added.element.id });
      this.initArrays()
    },
    getProjectDomainColor(domain, project) {
      if( project.getAssignedUsers(domain.id).length > 0)
        return 'green'
      else
        return 'red'
    },
    getStudentColor(user){
      if(user.pivot.domain_id == null)
        return 'blue'
      else
        return ''
    },

    /*getProjectOrientationColor(orientation, project) {
      if (project.getAssignedUsers(orientation).length) return "green";
      else if (
        this.selectedStudentIndex != null &&
        this.selectedStudent.orientation.id == orientation.id
      )
        return "blue";
      else return orientation.pivot.importance >= 3 ? "red" : "gray";
    },*/
    getUserPreferenceColor(projectId, user) {
      let res = user.assignments.find(a => a.project_id == projectId)
      //console.log(res)
      if (res) {
        return "green"
      }

      if (!this.getProjectFromId(projectId).selected) {
        return "red"
      }

      if (this.selectedProjectIndex == null || this.selectedProject.id != projectId)
        return "";

      return "blue";
    },
    getProjectFromId(id) {
      return this.getAllProjects.find((project) => project.id == id);
    },
    projectSelected() {
      if (this.selectedProjectIndex == null) {
        this.initArrays();
        return;
      }

      this.selectedStudentIndex = undefined;
      this.students = this.filtredStudents
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
        }).slice();
    },
    studentSelected() {
      console.log("Stdu", this.selectedStudentIndex)
      if (this.selectedStudentIndex != null)
        console.log(this.selectedStudent.id)

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
    filtredStudents() {
      if (this.filterNoAssigned)
        return this.getAllStudents.filter(u => u.assignments ? u.assignments.length == 0 : null)
      else
        return this.getAllStudents
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
  width:100%;
  display: flex;
  flex-wrap: wrap;
}

.students_list {
  display: flex;
  flex: 0 0 100%;
}

.students_list_items {
  flex: 0 0 200px;
}

.chip_domain{
  flex: 0 0 100%;
}
</style>
