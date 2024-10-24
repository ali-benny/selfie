import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    loggedUser: JSON.parse(localStorage.getItem('loggedUser')) || {
      _id: '',
      name: '',
      image: '',
      logged: false
    }
  }),
  actions: {
    setLoggedUser(user) {
      this.loggedUser = user
      localStorage.setItem('loggedUser', JSON.stringify(user))
    }
  }
})
