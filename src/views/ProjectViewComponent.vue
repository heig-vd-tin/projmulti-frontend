<template>
  <v-card class="d-flex flex-column" @click="eventClick" style="margin-bottom: 30px" elevation="2"
    :color="getColorSelected()">
    <v-card-title style="justify-content: center">
      {{ project.title }} #{{ project.id }}
    </v-card-title>
    <v-card-text :hidden=!isAdmin>Owner id : {{project.owner_id}}</v-card-text>
    <v-card-subtitle class="font-weight-medium text-decoration-underline" :hidden=light>Short description:
    </v-card-subtitle>
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
    <v-spacer></v-spacer>
    <div id="group_domain">
      <v-card-subtitle class="font-weight-medium text-decoration-underline" :hidden=light>Domains:</v-card-subtitle>
      <v-card-text :class="classDomain">
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
    </div>

    <v-btn class="pos-abs-br" v-show="owner & canEdit" fab dark x-small color="cyan" :to="'/edit-project/' + project.id">
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-icon v-on="on" dark>
            mdi-pencil
          </v-icon>
        </template>
        <span>Edit project</span>
      </v-tooltip>
    </v-btn>

    <!--Admin selected-->
    <v-btn class="pos-abs-br" @click="adminSelectClick" v-show="isAdmin & canSelect" fab dark x-small :color=adminSelectButtonColor>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-icon v-on="on" dark v-if="project.selected">
            mdi-minus
          </v-icon>
          <v-icon v-on="on" dark v-else>
            mdi-plus
          </v-icon>
        </template>
        <span>Select / Unselect project</span>
      </v-tooltip>
    </v-btn>

    <!--Student unselected-->
    <v-btn class="pos-abs-br" @click="$emit('removepref')" v-show="studentSelected() & light" fab dark x-small
      color="red">
      <v-tooltip bottom color="red">
        <template v-slot:activator="{ on }">
          <v-icon v-on="on" dark>
            mdi-minus
          </v-icon>
        </template>
        <span>Supprimer le projet des sélections</span>
      </v-tooltip>
    </v-btn>

    <!--Nbr student admin-->
    <div class="pos-abs-tr text-right">
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-chip v-on="on" color="blue lighten-3" v-show="isAdmin">
            {{project.getPreferredUsers(3,null).length}} / {{ project.getMatchedUsers(3).length }}
          </v-chip>
        </template>
        <span>Choosen by student with priority &#60;= 3 / Choosen and orientation match with priority &#60;= 3</span>
      </v-tooltip>
    </div>

    <div class="pos-abs-tr text-right mt-10">
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-chip v-on="on" color="blue lighten-3" v-show="isAdmin">
            {{project.getPreferredUsers(5,null).length}} / {{ project.getMatchedUsers(5).length }}
          </v-chip>
        </template>
        <span>Choosen by student / Choosen and orientation match</span>
      </v-tooltip>
    </div>

    <!--Student selected-->
    <v-btn class="pos-abs-tr" v-show="studentSelected()" fab dark x-small color="green">
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <span v-on="on" class="font-weight-bold text-h5">{{studentPriority}}</span>
        </template>
        <span>Selected project with priority</span>
      </v-tooltip>
    </v-btn>

    <!--Student priority-->
    <v-speed-dial :hidden=showChooseButton absolute v-model="fab" direction="top">
      <template v-slot:activator>
        <v-btn v-model="fab" color="blue darken-3" dark small fab>
          <v-icon v-if="fab">
            mdi-close
          </v-icon>
          <v-icon v-else>
            mdi-format-list-bulleted-square
          </v-icon>
        </v-btn>
      </template>

      <v-btn v-for="p in [1,2,3,4,5]" @click.stop="onClickPrefBtn(p, $event)" :key="p" fab dark small
        :color="priorityColorFree(p)">
        <span class="font-weight-bold text-h5">{{p}}</span>
      </v-btn>
    </v-speed-dial>

  </v-card>
</template>


<script>
import { mapGetters, mapActions } from "vuex";
import { getDomainColor } from "@/data/helpers.js";

export default {
  name: "ProjectViewComponent",
  data: () => ({
    fab: false,
  }),
  props: {
    project: {
      type: Object,
      required: true
    },
    light: {
      type: Boolean,
      default: true
    },
    canSelect: {
      type: Boolean,
      default: false
    },
    canEdit: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    ...mapActions(["addProjectPreference", "selectProject", "unselectProject"]),

    eventClick: function (event) {
      //console.log(event.target.tagName);
      if (event.target.tagName == "DIV") {
        event.preventDefault()
        this.$emit("click", event)
      }
    },
    adminSelectClick: function () {

      this.selectProject({
        id: this.project.id, selected: !this.project.selected
      })
        .catch(() => {
          this.$notify({
            title: "Erreur",
            text: "La modification de sélection a échouée",
            type: "error",
          });
        })
        .finally(() => {
        });
    },
    getColor: function (domain) {
      return getDomainColor(domain)
    },
    getColorSelected: function () {
      if (!this.getUser.isStudent && this.project.selected)
        return 'light-green accent-1'
      else
        return 'white'
    },
    priorityFree(level) {
      let exist = this.getMyProjects.find(p => p.priority == level)
      return exist == undefined
    },
    priorityColorFree(level) {
      if (this.priorityFree(level))
        return 'blue darken-1'
      else
        return 'grey lighten-3'
    },
    studentSelected() {
      let prjs = this.getMyProjects.find(p => p.id == this.project.id)
      return prjs != null && this.getUser.isStudent
    },
    onClickPrefBtn(priority) {
      if (this.priorityFree(priority)) {
        this.addPrjPref(priority)
      }
    },
    addPrjPref(priority) {
      let projects = this.getMyProjects.slice(0);
      let p = this.project
      p.priority = priority
      projects.push(p)

      this.loading = true
      this.addProjectPreference({
        projects: projects.map((item) => {
          return { id: item.id, priority: item.priority };
        }),
      })
        .catch(() => {
          this.$notify({
            title: "Erreur",
            text: "La préférence n'a pas pu être ajoutée",
            type: "error",
          });
        })
        .finally(() => {
          this.loading = false
          this.$emit("close")
        });
    },
  },
  computed: {
    ...mapGetters(["getUser", "getMyProjects", "getMatchedUsers"]),
    classDomain() {
      return this.light ? "py-1" : "py-4"
    },
    owner() {
      return this.getUser.isTeacher && (this.getUser.id == this.project.owner_id)
    },
    adminSelectButtonColor() {
      return this.project.selected ? 'red' : 'green'
    },
    isAdmin() {
      return this.getUser.isAdmin
    },
    showChooseButton() {
      return !(this.getUser.isStudent && !this.light && this.studentPriority == 0)
    },
    studentPriority() {
      let prjs = this.getMyProjects.find(p => p.id == this.project.id)
      if (prjs)
        return prjs.priority
      else
        return 0
    }
  },
  beforeMount() {
  }
}
</script>

<style>
#group_domain {}

.v-speed-dial {
  bottom: 10px;
  right: 10px;
  position: absolute;
  margin: 0;
}

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