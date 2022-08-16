<template>
  <div>
    <my-projects-student v-if="isStudent" />
    <my-projects-teacher v-else-if="isTeacher" />
  </div>
</template>
<script>
import { mapGetters } from "vuex";
import { UserRole } from "@/data/constants";
import MyProjectsStudent from "./MyProjects_student.vue";
import MyProjectsTeacher from "./MyProjects_teacher.vue";

export default {
  name: "MyProjects",
  components: {
    "my-projects-student": MyProjectsStudent,
    "my-projects-teacher": MyProjectsTeacher,
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
