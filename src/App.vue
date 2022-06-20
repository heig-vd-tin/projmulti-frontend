<template>
  <v-app>
    <v-navigation-drawer app permanent>
      <v-list dense nav>
        <v-list-item
          v-for="(item, index) in items"
          :key="index"
          :to="item.route"
        >
          <v-list-item-icon>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-main>
      <v-container fluid>
        <router-view :key="$route.path" />
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { mapActions } from "vuex";

export default {
  data: () => ({
    items: [
      {
        title: "Tous les projets",
        icon: "mdi-format-list-text",
        route: "/all-projects",
      },
      { title: "Mes projets", icon: "mdi-account", route: "/my-projects" },
      {
        title: "Nouveau projet",
        icon: "mdi-account-group-outline",
        route: "/new-project",
      },
    ],
  }),
  methods: {
    ...mapActions(["retrieveAllProjects"]),
  },
  mounted() {
    this.retrieveAllProjects();
  },
};
</script>
