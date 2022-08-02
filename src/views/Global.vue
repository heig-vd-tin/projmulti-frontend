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
            <v-card style="margin-bottom: 50px" elevation="2">
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
                  @change="(event) => attributedUpdate(event, project)"
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
          <draggable :list="getAllUsers" group="people">
            <v-list-item v-for="user in getAllUsers" :key="user.id">
              {{ user.lastname }} {{ user.firstname }}
            </v-list-item>
          </draggable>
        </v-list>
      </v-col>
    </v-row>
  </div>
</template>
<script>
import { mapGetters } from "vuex";
import draggable from "vuedraggable";

export default {
  name: "GlobalView",
  components: {
    draggable,
  },
  data: () => ({
    items: ["Sus", "Amongus", "Sugoma", "A", "B", "C", "D", "E", "F", "G", "H"],
  }),
  methods: {
    attributedUpdate(event, project) {
      console.log(event, project);
    },
  },
  computed: {
    ...mapGetters(["getAllProjects", "getAllUsers"]),
  },
};
</script>
