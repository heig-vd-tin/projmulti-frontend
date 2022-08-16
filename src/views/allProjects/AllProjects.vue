<template>
  <div>
    <all-projects-student v-if="getUser.isStudent" />
    <all-projects-teacher v-else-if="getUser.isTeacher" />
  </div>
</template>
<script>
import { mapGetters } from "vuex";
import AllProjectsStudent from "./AllProjects_student.vue";
import AllProjectsTeacher from "./AllProjects_teacher.vue";

export default {
  name: "AllProjects",
  components: {
    "all-projects-student": AllProjectsStudent,
    "all-projects-teacher": AllProjectsTeacher,
  },
  computed: {
    ...mapGetters(["getUser"]),
  },
};
</script>
