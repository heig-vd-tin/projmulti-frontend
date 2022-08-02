<template>
  <div>
    <v-expansion-panels>
      <v-expansion-panel v-for="project in getAllProjects" :key="project.id">
        <v-expansion-panel-header>
          <h4>{{ project.title }}</h4>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-row>
            <v-col>
              <div v-html="project.description"></div>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <h5>Orientations:</h5>
              <v-chip
                v-for="(orientation, index) in project.orientations"
                :key="index"
              >
                {{ orientation.name }}
              </v-chip>
            </v-col>
          </v-row>
          <v-row v-if="project.tags.length">
            <v-col>
              <div>
                <h5>Tags:</h5>
                <v-chip v-for="(tag, index) in project.tags" :key="index">
                  {{ tag.name }}
                </v-chip>
              </div>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-btn
                v-if="getMyProjects.length < 5 && !isAlreadyInside(project)"
                @click="addClicked(project)"
                :loading="loading"
                >Ajouter à ma liste
              </v-btn>
            </v-col>
          </v-row>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>
<script>
import { mapGetters, mapActions } from "vuex";

export default {
  name: "AllProjects",
  components: {},
  data: () => ({
    loading: false,
  }),
  methods: {
    ...mapActions(["submitProjectPreference"]),
    isAlreadyInside(project) {
      return this.getMyProjects.some((item) => item.id == project.id);
    },
    addClicked(project) {
      if (this.isAlreadyInside(project)) return;
      let projects = this.getMyProjects.slice(0);
      if (projects.push(project) <= 5) {
        this.loading = true;
        this.submitProjectPreference({
          projects_id: projects.map((item) => item.id),
        })
          .then(() => {
            this.$notify({
              title: "Préférence ajoutée",
              text: "La préférence a été enregistrée avec succès",
              type: "success",
            });
          })
          .catch(() => {
            this.$notify({
              title: "Erreur",
              text: "La préférence n'a pas pu être enregistrée",
              type: "error",
            });
          })
          .finally(() => {
            this.loading = false;
          });
      }
    },
  },
  computed: {
    ...mapGetters(["getAllProjects", "getMyProjects"]),
  },
};
</script>
