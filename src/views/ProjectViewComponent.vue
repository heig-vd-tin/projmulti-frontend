<template>
  <v-card id="topcard" ref="topcard" class="d-flex flex-column" @click="eventClick" style="margin-bottom: 30px" elevation="2"
    :color="getColorSelected()">
    <v-card-title style="justify-content: center" class="mb-0 pb-0">
      {{ project.title }} 
    </v-card-title>
    <!-- <v-card-text :hidden=!isAdmin>Resp : {{project.owner.lastname}} {{project.owner.firstname}}</v-card-text> -->
    <v-card-text class="text-center font-italic p-0 m-0">{{project.owner.lastname}} {{project.owner.firstname}}</v-card-text>
    <v-card-subtitle class="font-weight-medium text-decoration-underline" :hidden=light>Short description:
    </v-card-subtitle>
    <v-card-text v-html="project.short_description"></v-card-text>
    <v-card-subtitle class="font-weight-medium text-decoration-underline" :hidden=light>Description:</v-card-subtitle>
    <v-card-text :hidden=light v-html="descResize"></v-card-text>
    <v-card-subtitle class="font-weight-medium text-decoration-underline" :hidden=light>Tags:</v-card-subtitle>
    <v-card-text :hidden=light>
      <v-chip-group column>
        <v-chip v-for="tag in project.tags" :key="tag.id">
          {{ tag.name }}
        </v-chip>
      </v-chip-group>
    </v-card-text>
    <v-spacer></v-spacer>

    <div :class="classDomain">
      <div class="footer_items">
        <v-card-subtitle class="my-0 py-0 font-weight-medium text-decoration-underline" :hidden=light>Domains:</v-card-subtitle>
        <v-card-text class="py-0" >
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

      <v-btn color="blue" v-show="!light" @click="eventClose">
        close
      </v-btn>

      <!--Student priority-->
      <div :style="styleFooterRight" class="mr-4 text-right d-flex justify-end footer_items">
        <v-speed-dial :hidden=showChooseButton v-model="fab" direction="top">
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

          <v-btn v-for="p in [5,4,3,2,1]" @click.stop="onClickPrefBtn(p, $event)" :key="p" fab dark small
            :color="priorityColorFree(p)">

                  <v-tooltip bottom>
                    <template v-slot:activator="{ on }">
                      <span v-on="on" class="font-weight-bold text-h5"><span class="font-weight-bold text-h5">{{p}}</span></span>
                    </template>
                    <span>1 : Le meilleur choix<br>5 :  Le moin bon choix</span>
                  </v-tooltip>          
          </v-btn>
        </v-speed-dial>
      </div>
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



  </v-card>
</template>


<script>
import { mapGetters, mapActions } from "vuex";
import { getDomainColor } from "@/data/helpers.js";

export default {
  name: "ProjectViewComponent",
  data: () => ({
    fab: false,
    descResize: ""
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
  mounted() {
    this.resizeImage()
  },
  updated() {
    this.resizeImage()
  },
  methods: {
    ...mapActions(["addProjectPreference", "selectProject", "unselectProject"]),

    eventClick: function (event) {
      if (event.target.tagName == "DIV") {
        event.preventDefault()
        this.$emit("click", event)
      }
    },
    eventClose: function (event) {
        this.$emit("close", event)
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
    resizeImage(){
      let tmp = this.project.description

      let winWidth = this.$refs.topcard.$el.clientWidth

      let imgs = [...this.project.description.matchAll(/width="(\d+)"/g)]
      imgs.forEach( i => {
        if(parseInt(i[1]) > (winWidth - 20)){
          console.log("Image resize")
          tmp = tmp.replace("width=\""+i[1], "width=\"95%")
        }
      })

      let tabImg = [...this.project.description.matchAll(/<img(.*?)>/g)]
      tabImg.forEach( i => {
        if(!i[1].includes('width')){
          tmp = tmp.replace(i[1], i[1] + " style=\"max-width:95%\"")
        }
      })

      this.descResize = tmp
    }
  },
  computed: {
    ...mapGetters(["getUser", "getMyProjects", "getMatchedUsers"]),
    classDomain() {
      return this.light ? "project_footer my-0 py-1" : "project_footer my-0 py-4"
    },
    styleFooterRight() {
      return this.light ? "max-width: 60px" : "max-width: 1000px"
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

.v-speed-dial__list{
  align-items: end;
}

.project_footer{
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer_items{
  flex:1;
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
