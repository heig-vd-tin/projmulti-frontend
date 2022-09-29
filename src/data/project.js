import {getOrientationFromDomainId} from './helpers'

export default class Project{
    constructor(projectData){
        //Base fields
        this.id = projectData.id
        this.title = projectData.title
        this.description = projectData.description
        this.short_description = projectData.short_description
        this.owner_id = projectData.owner_id
        //Situationnal fields
        this.orientations = projectData.orientations ?? []
        this.domains = projectData.domains ?? []
        this.tags = projectData.tags ?? []
        this.preferred_users = projectData.preferred_users ?? []
        this.assigned_users = projectData.assigned_users ?? []
        //Extra fields
        this.loading = false
        this.editing = false
    }

    // eslint-disable-next-line
    getPreferredUsers(orientationAcronym){
        return this.preferred_users//.filter(user => user.orientation.acronym === orientationAcronym)
    }

    getAssignedUsers(domain_id){
        console.log("ass 1 ", domain_id)
        let os = getOrientationFromDomainId(domain_id)
        console.log("ass 2", os)
        console.log("ass 3", this.assigned_users)
        return this.assigned_users.filter(user => {
            os.find(o => o === user.orientation.id)
        })
    }

    getRequiredOrientations(){
        return this.orientations.filter(orientation => orientation.pivot.importance >= 3)
    }

    isFulfilledOrientations(){
        return this.getRequiredOrientations().every(orientation => this.getAssignedUsers(orientation.acronym).length)
    }
}