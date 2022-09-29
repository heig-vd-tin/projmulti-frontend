<template>
  <v-card @click="$emit('click')" style="margin-bottom: 50px" elevation="2">
    <v-card-title style="justify-content: center">
      {{ project.title }} #{{ project.id }}
    </v-card-title>
    <v-card-subtitle class="font-weight-medium text-decoration-underline" :hidden=light>Short description:</v-card-subtitle>
    <v-card-text v-html="project.short_description"></v-card-text>
    <v-card-subtitle class="font-weight-medium text-decoration-underline" :hidden=light>Description:</v-card-subtitle>
    <v-card-text :hidden=light v-html="project.description"></v-card-text>
    <v-card-subtitle class="font-weight-medium text-decoration-underline" :hidden=light>Tags:</v-card-subtitle>
    <v-card-text :hidden=light>
      <v-chip-group column>
        <v-chip v-for="tag in project.tags" :key="tag.id">
          {{ tag.name }}
        </v-chip>
      </v-chip-group>
    </v-card-text>
    <v-card-subtitle class="font-weight-medium text-decoration-underline" :hidden=light>Domains:</v-card-subtitle>
    <v-card-text class="py-0">
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
    
    <v-btn
      class="pos-abs-br"
      v-show=owner
      fab
      dark
      x-small
      color="cyan"
      :to="'/edit-project/' + project.id"
    >
      <v-icon dark>
        mdi-pencil
      </v-icon>
    </v-btn>
    
    <v-btn
      class="pos-abs-br"
      v-show="getUser.isStudent"
      fab
      dark
      x-small
      color="cyan"
      :to="'/edit-project/' + project.id"
    >
      <v-icon dark>
        mdi-plus
      </v-icon>
    </v-btn>

  </v-card>
</template>


<script>
import { mapGetters } from "vuex";
import { getDomainColor } from "@/data/helpers.js";

export default {
  name: "ProjectViewComponent",
  props: {
    project: {
      type: Object,
      required: true
    },
    light: {
      type: Boolean,
      default: true
    }
  },
  methods: {
    getColor: function (domain) {
      return getDomainColor(domain);
    }
  },
  computed: {
    ...mapGetters(["getUser"]),
    owner() {
      return this.getUser.isTeacher && (this.getUser.id == this.project.owner_id)
    }
  }
}
</script>

<style>
  .pos-abs-br {
    bottom: 10px;
    right: 10px;
    position: absolute;
    margin: 0;
  }

  .pos-abs-tr {
    top: 10px;
    right: 10px;
    position: absolute;
    margin: 0;
  }
</style>