<template>
  <div>
    <v-row>
      <v-col>
        <v-btn @click="updateClicked">Mettre à jour</v-btn>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <draggable :list="getMyProjects">
          <v-card
            v-for="project in getMyProjects"
            :key="project.id"
            style="margin-bottom: 15px"
          >
            <v-card-title>{{ project.title }}</v-card-title>
            <v-card-text v-html="project.description"></v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn @click="removeClicked(project)"
                >Supprimer de ma liste</v-btn
              >
            </v-card-actions>
          </v-card>
        </draggable>
      </v-col>
    </v-row>
  </div>
</template>
<script>
import { mapActions, mapGetters } from "vuex";
import draggable from "vuedraggable";

export default {
  name: "MyProjects",
  components: {
    draggable,
  },
  data: () => ({
    myProjects: [],
  }),
  methods: {
    ...mapActions(["submitProjectPreference", "removeProjectPreference"]),
    updateClicked() {
      if (this.getMyProjects.length <= 5) {
        this.submitProjectPreference({
          projects_id: this.getMyProjects.map((item) => item.id),
        });
      }
    },
    removeClicked(project) {
      this.removeProjectPreference({ projects_id: [project.id] });
    },
  },
  computed: {
    ...mapGetters(["getMyProjects"]),
  },
};
</script>