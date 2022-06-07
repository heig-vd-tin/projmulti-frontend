<template>
  <v-form>
    <v-text-field
      label="Titre"
      v-model="title"
      :counter="titleMaxLength"
      :maxlength="titleMaxLength"
      :rules="[rules.title]"
    >
    </v-text-field>

    <v-textarea
      label="Description"
      v-model="description"
      counter
      auto-grow
      rows="1"
    >
    </v-textarea>

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
      :counter="tagsMaxCount"
      :rules="[rules.tags]"
    >
    </v-autocomplete>

    <VueEditor></VueEditor>
  </v-form>
</template>

<script>
import { VueEditor } from "vue2-editor";
export default {
  name: "ProjectForm",
  components: {
    VueEditor,
  },
  data: () => ({
    titleMaxLength: 100,
    tagsMaxCount: 3,
    title: "",
    description: "",
    orientations: ["EAI", "EEM", "EN", "MI"],
    selectedOrientations: [],
    tags: ["#Web", "#Programming", "#HMI", "#Electronics", "#Physics", "#Math"],
    selectedTags: [],
    rules: {
      title: (value) => !!value || "Titre obligatoire!",
      orientations: (value) =>
        value.length >= 1 || "Veuillez sélectionner au moins 1 orientation!",
      tags: (value) => value.length <= 3 || "Maximum 3 tags!",
    },
  }),
};
</script>
