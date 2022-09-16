export default class Project{
    constructor(projectData){
        //Base fields
        this.id = projectData.id
        this.title = projectData.title
        this.description = projectData.description
        this.owner_id = projectData.owner_id
        //Situationnal fields
        this.orientations = projectData.orientations ?? []
        this.tags = projectData.tags ?? []
        this.preferred_users = projectData.preferred_users ?? []
        this.assigned_users = projectData.assigned_users ?? []
        //Extra fields
        this.loading = false
        this.editing = false
    }

    getPreferredUsers(orientationAcronym){
        return this.preferred_users.filter(user => user.orientation.acronym === orientationAcronym)
    }

    getAssignedUsers(orientationAcronym){
        return this.assigned_users.filter(user => user.orientation.acronym === orientationAcronym)
    }

    getRequiredOrientations(){
        return this.orientations.filter(orientation => orientation.pivot.importance >= 3)
    }

    isFulfilledOrientations(){
        return this.getRequiredOrientations().every(orientation => this.getAssignedUsers(orientation.acronym).length)
    }
}