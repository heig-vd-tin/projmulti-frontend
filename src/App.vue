<template>
  <v-app>
    <notifications :max="2" />
    <v-app-bar app clipped-left>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>
        {{ getUser.firstname }} {{ getUser.lastname }}
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-menu offset-y>
        <template v-slot:activator="{ on, attrs }">
          <v-btn icon v-bind="attrs" v-on="on">
            <v-icon large>mdi-account</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="keycloak.logout()"> Déconnexion </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>
    <v-navigation-drawer app clipped v-model="drawer">
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
import { mapGetters, mapActions } from "vuex";

export default {
  name: "App",
  props: ["keycloak"],
  data: () => ({
    drawer: true,
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
      {
        title: "Global",
        icon: "mdi-clipboard-account-outline",
        route: "/global",
      },
    ],
  }),
  methods: {
    ...mapActions([
      "retrieveUser",
      "retrieveAllProjects",
      "retrieveMyProjects",
      "retrieveAllUsers",
      "retrieveUnassignedUsers",
      "retrieveOrientations",
      "retrieveTags",
    ]),
  },
  computed: {
    ...mapGetters(["getUser"]),
  },
  mounted() {
    this.retrieveUser();
    this.retrieveAllProjects();
    this.retrieveMyProjects();
    this.retrieveAllUsers();
    this.retrieveUnassignedUsers();
    this.retrieveOrientations();
    this.retrieveTags();
  },
};
</script>
