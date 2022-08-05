<template>
  <div>
    <v-row>
      <v-col>
        <draggable :list="getMyProjects" @change="update">
          <v-card
            v-for="(project, index) in getMyProjects"
            :key="project.id"
            style="margin-bottom: 15px"
            :disabled="project.loading"
          >
            <v-card-title>{{ project.title }}</v-card-title>
            <v-card-subtitle>Priorité {{ index + 1 }}</v-card-subtitle>
            <v-card-text v-html="project.description"></v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn @click="removeClicked(project)" :loading="project.loading"
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
    loading: false,
  }),
  methods: {
    ...mapActions(["submitProjectPreference", "removeProjectPreference"]),
    update(event) {
      event.moved.element.loading = true;
      if (this.getMyProjects.length <= 5) {
        this.submitProjectPreference({
          projects_id: this.getMyProjects.map((item) => item.id),
        })
          .catch(() => {
            this.$notify({
              title: "Erreur",
              text: "La sélection n'a pas pu être enregistrée",
              type: "error",
            });
          })
          .finally(() => (event.moved.element.loading = false));
      }
    },
    removeClicked(project) {
      project.loading = true;
      this.removeProjectPreference({ projects_id: [project.id] })
        .catch(() => {
          this.$notify({
            title: "Erreur",
            text: "La préférence n'a pas pu être effacée",
            type: "error",
          });
        })
        .finally(() => {
          project.loading = false;
        });
    },
  },
  computed: {
    ...mapGetters(["getMyProjects"]),
  },
};
</script>