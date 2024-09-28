const defaultConfig = {
  pomodoroTime: 25 * 60,
  breakTime: 5 * 60,
  cycles: 4,
  pomodoroMessage: 'Werk!',
  breakMessage: 'Relax :)'
}

export class Pomodoro {
  static createTimerStep(pomodoro) {
    return () => {
      if (--pomodoro.timer <= 0) {
        pomodoro.skip()
      }
    }
  }

  constructor(config = defaultConfig) {
    this.config = config
    this.running = false // true iff the timer is going on
    this.started = false
    this.finished = false
    this.timer = this.config.pomodoroTime
    this.cycle = 1
    this.phase = null
    this.intervalId = null
  }

  play() {
    if (this.finished || this.running) {
      return
    }

    if (!this.started) {
      this.started = true
      this.phase = 'pomdoro'
    }

    this.running = true
    this.intervalId = setInterval(Pomodoro.createTimerStep(this), 1000)
  }

  pause() {
    if (!this.running) return

    clearInterval(this.intervalId)
    this.running = false
    this.intervalId = null
  }

  finish() {
    if (!this.started) return

    this.pause()
    this.finished = true
    this.timer = 0
    this.phase = null
  }

  skip() {
    if (!this.started || this.finished) {
      // se non è ancora iniziato o è già terminato
      return
    }

    if (this.running) {
      clearInterval(this.intervalId)
    }

    switch (this.phase) {
      case 'pomodoro':
        this.phase = 'break'
        this.timer = this.config.breakTime
        break
      case 'break':
        if (++this.cycle >= this.config.cycles) {
          this.finish()
        } else {
          this.phase = 'pomodoro'
          this.timer = this.config.pomodoroTime
        }
        break
    }

    if (this.running) {
      this.intervalId = setInterval(Pomodoro.createTimerStep(this), 1000)
    }
  }

  restart() {
    if (!this.started || this.finished) return

    if (this.running) {
      clearInterval(this.intervalId)
      this.intervalId = setInterval(Pomodoro.createTimerStep(this), 1000)
    }
    this.timer = this.phase === 'pomodoro' ? this.config.pomodoroTime : this.config.breakTime
  }

  message() {
    if (this.phase) {
      return this.phase == 'pomodoro' ? this.config.pomodoroMessage : this.config.breakMessage
    }
  }
}
