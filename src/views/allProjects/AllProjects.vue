<template>
  <div>
    <all-projects-student v-if="isStudent" />
    <all-projects-teacher v-else-if="isTeacher" />
  </div>
</template>
<script>
import { mapGetters } from "vuex";
import { UserRole } from "@/data/constants";
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
    isStudent() {
      return UserRole.isStudent(this.getUser.role);
    },
    isTeacher() {
      return UserRole.isTeacher(this.getUser.role);
    },
  },
};
</script>
