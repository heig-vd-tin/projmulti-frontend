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
              Orientations :
              <v-chip-group column>
                <v-chip
                  v-for="orientation in project.orientations"
                  :key="orientation.id"
                >
                  {{ orientation.name }}
                </v-chip>
              </v-chip-group>
            </v-col>
          </v-row>
          <v-row v-if="project.tags.length">
            <v-col>
              Tags :
              <v-chip-group column>
                <v-chip v-for="tag in project.tags" :key="tag.id">
                  {{ tag.name }}
                </v-chip>
              </v-chip-group>
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
              type: "success",
            });
          })
          .catch(() => {
            this.$notify({
              title: "Erreur",
              text: "La préférence n'a pas pu être ajoutée",
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
