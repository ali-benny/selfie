import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => {
    const user = JSON.parse(localStorage.getItem('loggedUser'))
    return {
      loggedUser: user
    }
  },
  getters: {
    loggedUserWithDate(state) {
      return {
        ...state.loggedUser,
        birthday: state.loggedUser?.birthday ? new Date(state.loggedUser.birthday) : null
      }
    },
    isLogged() {
      return this.loggedUser == null
    }
  },
  actions: {
    setLoggedUser(user) {
      this.loggedUser = user
      localStorage.setItem('loggedUser', JSON.stringify(user))
    }
  }
})
