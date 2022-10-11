import User from "./user"

const AllProjects = {
    title: "Tous les projets",
    action: "route",
    icon: "mdi-format-list-text",
    route: "/all-projects",
}
const MyProjects = {
     title: "Mes projets", 
     action: "route",
     icon: "mdi-account", 
     route: "/my-projects" }

const NewProject = {
    title: "Nouveau projet",
    action: "route",
    icon: "mdi-account-group-outline",
    route: "/new-project",
}

const Assignments = {
    title: "Assignations",
    action: "route",
    icon: "mdi-clipboard-account-outline",
    route: "/global",
}

const Infos = {
    title: "Infos",
    action: "route",
    icon: "mdi-clipboard-account-outline",
    route: "/infos",
}

const SelectPrj = {
    title: "Select project",
    action: "route",
    icon: "mdi-clipboard-account-outline",
    route: "/select",
}

const FindMatches = {
    title: "Find matches project",
    action: "findMatches",
    icon: "mdi-refresh-auto",
    route: "",
}

const AutoSelect = {
    title: "Auto select project",
    action: "autoSelect",
    icon: "mdi-refresh-auto",
    route: "",
}

const AutoAffect = {
    title: "Auto affect student",
    action: "autoAffect",
    icon: "mdi-refresh-auto",
    route: "",
}

export default function getSidebar(role) {
    switch (role) {
        case User.ADMIN: return [
            AllProjects, MyProjects, NewProject, Infos,
            Assignments, SelectPrj, FindMatches, AutoSelect, AutoAffect]
        //case User.PROFESSOR: return [AllProjects, MyProjects, NewProject]
        //case User.STUDENT: return [AllProjects, MyProjects]
        default: return []
    }
}