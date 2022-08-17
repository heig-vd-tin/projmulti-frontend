import Vue from 'vue';
import Vuetify from 'vuetify/lib/framework';
import colors from 'vuetify/lib/util/colors'

Vue.use(Vuetify);

export default new Vuetify({
    theme: {
        themes: {
            light: {
                importance3: colors.orange.darken3,
                importance2: colors.orange.lighten1,
                importance1: colors.orange.lighten4,
            }
        }
    }
});
