<template>
  <div>
    <v-row>
      <v-col>
        <v-row>
          <v-col
            v-for="(project, index) in getAllProjects"
            :key="index"
            cols="auto"
            md="4"
          >
            <v-card
              style="margin-bottom: 50px"
              elevation="2"
              :disabled="project.loading"
            >
              <v-card-title style="justify-content: center">
                {{ project.title }}
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
                    {{ orientation.name }}
                  </v-chip>
                </v-chip-group>
              </v-card-text>

              <v-card-text>
                Élèves attribués :
                <draggable
                  :list="project.attributed_users"
                  group="people"
                  @change="(event) => assigned(event, project)"
                >
                  <v-list-item
                    v-for="user in project.attributed_users"
                    :key="user.id"
                  >
                    {{ user.lastname }} {{ user.firstname }}
                  </v-list-item>
                </draggable>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="auto">
        Liste des élèves
        <v-list>
          <draggable
            :list="getUnassignedUsers"
            group="people"
            @change="unassigned"
          >
            <v-list-item v-for="user in getUnassignedUsers" :key="user.id">
              {{ user.lastname }} {{ user.firstname }}
            </v-list-item>
          </draggable>
        </v-list>
      </v-col>
    </v-row>
  </div>
</template>
<script>
import { mapActions, mapGetters } from "vuex";
import draggable from "vuedraggable";

export default {
  name: "GlobalView",
  components: {
    draggable,
  },
  data: () => ({}),
  methods: {
    ...mapActions(["addAttribution", "removeAttribution"]),
    assigned(event, project) {
      if (event.added) {
        project.loading = true;
        this.addAttribution({
          project_id: project.id,
          user_id: event.added.element.id,
        })
          .catch(() => {
            this.$notify({
              title: "Erreur",
              text: "La sélection n'a pas pu être enregistrée",
              type: "error",
            });
          })
          .finally(() => (project.loading = false));
      }
    },
    unassigned(event) {
      if (event.added) {
        this.removeAttribution({ user_id: event.added.element.id });
      }
    },
  },
  computed: {
    ...mapGetters(["getAllProjects", "getUnassignedUsers"]),
  },
};
</script>
