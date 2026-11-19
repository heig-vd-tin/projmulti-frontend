<template>
  <v-container style="max-height: 100%; overflow-y: auto; max-width: 900px">
    <div class="text-h4 my-4">Réglages</div>

    <v-card outlined class="mb-6">
      <v-card-title>Phase de la plateforme</v-card-title>
      <v-card-subtitle>Cours {{ getSettings.current_year }} — l'administrateur a toujours accès à tout.</v-card-subtitle>
      <v-card-text>
        <v-radio-group v-model="phase" class="mt-0">
          <v-radio v-for="p in phases" :key="p.value" :value="p.value">
            <template v-slot:label>
              <div>
                <div class="font-weight-medium">{{ p.title }}</div>
                <div class="text-caption">{{ p.description }}</div>
              </div>
            </template>
          </v-radio>
        </v-radio-group>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" :disabled="phase === getSettings.phase" :loading="saving" @click="savePhase">
          Enregistrer la phase
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-card outlined class="mb-6">
      <v-card-title>Étudiants inscrits</v-card-title>
      <v-card-text>
        {{ getAllStudents.length }} étudiant(s) se sont connectés à la plateforme pour le cours {{ getSettings.current_year }}.
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn outlined @click="exportStudents">
          <v-icon left>mdi-file-delimited-outline</v-icon> Exporter la liste (CSV)
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-card outlined class="mb-6" color="red lighten-5">
      <v-card-title>Démarrer le cours {{ nextYear }}</v-card-title>
      <v-card-text>
        <p>À faire une fois la répartition du cours {{ getSettings.current_year }} terminée et exportée. Cette action :</p>
        <ul class="mb-3">
          <li><b>supprime</b> les choix des étudiants, la répartition et la liste des étudiants ;</li>
          <li><b>garde</b> tous les projets (consultables en choisissant l'année {{ getSettings.current_year }}) et les enseignants ;</li>
          <li>ouvre la saisie des projets du cours {{ nextYear }} aux enseignants.</li>
        </ul>
        <p class="mb-2">Une sauvegarde de la base est faite automatiquement deux fois par jour sur le serveur.</p>
        <v-text-field v-model="confirmText" label="Tapez NOUVELLE ANNEE pour confirmer" outlined dense hide-details></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="error" :disabled="confirmText !== 'NOUVELLE ANNEE'" :loading="starting" @click="newYear">
          Démarrer le cours {{ nextYear }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import { downloadCsv, timestamp } from "@/data/csv";

export default {
  name: "AdminSettings",
  data: () => ({
    phase: null,
    saving: false,
    starting: false,
    confirmText: "",
    phases: [
      { value: "projects", title: "Saisie des projets", description: "Les enseignants proposent et modifient leurs projets. Les étudiants n'ont pas accès." },
      { value: "preferences", title: "Choix des étudiants", description: "Les étudiants choisissent 5 projets. Les enseignants consultent sans modifier." },
      { value: "closed", title: "Fermé", description: "Répartition en cours : les enseignants consultent, les étudiants n'ont pas accès." },
    ],
  }),
  computed: {
    ...mapGetters(["getSettings", "getAllStudents", "getOrientations"]),
    nextYear() {
      return (this.getSettings.current_year || 0) + 1;
    },
  },
  created() {
    this.phase = this.getSettings.phase;
  },
  methods: {
    ...mapActions(["updateSettings", "startNewYear", "retrieveAllProjects", "retrieveOwnedProjects", "retrieveAllStudents", "retrieveAllUsers"]),
    notifyError(error) {
      this.$notify({ title: "Erreur", text: error.userMessage, type: "error" });
    },
    savePhase() {
      this.saving = true;
      this.updateSettings({ phase: this.phase })
        .then(() => this.$notify({ title: "Phase enregistrée", text: this.phases.find((p) => p.value === this.phase).title, type: "success" }))
        .catch(this.notifyError)
        .finally(() => (this.saving = false));
    },
    newYear() {
      this.starting = true;
      this.startNewYear({ year: this.nextYear, confirm: this.confirmText })
        .then(() => Promise.all([this.retrieveAllProjects(), this.retrieveOwnedProjects(), this.retrieveAllStudents(), this.retrieveAllUsers()]))
        .then(() => {
          this.phase = this.getSettings.phase;
          this.confirmText = "";
          this.$notify({ title: `Cours ${this.getSettings.current_year} démarré`, text: "La saisie des projets est ouverte aux enseignants.", type: "success" });
        })
        .catch(this.notifyError)
        .finally(() => (this.starting = false));
    },
    exportStudents() {
      const rows = this.getAllStudents.map((s) => [
        s.lastname, s.firstname, s.email, s.orientation ? s.orientation.acronym : "",
        s.preferences.length, s.assignments.length ? "oui" : "non",
      ]);
      downloadCsv(`etudiants_${timestamp()}.csv`, ["Nom", "Prénom", "E-mail", "Orientation", "Nb choix", "Affecté"], rows);
    },
  },
};
</script>
