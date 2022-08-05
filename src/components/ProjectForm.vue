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

    <v-select
      label="Orientations"
      v-model="selectedOrientations"
      :items="getOrientations"
      multiple
      :rules="[rules.orientations]"
      :loading="loading"
      return-object
    >
    </v-select>

    <v-radio-group
      v-for="(orientation, index) in selectedOrientations"
      :key="index"
      v-model="orientation.importance"
      :label="`Importance de l'orientation ${orientation.value} :`"
      row
      mandatory
    >
      <v-radio value="1" label="souhaitable"></v-radio>
      <v-radio value="2" label="important"></v-radio>
      <v-radio value="3" label="indispensable"></v-radio>
    </v-radio-group>

    <!--  v-combobox ?  -->
    <v-autocomplete
      label="Tags"
      v-model="selectedTags"
      :items="getTags"
      multiple
      chips
      deletable-chips
      :counter="tagsMax"
      :rules="[rules.tags]"
      :loading="loading"
    >
    </v-autocomplete>

    <VueEditor
      v-model="description"
      placeholder="Entrez une description..."
      :disabled="loading"
    ></VueEditor>

    <v-btn
      :disabled="!valid"
      color="success"
      class="mr-4"
      @click="validate"
      :loading="loading"
    >
      Publier
    </v-btn>

    <v-btn color="error" class="mr-4" @click="reset" :loading="loading">
      Effacer
    </v-btn>
  </v-form>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import { VueEditor } from "vue2-editor";
const TITLE_MAX_LENGTH = 100;
const TAGS_MAX = 3;

export default {
  name: "ProjectForm",
  components: {
    VueEditor,
  },
  data: () => ({
    titleMaxLength: TITLE_MAX_LENGTH,
    tagsMax: TAGS_MAX,
    loading: false,
    valid: false,
    title: "",
    description: "",
    selectedOrientations: [],
    selectedTags: [],
    rules: {
      title: (value) => !!value || "Titre obligatoire!",
      orientations: (value) =>
        value.length >= 1 || "Veuillez sélectionner au moins 1 orientation!",
      tags: (value) => value.length <= TAGS_MAX || `Maximum ${TAGS_MAX} tags!`,
    },
  }),
  methods: {
    ...mapActions(["submitProjectForm"]),
    validate() {
      if (this.$refs.form.validate()) {
        this.loading = true;
        this.submitProjectForm({
          title: this.title,
          description: this.description,
          orientations: this.selectedOrientations.map((item) => ({
            name: item.value,
            importance: item.importance,
          })),
          tags: this.selectedTags,
        })
          .then(() => {
            this.$notify({
              title: "Formulaire envoyé",
              text: "Le formulaire a été enregistré avec succès",
              type: "success",
            });
            this.reset();
          })
          .catch(() => {
            this.$notify({
              title: "Erreur",
              text: "Le formulaire n'a pas pu être envoyé",
              type: "error",
            });
          })
          .finally(() => {
            this.loading = false;
          });
      }
    },
    reset() {
      this.$refs.form.reset();
      this.description = "";
    },
    resetValidation() {
      this.$refs.form.resetValidation();
    },
  },
  computed: {
    ...mapGetters(["getOrientations", "getTags"]),
  },
};
</script>
