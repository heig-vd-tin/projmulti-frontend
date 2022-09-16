<template>
  <v-container fluid style="max-height: 100%; overflow-y: auto">
    <v-row>
      <v-col
        v-for="(project, index) in getMyProjects"
        :key="index"
        cols="auto"
        md="4"
      >
        <v-card
          v-if="project.editing"
          style="margin-bottom: 50px; padding: 15px"
          elevation="2"
        >
          <ProjectForm
            :project="project"
            @cancel="project.editing = false"
            @success="project.editing = false"
          ></ProjectForm>
        </v-card>
        <v-card v-else style="margin-bottom: 50px" elevation="2">
          <v-card-title style="justify-content: center">
            {{ project.title }} #{{ project.id }}
          </v-card-title>
          <v-card-text v-html="project.description"></v-card-text>
          <v-card-text>
            Tags :
            <v-chip-group column>
              <v-chip v-for="tag in project.tags" :key="tag.id">
                {{ tag.name }}
              </v-chip>
            </v-chip-group>
          </v-card-text>
          <v-card-text>
            Orientations :
            <v-chip-group column>
              <v-chip
                v-for="orientation in project.orientations"
                :key="orientation.id"
                :color="`importance${orientation.pivot.importance}`"
              >
                {{ orientation.acronym }}
              </v-chip>
            </v-chip-group>
          </v-card-text>
          <v-card-text>
            Élèves attribués :
            <v-list-item v-for="user in project.assigned_users" :key="user.id">
              {{ user.lastname }} {{ user.firstname }}
            </v-list-item>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn icon @click="project.editing = true">
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import { mapGetters } from "vuex";
import ProjectForm from "@/components/ProjectForm.vue";

export default {
  name: "MyProjects",
  components: {
    ProjectForm,
  },
  data: () => ({}),
  methods: {},
  computed: {
    ...mapGetters(["getMyProjects"]),
  },
};
</script>