<template>
  <v-card style="margin-bottom: 50px" elevation="2">
    <v-card-title style="justify-content: center">
      {{ project.title }} #{{ project.id }}
    </v-card-title>
    <v-card-text v-html="project.short_description"></v-card-text>
    <v-card-text hidden="true" v-html="project.description"></v-card-text>
    <v-card-text hidden="true">
      Tags :
      <v-chip-group column>
        <v-chip v-for="tag in project.tags" :key="tag.id">
          {{ tag.name }}
        </v-chip>
      </v-chip-group>
    </v-card-text>
    <v-card-text>
      Domains :
      <v-chip-group column>
        <v-chip v-for="domain in project.domains" :key="domain.id" outlined :color="getColor(domain)">
          <v-tooltip bottom :color="getColor(domain)">
            <template v-slot:activator="{ on }">
              <v-icon v-on="on" center>
                {{ domain.icon }}
              </v-icon>
            </template>
            <span>{{ domain.name }}</span>
          </v-tooltip>
        </v-chip>
      </v-chip-group>
    </v-card-text>
  </v-card>
</template>


<script>
import { getDomainColor } from "@/data/helpers.js";

export default {
  name: "ProjectViewComponent",
  props: {
    project: {
      type: Object,
      required: true
    }
  },
  methods: {
    getColor: function (domain) {
      return getDomainColor(domain);
    }
  }
}
</script>
