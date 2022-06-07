<template>
  <div id="app">
    <nav>
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link>
    </nav>
    <router-view />
    <h1>Draggable</h1>
    <draggable v-model="people">
      <div v-for="(name, index) in people" :key="index">
        <v-card>
          <v-card-title>{{ name }}</v-card-title>
          <v-card-text>I am v-card-text</v-card-text>
        </v-card>
      </div>
    </draggable>
  </div>
</template>

<script>
import draggable from "vuedraggable";

export default {
  components: {
    draggable,
  },
  data: () => ({
    people: ["Arnold", "Ronnie", "Jay", "Kai"],
  }),
  watch: {
    people(val) {
      console.log(val);
    },
  },
};
</script>


<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
