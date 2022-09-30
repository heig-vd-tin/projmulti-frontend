import {getOrientationFromDomainId} from './helpers'

export default class Project{
    constructor(projectData){
        //Base fields
        this.id = projectData.id
        this.title = projectData.title
        this.description = projectData.description
        this.short_description = projectData.short_description
        this.owner_id = projectData.owner_id
        this.selected = projectData.selected
        //Situationnal fields
        this.orientations = projectData.orientations ?? []
        this.domains = projectData.domains ?? []
        this.tags = projectData.tags ?? []
        this.preferred_users = projectData.preferred_users ?? []
        this.assigned_users = projectData.assigned_users ?? []
        this.matched_users = projectData.matched_users ?? []
        //Extra fields
        this.loading = false
        this.editing = false
    }

    getUserPreference(user){
        let res = this.preferred_users.find(pu => pu.id === user.id)
        return res.pivot.priority
    }

    // eslint-disable-next-line
    getPreferredUsers(maxPriority, orientationAcronym){
        if( orientationAcronym != null){
            console.log("a")
        }
        let r = this.preferred_users.filter(user => user.pivot.priority <= maxPriority)

        return r//.filter(user => user.orientation.acronym === orientationAcronym)
    }

    getMatchedUsers(maxPriority){
        return this.matched_users.filter(user => user.pivot.priority <= maxPriority)
    }

    getAssignedUsers(domain_id){
        let os = getOrientationFromDomainId(domain_id, false)
        let res = this.assigned_users.filter(user => {
            return os.find(o => o == user.orientation_id) != undefined
        })       
        return res
    }

    getRequiredOrientations(){
        return this.orientations.filter(orientation => orientation.pivot.importance >= 3)
    }

    isFulfilledOrientations(){
        return this.getRequiredOrientations().every(orientation => this.getAssignedUsers(orientation.acronym).length)
    }
}