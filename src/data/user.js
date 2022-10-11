export default class User {
    static get ADMIN() { return "admin" }
    static get PROFESSOR() { return "professor" }
    static get STUDENT() { return "student" }
    static get TEACHERS() { return [this.ADMIN, this.PROFESSOR] }

    constructor(userData) {
        //Base fields
        this.id = userData.id
        this.firstname = userData.firstname
        this.lastname = userData.lastname
        this.email = userData.email
        this.role = userData.role
        this.orientation_id = userData.orientation_id
        this.orientation = userData.orientation
        this.preferences = userData.preferences ?? []
        this.assignments = userData.assignments ?? []
    }

    get isAdmin() { return User.ADMIN === this.role }
    get isProfessor() { return User.PROFESSOR === this.role }
    get isStudent() { return User.STUDENT === this.role }
    //get isTeacher() { return User.TEACHERS.includes(this.role) }
    get isTeacher() { return User.PROFESSOR === this.role || User.ADMIN === this.role }
}