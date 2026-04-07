export class StorageService {
    constructor(namespace = 'globe') {
        this.namespace = namespace;
    }

    getCurrentUser() {
        return JSON.parse(localStorage.getItem(`${this.namespace}_current_user`));
    }

    setCurrentUser(user) {
        localStorage.setItem(`${this.namespace}_current_user`, JSON.stringify(user));
    }

    clearCurrentUser() {
        localStorage.removeItem(`${this.namespace}_current_user`);
    }

    getUsers() {
        return JSON.parse(localStorage.getItem(`${this.namespace}_users`)) || [];
    }

    setUsers(users) {
        localStorage.setItem(`${this.namespace}_users`, JSON.stringify(users));
    }

    getTrips(email) {
        return JSON.parse(localStorage.getItem(`${this.namespace}_trips_${email}`)) || [];
    }

    setTrips(email, trips) {
        localStorage.setItem(`${this.namespace}_trips_${email}`, JSON.stringify(trips));
    }
}
