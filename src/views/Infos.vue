<template>
  <v-container fluid style="max-height: 100%; overflow-y: auto">
    Number of projects: {{ getProjects().length }} <br/>
    Number of teachers: {{ getTeachers().length }} <br/>
    Number of students: {{ getStudents().length }} <br/>
    <br/>
    Number assigned students : {{getAssignedStudents()}}<br/>
    Number of assigned priority : {{getNumberAssignedPriority()}}<br/>

    <br/>
    <div v-for="(domain, key_do) in getDomains" :key=key_do>
      Number of students need for {{key_d}} {{domain.name}} : {{getNumberStudentsNeed(domain)}}<br/>
    </div>

    <br/>
    <div v-for="(orientation, key_o) in getOrientations" :key=key_o >
      Number of students in : {{key_o}} {{orientation.acronym}} : {{getNumberStudentsOrientation(orientation)}}<br/>
    </div>
  </v-container>
</template>
<script>
import { mapGetters } from "vuex";

export default {
  name: "AllProjects",
  components: {
    
  },
  data: () => ({
    loading: false,
  }),
  methods: {
    getProjects() {
      return this.getAllProjects//.sort(this.sortProj)
    },
    getTeachers() {
      let r = this.getAllUsers.filter(u => u.role == 'professor' || u.role == 'admin')
      return r
    },
    getStudents() {
      let r = this.getAllUsers.filter(u => u.role == 'student')
      return r
    },
    getAssignedStudents() {
      return this.getAllStudents.filter(s => s.assignments.length > 0).length
    },
    getNumberAssignedPriority() {
      let obj = {'1': 0, '2': 0, '3': 0, '4': 0, '5': 0}
      this.getAllProjects.forEach( (project) => { 
        project.assigned_users.forEach( (user) => {
          let r = project.preferred_users.filter(p => p.id == user.id)
          obj[r[0].pivot.priority] += 1
        })
      })
      return obj
    },
    getNumberStudentsNeed(domain) {
      let cpt = 0
      this.getAllProjects.forEach( (project) => { 
        project.domains.find((d) => d.id == domain.id) && cpt++
      })
      return cpt
    },
    getNumberStudentsOrientation(orientation) {

      return this.getAllStudents.filter(s => s.orientation.id == orientation.id).length
    }
  },
  mounted() {
  },
  computed: {
    ...mapGetters(["getAllProjects",
      "getAllUsers",
      "getAllStudents",
      "getMyProjects",
      "getDomains",
      "getOrientations",
      "getTags",
      "getUser"
    ]),
  }
};
</script>

<style>

</style>