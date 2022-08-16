export class UserRole {
    static get ADMIN() { return "admin" }
    static get PROFESSOR() { return "professor" }
    static get STUDENT() { return "student" }
    static get TEACHERS() { return [this.ADMIN, this.PROFESSOR] }
    static isAdmin(role) { return this.ADMIN === role }
    static isProfessor(role) { return this.PROFESSOR === role }
    static isStudent(role) { return this.STUDENT === role }
    static isTeacher(role) { return this.TEACHERS.includes(role) }
}