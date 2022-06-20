<template>
  <div>
    <v-row>
      <v-col>
        <h3>Projets disponibles</h3>
          <v-expansion-panels>
        <draggable class="list-group" :list="list1" group="people">
            <v-expansion-panel v-for="(project, index) in list1" :key="index">
              <v-expansion-panel-header>
                {{ project.title }}
              </v-expansion-panel-header>
              <v-expansion-panel-content v-html="project.description">
              </v-expansion-panel-content>
            </v-expansion-panel>
        </draggable>
          </v-expansion-panels>
      </v-col>
      <v-col>
        <h3>Projets choisis</h3>
        <draggable class="list-group" :list="list2" group="people">
          <div
            class="list-group-item"
            v-for="(element, index) in list2"
            :key="index"
          >
            <ProjectDisplay :project="element"></ProjectDisplay>
          </div>
        </draggable>
      </v-col>
    </v-row>
  </div>
</template>
<script>
import { mapGetters } from "vuex";
import draggable from "vuedraggable";
import ProjectDisplay from "@/components/ProjectDisplay.vue";

export default {
  name: "MyProjects",
  components: {
    draggable,
    ProjectDisplay,
  },
  data: () => ({
    list1: [],
    list2: [],
  }),
  methods: {},
  computed: {
    ...mapGetters(["getProjects"]),
  },
  mounted() {
    this.list1 = this.getProjects;
  },
};
</script>