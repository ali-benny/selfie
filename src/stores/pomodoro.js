import { defineStore } from 'pinia'
import { Pomodoro } from '@/router/pomodoro/pomodoro.js'

export const usePomodoroStore = defineStore('pomodoro', {
  state: () => ({
    pomodoro: JSON.parse(localStorage.getItem('pomodoro'))
  }),
  getters: {
    pomodoroObj() {
      return new Pomodoro({ ...this.pomodoro, started: true })
    },
    isStored() {
      return localStorage.getItem('pomodoro') != null
    }
  },
  actions: {
    update(pomodoro) {
      if (!this.pomodoro) {
        this.pomodoro = {}
      }
      console.log('update')
      this.pomodoro.id = pomodoro.id
      this.pomodoro.config = pomodoro.config
      this.pomodoro.timer = pomodoro.timer
      this.pomodoro.phase = pomodoro.phase
      this.pomodoro.cycle = pomodoro.cycle
      this.pomodoro.running = pomodoro.running
      this.pomodoro.intervalId = pomodoro.intervalId

      localStorage.setItem(JSON.stringify('pomodoro', this.pomodoro))
    }
  }
})
