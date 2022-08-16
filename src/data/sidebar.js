import User from "./user"

const AllProjects = {
    title: "Tous les projets",
    icon: "mdi-format-list-text",
    route: "/all-projects",
}
const MyProjects = { title: "Mes projets", icon: "mdi-account", route: "/my-projects" }
const NewProject = {
    title: "Nouveau projet",
    icon: "mdi-account-group-outline",
    route: "/new-project",
}
const Assignments = {
    title: "Assignations",
    icon: "mdi-clipboard-account-outline",
    route: "/global",
}

export default function getSidebar(role) {
    switch (role) {
        case User.ADMIN: return [AllProjects, MyProjects, NewProject, Assignments]
        case User.PROFESSOR: return [AllProjects, MyProjects, NewProject]
        case User.STUDENT: return [AllProjects, MyProjects]
        default: return []
    }
}