<template>
  <v-form v-model="valid" ref="form" :disabled="loading">
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
      label="Domains"
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
    <v-autocomplete
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
    </v-autocomplete>

    <br />
    <VueEditor
      v-model="description"
      placeholder="Entrez une description..."
      :disabled="loading"
    ></VueEditor>
    <br />

    <v-btn
      v-if="editing"
      :disabled="!valid"
      color="success"
      class="mr-4"
      @click="edit"
      :loading="loading"
    >
      Modifier
    </v-btn>
    <v-btn
      v-else
      :disabled="!valid"
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
      Effacer
    </v-btn>
  </v-form>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import { VueEditor } from "vue2-editor";
const TITLE_MAX_LENGTH = 100;
const SHORT_DESC_MAX_LENGTH = 200;
const TAGS_MAX = 3;

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
    titleMaxLength: TITLE_MAX_LENGTH,
    shortDescMaxLength: SHORT_DESC_MAX_LENGTH,
    tagsMax: TAGS_MAX,
    loading: false,
    valid: false,
    title: "",
    description: "",
    short_description: "",
    selectedDomains: [],
    selectedTags: [],
    rules: {
      title: (value) => !!value || "Titre obligatoire!",
      shortDesc: (value) => !!value || "Résumé obligatoire!",
      domains: (value) =>
        value.length >= 1 || "Veuillez sélectionner au moins 1 domain!",
      tags: (value) => value.length <= TAGS_MAX || `Maximum ${TAGS_MAX} tags!`,
    },
  }),
  methods: {
    ...mapActions(["createProject", "editProject"]),
    edit() {
      if (!this.$refs.form.validate()) return;
      this.loading = true;
      this.editProject(this.formObject)
        .then(() => {
          this.$notify({
            title: "Formulaire envoyé",
            text: "Le projet a été modifié avec succès",
            type: "success",
          });
          this.$emit("success");
          this.$router.push('/all-projects')
        })
        .catch(() => {
          this.$notify({
            title: "Erreur",
            text: "Le formulaire n'a pas pu être envoyé",
            type: "error",
          });
          this.$emit("error");
        })
        .finally(() => {
          this.loading = false;
        });
    },
    create() {
      if (!this.$refs.form.validate()) return;
      this.loading = true;
      this.createProject(this.formObject)
        .then(() => {
          this.$notify({
            title: "Formulaire envoyé",
            text: "Le projet a été enregistré avec succès",
            type: "success",
          });
          this.reset();
          this.$emit("success");
          this.$router.push('/all-projects')
        })
        .catch(() => {
          this.$notify({
            title: "Erreur",
            text: "Le formulaire n'a pas pu être envoyé",
            type: "error",
          });
          this.$emit("error");
        })
        .finally(() => {
          this.loading = false;
        });
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
