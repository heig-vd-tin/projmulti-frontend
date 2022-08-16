<template>
  <div>
    <v-row>
      <v-col
        v-for="(project, index) in getMyProjects"
        :key="index"
        cols="auto"
        md="4"
      >
        <v-card style="margin-bottom: 50px" elevation="2">
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
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
<script>
import { mapGetters } from "vuex";

export default {
  name: "MyProjects",
  components: {},
  data: () => ({}),
  methods: {},
  computed: {
    ...mapGetters(["getMyProjects"]),
  },
};
</script>