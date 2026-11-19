<template>
  <v-app>
    <v-overlay v-show="loading" opacity="0.2">
      <v-progress-circular indeterminate size="400">
        <h2>Chargement de l'application...</h2>
      </v-progress-circular>
    </v-overlay>
    <div v-if="!loading">
      <notifications :max="3" />
      <v-app-bar app clipped-left>

        <v-app-bar-nav-icon v-show="getUser.isAdmin" @click="drawer = !drawer"></v-app-bar-nav-icon>

        <v-spacer></v-spacer>
        <v-btn class="px-2 mx-2" v-show="getUser.isAdmin" to="/global">
          Assign
        </v-btn>
        <v-btn class="px-2 mx-2" v-show="getUser.isAdmin" to="/select">
          Select projects
        </v-btn>
        <v-btn class="px-2 mx-2" v-show="getUser.isAdmin" to="/all-projects">
          Projects list
        </v-btn>
        <v-btn class="px-2 mx-2" v-show="getUser.isAdmin" to="/settings">
          <v-icon left>mdi-cog-outline</v-icon> Réglages
        </v-btn>
        <v-spacer></v-spacer>
        <v-chip v-if="getSettings.current_year" class="mr-3" small outlined :title="phaseLabel">
          Cours {{ getSettings.current_year }} · {{ phaseShortLabel }}
        </v-chip>

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

      <v-navigation-drawer app clipped stateless v-model="drawer">
        <v-list dense nav>
          <v-list-item v-for="(item, index) in sidebar" :key="index" @click.stop="OnMenuClick(item)">
            <v-list-item-icon>
              <v-icon>{{ item.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-navigation-drawer>

      <v-main style="height: 100vh">
        <!-- Étudiant hors de la période de choix : rien d'autre n'est chargé. -->
        <v-container v-if="closedForUser" class="fill-height" fluid>
          <v-row justify="center">
            <v-col cols="12" sm="8" md="6">
              <v-card class="pa-6 text-center" outlined>
                <v-icon size="56" color="grey">mdi-calendar-clock</v-icon>
                <div class="text-h5 my-4">La plateforme n'est pas encore ouverte</div>
                <div class="text-body-1">
                  Le choix des projets n'est pas ouvert pour le moment. Vous recevrez un message
                  lorsque vous pourrez choisir vos projets.
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
        <template v-else>
          <v-alert v-if="getUser.isProfessor && getSettings.phase !== 'projects'" type="info" dense text class="ma-2 mb-0">
            La saisie des projets est fermée : vous pouvez consulter et exporter vos projets, mais plus les modifier.
          </v-alert>
          <router-view :key="$route.path" style="max-height: 100%; height: 100%" />
        </template>
      </v-main>
    </div>
  </v-app>
</template>

<script>
import { mapGetters, mapActions } from "vuex"
import getSidebar from "@/data/sidebar.js"
import axios from "axios"

export default {
  name: "App",
  props: ["keycloak"],
  data: () => ({
    drawer: false,
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
      "retrieveSettings",
      "ensureUser",
    ]),

    OnMenuClick(item) {
      this.drawer = false

      switch (item.action) {
        case "route":
          this.$router.push(item.route)
          break
        case "findMatches":
          axios
            .get('/assignment/calcul-match')
            .then(response => (console.log(response)))
          break
        case "autoSelect":
          axios
            .get('/assignment/auto-select')
            .then(response => (console.log(response)))
          break
        case "autoAffect":
          axios
            .get('/assignment/auto-affect')
            .then(response => (console.log(response)))
          break
      }
    },
  },
  computed: {
    ...mapGetters(["getUser", "getAllProjects", "getSettings"]),
    closedForUser() {
      return this.getUser.isStudent && this.getSettings.phase !== 'preferences'
    },
    phaseShortLabel() {
      return { projects: 'saisie des projets', preferences: 'choix des étudiants', closed: 'fermé' }[this.getSettings.phase] || ''
    },
    phaseLabel() {
      return { projects: 'Les profs saisissent leurs projets', preferences: 'Les étudiants choisissent leurs projets', closed: 'Plateforme fermée (répartition)' }[this.getSettings.phase] || ''
    },
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
    this.loading = true;
    try {
      await this.ensureUser();
      await this.retrieveSettings();
      if (this.closedForUser) return;

      let promises = [
        this.retrieveAllProjects(),
        this.retrieveOrientations(),
        this.retrieveDomains(),
        this.retrieveTags(),
      ];
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
    } catch (error) {
      this.$notify({ title: "Erreur", text: error.userMessage || "Chargement impossible", type: "error" });
    } finally {
      this.loading = false;
    }
  },
};
</script>