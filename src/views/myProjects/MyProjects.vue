<template>
  <div>
    <my-projects-student v-if="getUser.isStudent" />
    <my-projects-teacher v-else-if="getUser.isTeacher" />
  </div>
</template>
<script>
import { mapGetters } from "vuex";
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
  },
};
</script>
