<template>
  <StudentChoicesView v-if="session.user.isStudent" />
  <TeacherProjectsView v-else />
</template>

<script setup>
import { onMounted } from 'vue'
import { useSessionStore } from '@/stores/session'
import StudentChoicesView from '@/views/student/StudentChoicesView.vue'
import TeacherProjectsView from '@/views/projects/TeacherProjectsView.vue'

const session = useSessionStore()

onMounted(() => {
  if (session.user.isStudent) document.title = 'Mes choix · Projets multidisciplinaires · HEIG-VD'
})
</script>
