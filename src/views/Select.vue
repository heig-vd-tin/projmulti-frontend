<template>
  <v-container fluid style="max-height: 100%; overflow-y: auto">

    <div id="main_page">
      <div id="col_user">
        <div v-for="(user, key_u) in getTeachers()" :key="key_u">
          <v-card class="mx-4 my-6">{{user.id}} : {{user.firstname}} {{user.lastname}} <br/> Nbr proj : {{getNbrOfProject(user.id)}} </v-card>
        </div>
      </div>

      <div id="col_project">
          <project-view-component class="card_project" 
              v-for="(project, index) in getProjects()" :key="index" @click="dialog = true; selectedProject = project" :project="project" :light=true />          
      </div>      
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
      if (a.getPreferredUsers(5,null).length < b.getPreferredUsers(5,null).length)
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
#main_page {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-around;
  align-items: flex-start;
  align-content: flex-start;
}

#col_project {
  flex: 1 1 50%;
  width: 70%;

  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: stretch;
}

#col_user {
  flex: 0 0 250px;
}

.card_project {
  flex: 0 0.5 30%;
  min-height: 200px;
  margin: 10px;
  background-color: lightblue;
}
</style>