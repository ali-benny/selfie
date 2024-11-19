import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    loggedUser: JSON.parse(localStorage.getItem('loggedUser'))
  }),
  getters: {
    loggedUserWithDate(state) {
      return {
        ...state.loggedUser,
        birthday: state.loggedUser.birthday ? new Date(state.loggedUser.birthday) : null
      }
    }
  },
  actions: {
    setLoggedUser(user) {
      this.loggedUser = user
      localStorage.setItem('loggedUser', JSON.stringify(user))
    }
  }
})
