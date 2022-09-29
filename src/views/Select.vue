<template>
  <v-container fluid style="max-height: 100%; overflow-y: auto">

    <v-row>
      <v-col v-for="(user, key_u) in getTeachers()" :key="key_u">
        <v-card>{{user.id}} : {{user.firstname}} prj : {{getNbrOfProject(user.id)}} </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="auto" md="4" v-for="(project, index) in getProjects()" :key="index">
        <project-view-component @click="dialog = true; selectedProject = project" :project="project" :light=true />
      </v-col>
    </v-row>

    <v-dialog v-model="dialog" v-if="selectedProject !== null" max-width="60%">
      <v-card>
        <project-view-component @close="dialog=false" :project="selectedProject" :light=false />
      </v-card>
    </v-dialog>
  </v-container>
</template>
<script>
import { mapGetters, mapActions } from "vuex";
import ProjectViewComponent from "./ProjectViewComponent.vue";

export default {
  name: "AllProjects",
  components: {
    "project-view-component": ProjectViewComponent
  },
  data: () => ({
    loading: false,
    selectedProject: null,
    dialog: false,
  }),
  methods: {
    ...mapActions(["removeProjectPreference"]),
    getProjects() {
      return this.getAllProjects//.sort(this.sortProj)
    },
    getNbrOfProject(owner_id){
      return this.getAllProjects.filter(p => p.selected && (p.owner_id == owner_id) ).length
    },
    getTeachers() {
      let r = this.getAllUsers.filter(u => u.role == 'professor' || u.role == 'admin')
      return r
    },
    sortProj(a, b) {
      if (a.getPreferredUsers().length < b.getPreferredUsers().length)
        return 1
      else
        return -1
    }
  },
  mounted() {
  },
  computed: {
    ...mapGetters(["getAllProjects",
      "getAllUsers",
      "getMyProjects",
      "getDomains",
      "getTags",
      "getUser"
    ]),
  }
};
</script>

<style>

</style>