<template>
  <div>
    <v-row>
      <v-col>
        <draggable
          :list="[]"
          @change="remove"
          id="dropzone"
          group="projects"
          ghost-class="hidden-ghost"
          class="dropzone"
        >
          <v-icon> mdi-trash-can </v-icon>
          Retirez vos préférences ici
        </draggable>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <draggable
          :list="getMyProjects"
          @change="reorder"
          @start="drag = true"
          @end="drag = false"
          v-bind="dragOptions"
          group="projects"
        >
          <transition-group
            type="transition"
            :name="!drag ? 'flip-list' : null"
          >
            <v-card
              v-for="(project, index) in getMyProjects"
              :key="project.id"
              style="margin-bottom: 15px"
              :disabled="project.loading"
            >
              <v-card-title>{{ project.title }} #{{ project.id }}</v-card-title>
              <v-card-subtitle>Priorité {{ index + 1 }}</v-card-subtitle>
              <v-card-text v-html="project.description"></v-card-text>
            </v-card>
          </transition-group>
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
    drag: false,
  }),
  methods: {
    ...mapActions(["addProjectPreference", "removeProjectPreference"]),
    reorder(event) {
      if (!event.moved) return;
      event.moved.element.loading = true;
      this.addProjectPreference({
        projects: this.getMyProjects.map((item, index) => {
          return { id: item.id, priority: index + 1 };
        }),
      })
        .catch(() => {
          this.$notify({
            title: "Erreur",
            text: "La sélection n'a pas pu être enregistrée",
            type: "error",
          });
        })
        .finally(() => (event.moved.element.loading = false));
    },
    remove(event) {
      if (!event.added) return;
      let project = event.added.element;
      project.loading = true;
      this.removeProjectPreference({ projects: [project.id] })
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
    dragOptions() {
      return {
        animation: 200,
        group: "description",
        disabled: false,
        ghostClass: "ghost",
      };
    },
  },
};
</script>
<style scoped>
.hidden-ghost {
  display: none;
}
.dropzone {
  border-style: solid;
  border-width: 1px;
  height: 70px;
  line-height: 70px;
  text-align: center;
}
</style>