<template>
  <v-form v-model="valid" ref="form">
    <v-text-field
      label="Titre"
      v-model="title"
      :counter="titleMaxLength"
      :maxlength="titleMaxLength"
      :rules="[rules.title]"
    >
    </v-text-field>

    <v-select
      label="Orientations"
      v-model="selectedOrientations"
      :items="orientations"
      multiple
      :rules="[rules.orientations]"
    >
    </v-select>

    <v-autocomplete
      label="Tags"
      v-model="selectedTags"
      :items="tags"
      multiple
      chips
      deletable-chips
      :counter="tagsMax"
      :rules="[rules.tags]"
    >
    </v-autocomplete>

    <VueEditor
      v-model="description"
      placeholder="Entrez une description..."
    ></VueEditor>

    <v-btn :disabled="!valid" color="success" class="mr-4" @click="validate">
      Publier
    </v-btn>

    <v-btn color="error" class="mr-4" @click="reset"> Effacer </v-btn>
  </v-form>
</template>

<script>
import { mapActions } from "vuex";
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
    valid: false,
    title: "",
    description: "",
    selectedOrientations: [],
    selectedTags: [],
    orientations: ["EAI", "EEM", "EN", "MI", "None"],
    tags: [
      "#Web",
      "#Programming",
      "#HMI",
      "#Electronics",
      "#Physics",
      "#Math",
      "#None",
    ],
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
        this.submitProjectForm({
          title: this.title,
          description: this.description,
          orientations: this.selectedOrientations,
          tags: this.selectedTags,
        }).then((response) => console.log(response.data));
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
};
</script>
