<template>
  <div>
    <v-row>
      <v-col>
        <v-select
          label="Filtrer par orientations"
          v-model="selectedOrientations"
          :items="selectOrientations"
          item-text="name"
          multiple
          clearable
        >
          <template v-slot:selection="{ item }">
            <v-chip>
              <span>{{ item.acronym }}</span>
            </v-chip>
          </template>
        </v-select>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-row>
          <v-col
            v-for="(project, index) in filteredProjects"
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
                <br />
                <br />
                <draggable
                  :list="project.assigned_users"
                  group="people"
                  @change="(event) => assigned(event, project)"
                  class="dropzone"
                >
                  <v-list-item
                    v-for="user in project.assigned_users"
                    :key="user.id"
                  >
                    <v-list-item-content>
                      <v-list-item-title>
                        {{ user.lastname }} {{ user.firstname }}
                      </v-list-item-title>
                      <v-list-item-subtitle>
                        <v-chip>
                          {{ user.orientation.acronym }}
                        </v-chip>
                      </v-list-item-subtitle>
                    </v-list-item-content>
                  </v-list-item>
                </draggable>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="2">
        <div style="position: sticky; top: 80px">
          <v-text-field v-model="search" autofocus label="Recherche...">
          </v-text-field>
          Liste des élèves:
          <v-list>
            <draggable
              :list="filteredUsers"
              group="people"
              @change="unassigned"
              class="dropzone"
            >
              <v-list-item v-for="user in filteredUsers" :key="user.id">
                <v-list-item-content>
                  <v-list-item-title>
                    {{ user.lastname }} {{ user.firstname }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip>
                      {{ user.orientation.acronym }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </draggable>
          </v-list>
        </div>
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
  data: () => ({
    search: "",
    selectedOrientations: [],
  }),
  methods: {
    ...mapActions(["addAssignment", "removeAssignment"]),
    assigned(event, project) {
      if (!event.added) return;
      project.loading = true;
      this.addAssignment({
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
    },
    unassigned(event) {
      if (!event.added) return;
      this.removeAssignment({ user_id: event.added.element.id });
    },
  },
  computed: {
    ...mapGetters(["getAllProjects", "getUnassignedUsers", "getOrientations"]),
    selectOrientations() {
      return this.getOrientations.flatMap((item, index, array) => {
        if (index == 0 || array[index - 1].faculty_name !== item.faculty_name)
          return [{ header: item.faculty_name }, item];
        else return item;
      });
    },
    filteredProjects() {
      return this.getAllProjects.filter((project) => {
        if (!this.selectedOrientations.length) return true;
        return project.orientations.some((orientation) =>
          this.selectedOrientations.includes(orientation.name)
        );
      });
    },
    filteredUsers() {
      return this.getUnassignedUsers
        .filter((user) => {
          let search = this.search.toLowerCase();
          return (
            user.firstname.toLowerCase().includes(search) ||
            user.lastname.toLowerCase().includes(search)
          );
        })
        .sort((a, b) => a.lastname.localeCompare(b.lastname));
    },
  },
};
</script>
<style scoped>
.v-list-item {
  border-style: solid;
  border-width: 1px;
  border-radius: 10px;
  border-color: lightslategray;
  text-align: center;
  margin: 5px;
}
.dropzone {
  border-style: solid;
  border-width: 1px;
  border-radius: 10px;
  border-color: lightslategray;
  min-height: 60px;
}
</style>
