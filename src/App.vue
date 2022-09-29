<template>
  <v-app>
    <v-overlay v-show="loading" opacity="0.2">
      <v-progress-circular indeterminate size="400">
        <h2>Chargement de l'application...</h2>
      </v-progress-circular>
    </v-overlay>
    <div v-if="!loading">
      <notifications :max="2" />
      <v-app-bar app clipped-left>

        <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
        
        <v-spacer></v-spacer>
        <v-btn 
          v-show="getUser.isAdmin"
          to="/global">
          Assign
        </v-btn>
        <v-btn 
          v-show="getUser.isAdmin"
          to="/all-projects">
          Projects
        </v-btn>
        <v-spacer></v-spacer>

        <v-toolbar-title>
          {{ getUser.firstname }} {{ getUser.lastname }}
        </v-toolbar-title>
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

      <!--<v-navigation-drawer app clipped v-model="drawer">
        <v-list dense nav>
          <v-list-item v-for="(item, index) in sidebar" :key="index" :to="item.route">
            <v-list-item-icon>
              <v-icon>{{ item.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-navigation-drawer>-->

      <v-main style="height: 100vh">
        <router-view :key="$route.path" style="max-height: 100%; height: 100%" />
      </v-main>
    </div>
  </v-app>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import getSidebar from "@/data/sidebar.js";

export default {
  name: "App",
  props: ["keycloak"],
  data: () => ({
    drawer: true,
    loading: true,
  }),
  methods: {
    ...mapActions([
      "retrieveUser",
      "retrieveAllProjects",
      "retrieveOwnedProjects",
      "retrievePreferredProjects",
      "retrieveAllUsers",
      "retrieveAllStudents",
      "retrieveOrientations",
      "retrieveDomains",
      "retrieveTags",
    ]),
  },
  computed: {
    ...mapGetters(["getUser", "getAllProjects"]),
    sidebar() {
      return getSidebar(this.getUser.role);
    },
    projects() {
      return this.getAllProjects;
    }
  },
  created() {
    // this.$router.push("/");
  },
  async mounted() {
    let promises = [
      this.retrieveAllProjects(),
      this.retrieveOrientations(),
      this.retrieveDomains(),
      this.retrieveTags(),
    ];
    this.loading = true;
    await this.retrieveUser();
    let user = this.getUser;
    if (user.isAdmin)
      promises = promises.concat([
        this.retrieveOwnedProjects(),
        this.retrieveAllUsers(),
        this.retrieveAllStudents(),
      ]);
    else if (user.isProfessor)
      promises = promises.concat([this.retrieveOwnedProjects()]);
    else if (user.isStudent)
      promises = promises.concat([this.retrievePreferredProjects()]);
    await Promise.all(promises);
    this.loading = false;
  },
};
</script>