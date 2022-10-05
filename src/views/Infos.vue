<template>
  <v-container fluid style="max-height: 100%; overflow-y: auto">
    Number of projects: {{ getProjects().length }} <br />
    Number of teachers: {{ getTeachers().length }} <br />
    Number of students: {{ getStudents().length }} <br />
    <br />
    Number assigned students : {{getAssignedStudents()}}<br />
    Number of assigned priority : {{getNumberAssignedPriority()}}<br />

    <br />
    <v-container fluid>
      <v-row class="py-1" no-gutters sm="2" v-for="(domain) in getDomains" :key=domain.id>
        <v-col sm="2" >Number of students need for</v-col>
        <v-col sm="1">{{domain.name}}</v-col>
        <v-col sm="2">{{getNumberStudentsNeed(domain)}}</v-col>
      </v-row>
    </v-container>

    <br />
    <v-container fluid>
      <v-row class="py-1" no-gutters sm="2" v-for="(orientation, key_o) in getOrientations" :key=key_o>
        <v-col sm="2" >Number of students in :</v-col>
        <v-col sm="1">{{orientation.acronym}}</v-col>
        <v-col sm="2">{{getNumberStudentsOrientation(orientation)}}</v-col>
      </v-row>
    </v-container>

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
      let obj = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
      this.getAllProjects.forEach((project) => {
        project.assigned_users.forEach((user) => {
          let r = project.preferred_users.filter(p => p.id == user.id)
          obj[r[0].pivot.priority] += 1
        })
      })
      return obj
    },
    getNumberStudentsNeed(domain) {
      let cpt = 0
      this.getAllProjects.forEach((project) => {
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