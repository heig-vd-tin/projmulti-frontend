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

export function getOrientationFromDomainId(domain_id, enlarge)
{
    switch (domain_id){
        case '1': // meca
            return [7, 8];
        case '2': // electronic
            return enlarge ? [2,7,3] : [2];
        case '3': // electric
            return enlarge ? [2,3,7] : [2,3];
        case '4': // Thermic
            return [5,6];
        case '5': // Energy
            return [4];
        case '6': // Programming
            return enlarge ? [1,2,7] : [1];
    }
    return [];
}