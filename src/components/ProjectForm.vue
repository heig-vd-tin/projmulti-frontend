<template>
  <v-form v-model="valid" ref="form" :disabled="loading">
    <div class="text-h4 text-center my-4">{{pageTitle}}</div>
    <v-text-field
      label="Titre"
      v-model="title"
      :counter="titleMaxLength"
      :maxlength="titleMaxLength"
      :rules="[rules.title]"
      :loading="loading"
    >
    </v-text-field>

    <v-text-field
      label="Résumé court"
      v-model="short_description"
      :counter="shortDescMaxLength"
      :maxlength="shortDescMaxLength"
      :rules="[rules.shortDesc]"
      :loading="loading"
    >
    </v-text-field>

    <v-select
      label="Domaines"
      v-model="selectedDomains"
      :items="selectDomains"
      multiple
      :rules="[rules.domains]"
      :loading="loading"
      return-object
      item-text="name"
    >
    </v-select>

    <!--
    <v-radio-group
      v-for="(domain, index) in selectedDomains"
      :key="index"
      v-model="domain.pivot.importance"
      :label="`Importance du domain ${domain.name} :`"
      row
      mandatory
      :loading="loading"
    >
      <v-radio :value="1" label="souhaitable" color="importance1"></v-radio>
      <v-radio :value="2" label="important" color="importance2"></v-radio>
      <v-radio :value="3" label="indispensable" color="importance3"></v-radio>
    </v-radio-group>
    -->


    <!--  v-combobox ?  -->
    <!-- <v-autocomplete
      label="Tags"
      v-model="selectedTags"
      :items="getTags"
      multiple
      chips
      deletable-chips
      return-object
      item-text="name"
      :counter="tagsMax"
      :rules="[rules.tags]"
      :loading="loading"
    >
    </v-autocomplete> -->

    <br />
    <VueEditor
      v-model="description"
      :editorOptions="editorSettings"
      placeholder="Entrez une description..."
      :disabled="loading"
    ></VueEditor>
    <br />

    <v-alert v-if="formErrors.length" type="warning" text dense class="mt-2">
      <div class="font-weight-medium">Le projet n'est pas encore enregistré :</div>
      <ul><li v-for="(e, i) in formErrors" :key="i">{{ e }}</li></ul>
    </v-alert>

    <v-btn
      v-if="editing"
      color="success"
      class="mr-4"
      @click="edit"
      :loading="loading"
    >
      Modifier
    </v-btn>
    <v-btn
      v-else
      color="success"
      class="mr-4"
      @click="create"
      :loading="loading"
    >
      Publier
    </v-btn>

    <v-btn
      v-if="editing"
      color="error"
      class="mr-4"
      @click="quit"
      :loading="loading"
    >
      Annuler
    </v-btn>
    <v-btn v-else color="error" class="mr-4" @click="quit" :loading="loading">
      Annuler
    </v-btn>
  </v-form>
</template>

<script>
import { VueEditor, Quill } from "vue2-editor"
import { mapGetters, mapActions } from "vuex"
import ImageResize from 'quill-image-resize-vue';
const TITLE_MAX_LENGTH = 100
const SHORT_DESC_MAX_LENGTH = 100
const TAGS_MAX = 3
// Le serveur accepte 64 Mo par requête ; au-delà de 25 Mo de description, la page devient très lente.
const MAX_DESCRIPTION_MB = 25

Quill.register('modules/imageResize', ImageResize);

export default {
  name: "ProjectForm",
  components: {
    VueEditor,
  },
  props: {
    project: {
      type: Object,
      default: null,
    },
  },
  data: () => ({
    editorSettings: {
      modules: {
        imageResize: {}
      }
    },
    titleMaxLength: TITLE_MAX_LENGTH,
    shortDescMaxLength: SHORT_DESC_MAX_LENGTH,
    tagsMax: TAGS_MAX,
    loading: false,
    valid: false,
    formErrors: [],
    title: "",
    description: "",
    short_description: "",
    selectedDomains: [],
    selectedTags: [],
    rules: {
      title: (value) => (!!value && !!value.trim()) || "Le titre est obligatoire.",
      shortDesc: (value) => (!!value && !!value.trim()) || "Le résumé court est obligatoire.",
      domains: (value) =>
        (value && value.length >= 1) || "Sélectionnez au moins un domaine.",
      tags: (value) => value.length <= TAGS_MAX || `Maximum ${TAGS_MAX} tags!`,
    },
  }),
  methods: {
    ...mapActions(["createProject", "editProject"]),
    // Vérifie le formulaire et explique ce qui manque au lieu de griser le bouton.
    checkForm() {
      this.formErrors = [];
      if (!this.title || !this.title.trim()) this.formErrors.push("Le titre est obligatoire.");
      if (!this.short_description || !this.short_description.trim()) this.formErrors.push("Le résumé court est obligatoire.");
      if (!this.selectedDomains || this.selectedDomains.length === 0) this.formErrors.push("Sélectionnez au moins un domaine.");
      const sizeMb = new Blob([this.description || ""]).size / (1024 * 1024);
      if (sizeMb > MAX_DESCRIPTION_MB)
        this.formErrors.push(`La description pèse ${sizeMb.toFixed(1)} Mo (maximum ${MAX_DESCRIPTION_MB} Mo) : réduisez la taille ou le nombre des images.`);
      this.$refs.form.validate();
      if (this.formErrors.length) {
        this.$notify({ title: "Formulaire incomplet", text: this.formErrors.join(" "), type: "warn" });
        return false;
      }
      return true;
    },
    submit(action, successText) {
      if (!this.checkForm()) return;
      this.loading = true;
      action(this.formObject)
        .then(() => {
          this.$notify({
            title: "Formulaire envoyé",
            text: successText,
            type: "success",
          });
          if (!this.editing) this.reset();
          this.$emit("success");
          this.$router.push('/all-projects')
        })
        .catch((error) => {
          this.formErrors = [error.userMessage];
          this.$notify({
            title: "Le projet n'a pas été enregistré",
            text: error.userMessage,
            type: "error",
          });
          this.$emit("error");
        })
        .finally(() => {
          this.loading = false;
        });
    },
    edit() {
      this.submit(this.editProject, "Le projet a été modifié avec succès");
    },
    create() {
      this.submit(this.createProject, "Le projet a été enregistré avec succès");
    },
    quit(){
      this.$router.push('/all-projects')
    },
    reset() {
      this.$refs.form.reset();
      this.description = "";
      this.short_description = "";
    },
  },
  computed: {
    ...mapGetters(["getDomains", "getTags"]),
    editing() {
      return !!this.project;
    },
    pageTitle() {
      return this.editing ? "Edition du projet" : "Création d'un projet";
    },
    formObject() {
      return {
        id: this.editing ? this.project.id : -1,
        title: this.title,
        description: this.description,
        short_description: this.short_description,
        tags: this.selectedTags.map((item) => item.id),
        domains: this.selectedDomains.map((item) => ({
          id: item.id,
          importance: item.pivot.importance,
        })),
      };
    },
    selectDomains() {
      return this.getDomains.flatMap((item) => {
        item.pivot = { importance: 1 };
        return item;
      });
    },
  },
  created() {
    if (this.editing) {
      this.title = this.project.title;
      this.description = this.project.description;
      this.short_description = this.project.short_description;
      this.selectedDomains = this.project.domains;
      this.selectedTags = this.project.tags;
    }
  },
};
</script>
