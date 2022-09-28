//import colors from "vuetify/lib/util/colors";

export function getDomainColor(domain) {
    switch (domain.id) {
        case 1:
            return 'colors.blue-grey lighten-2';
        case 2:
            return 'light-blue darken-2';
        case 3:
            return 'orange darken-3';
        case 4:
            return 'deep-orange accent-3';
        case 5:
            return 'yellow darken-1';
        case 6:
            return 'green accent-3';
        default:
            return 'colors.blue-grey lighten-2';
    }
}