import { API_URL } from '../../../const.js'
import { flavors } from '@catppuccin/palette'

/*
 * TODO: spostare pomodoroMessage e breakMessage
 */
export const defaultConfig = {
  name: 'Pomodoro',
  pomodoroTime: 25,
  shortBreakTime: 5,
  longBreak: {
    time: 10,
    interval: 3
  },
  color: flavors.macchiato.colors.maroon
}

/*
 * Carica un pomodoro dal DB
 * TODO: caricare del pomodoro dell'utente
 */
export async function loadPomodoro(userId) {
  try {
    const response = await fetch(API_URL + `/${userId}/pomodoros`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`ERROR - loadPomodoro, response status ${response.status}`)
    }
    return response.json().then((pomodoro) => {
      if (pomodoro)
        return new Pomodoro({
          id: pomodoro._id,
          ...pomodoro
        })
      return null
    })
  } catch (error) {
    console.error(error.message)
  }
}

export async function loadPomodoro_(userId, fallbackConfig = defaultConfig) {
  if (userId == null) return null
  try {
    const response = await fetch(API_URL + `/${userId}/pomodoros`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`ERROR - loadPomodoro, response status ${response.status}`)
    }
    return (
      (await response.json()) || {
        config: fallbackConfig,
        initialTimer: null,
        timer: null,
        phase: null,
        cycle: 1,
        started: false,
        running: false,
        finished: false,
        timeoutId: null
      }
    )
  } catch (error) {
    console.error(error.message)
  }
}

/*
 * Aggiorna i campi di un Pomodoro esistente
 */
export async function updatePomodoro(pomodoro) {
  try {
    const response = await fetch(API_URL + `/pomodoros/${pomodoro.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        initialTimer: pomodoro.initialTimer,
        timer: pomodoro.timer,
        phase: pomodoro.phase,
        cycle: pomodoro.cycle,
        started: pomodoro.started,
        running: pomodoro.running,
        color: pomodoro.color
      })
    })
    if (!response.ok) {
      throw new Error(`ERROR - updatePomodoro, response status ${response.status}`)
    }
  } catch (error) {
    console.error(error.message)
  }
}

/*
 * Crea un nuovo timer Pomodoro
 */
export async function createPomodoro(userId, config) {
  try {
    const response = await fetch(API_URL + `/${userId}/pomodoros`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: config
      })
    })
    if (!response.ok) {
      throw new Error(`ERROR - createPomodoro, response status ${response.status}`)
    }

    return response.json().then((res) => {
      return new Pomodoro({
        id: res._id,
        ...res
      })
    })
  } catch (error) {
    console.error(error.message)
    return null
  }
}

/*
 * Elimina il Pomodoro
 */
export async function deletePomodoro(pomodoro) {
  if (!pomodoro.id) return // Nothing to do, pomodoro is not present in db
  try {
    const response = await fetch(API_URL + '/pomodoros/' + pomodoro.id, {
      method: 'DELETE'
    })
    if (!response.ok) {
      throw new Error(`ERROR - deletePomodoro, response status ${response.status}`)
    }
  } catch (error) {
    console.error(error.message)
  }
}

export async function loadUserConfigs(userId) {
  if (!userId) return new Map()
  try {
    const response = await fetch(API_URL + `/${userId}/pomodoros/configs`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`ERROR - loadPomodoro, response status ${response.status}`)
    }
    const configs = await response.json()
    return new Map(configs.map((c) => [c._id, c]))
  } catch (error) {
    console.error(error.message)
  }
}

/*
 * Crea la Config
 */
export async function createPomodoroConfig(userId, config) {
  try {
    if (
      config.longBreak &&
      (!config.longBreak.time != !config.longBreak.interval ||
        !config.longBreak.time ||
        !config.longBreak.interval ||
        config.longBreak.timer === '' ||
        config.longBreak.interval === '')
    ) {
      delete config.longBreak
    }

    const response = await fetch(API_URL + `/${userId}/pomodoros/configs/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...config
      })
    })
    if (!response.ok) {
      throw new Error(`ERROR - createPomodoroConfig, response status ${response.status}`)
    }
    return response.json()
  } catch (error) {
    console.error(error.message)
  }
}

export async function updatePomodoroConfig(config) {
  try {
    if (
      config.longBreak &&
      (!config.longBreak.time != !config.longBreak.interval ||
        config.longBreak.timer === '' ||
        config.longBreak.interval === '')
    ) {
      config.longBreak = undefined
    }
    const response = await fetch(API_URL + '/pomodoros/configs/' + config._id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...config
      })
    })
    if (!response.ok) {
      throw new Error(`ERROR - updatePomodoroConfig, response status ${response.status}`)
    }
  } catch (error) {
    console.error(error.message)
  }
}

/*
 * Carica la config usata più di recente
 */
export async function loadLatestConfig(
  userId,
  fallbackConfig = { ...defaultConfig, userId: userId }
) {
  if (!userId) return fallbackConfig
  try {
    const response = await fetch(API_URL + `/${userId}/pomodoros/configs/latest`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`ERROR - loadLatesConfig, response status ${response.status}`)
    }
    return (await response.json()) || fallbackConfig
  } catch (error) {
    console.error(error.message)
  }
}

/*
 * Elimina la Config
 */
export async function deletePomodoroConfig(id) {
  try {
    const response = await fetch(API_URL + '/pomodoros/configs/' + id, {
      method: 'DELETE'
    })
    if (!response.ok) {
      throw new Error(`ERROR - deletePomodoroConfig, response status ${response.status}`)
    }
  } catch (error) {
    console.error(error.message)
  }
}

export class Pomodoro {
  static createTimerStep(pomodoro) {
    return () => {
      pomodoro.timer--

      if (pomodoro.timer <= 0) {
        pomodoro.skip()
      } else if (pomodoro.running && !pomodoro.finished) {
        pomodoro.timeoutId = setTimeout(this.createTimerStep(pomodoro), 1000)
      }

      pomodoro.saveToLocalStorage()
    }
  }

  constructor({
    id = null,
    config,
    userId,
    initialTimer = null,
    timer = null,
    phase = null,
    cycle = 1,
    started = false,
    running = false,
    timeoutId = null
  }) {
    this.id = id
    this.config = config
    this.userId = userId
    this.initialTimer = initialTimer ? initialTimer : this.config.pomodoroTime * 60
    this.timer = timer ? timer : this.initialTimer
    this.phase = phase
    this.cycle = cycle
    this.started = started
    this.timeoutId = timeoutId

    this.running = running
    this.finished = false
  }

  /*
   * Metodo che fa partire il timer: viene aggiornato lo stato del Pomodoro e creato l'interval che decrementa
   * il timer. Infine viene salvato lo stato del Pomodoro sul db
   */
  play() {
    if (this.finished) return

    if (!this.started) {
      this.started = true
      this.phase = 'pomodoro'
      this.initialTimer = this.config.pomodoroTime * 60
    }

    this.running = true

    if (this.timeoutId) clearTimeout(this.timeoutId)
    this.timeoutId = setTimeout(Pomodoro.createTimerStep(this), 1000)

    this.update()
  }

  /*
   * Metodo che mette in pausa il timer: viene aggiornato lo stato del Pomodoro ed eliminato
   * l'interval che decrementa il timer. Infine viene salvato lo stato del Pomodoro sul db
   */
  pause() {
    if (!this.running) return

    clearTimeout(this.timeoutId)
    this.running = false
    this.timeoutId = null

    this.update()
  }

  /*
   * Metodo per terminare il timer Pomodoro. Viene fermato il timer e aggiornato lo stato del Pomodoro.
   * Infine viene eliminato il Pomodoro dal db.
   */
  finish() {
    if (!this.started) return

    this.pause()
    this.finished = true
    this.timer = 0
    this.phase = null

    this.update()
  }

  /*
   * Metodo per passare alla fase successiva del Pomodoro. Viene aggiornato lo stato e terminato il
   * Pomodoro se necessario. Al termine viene salvato lo stato sul db.
   */
  async skip() {
    if (!this.started || this.finished) return

    switch (this.phase) {
      case 'pomodoro':
        this.phase = 'break'
        if (this.cycle % this.config.longBreak.interval == 0) {
          this.initialTimer = this.config.longBreakTime * 60
        } else {
          this.initialTimer = this.config.shortBreakTime * 60
        }
        break
      case 'break':
        this.cycle++
        if (this.config.value && this.cycle >= this.config.cycles) {
          this.finish()
        } else {
          this.phase = 'pomodoro'
          this.initialTimer = this.config.pomodoroTime * 60
        }
        break
    }

    this.timer = this.initialTimer
    this.play()
  }

  /*
   * Metodo per azzerare il timer e far rincominciare la fase in corso da capo.
   */
  restart() {
    if (!this.started || this.finished) return

    if (this.running) {
      clearTimeout(this.timeoutId)
      this.play()
    }

    this.timer = this.initialTimer
    this.update()
  }

  saveToLocalStorage() {
    localStorage.setItem(
      'pomodoro',
      JSON.stringify({
        id: this.id,
        config: this.config,
        userid: this.userId,
        initialTimer: this.initialTimer,
        timer: this.timer,
        phase: this.phase,
        cycle: this.cycle,
        started: this.started,
        running: this.running,
        timeoutId: this.timeoutId
      })
    )
  }

  async update() {
    if (this.id) {
      await updatePomodoro(this)
    } else {
      const pomodoro = await createPomodoro(this.userId, this.config)
      this.id = pomodoro?.id
    }

    this.saveToLocalStorage()
  }

  /*
   * Restituisce il messaggio da mostrare durante la fase in corso
   */
  message() {
    if (this.phase) {
      return this.phase == 'pomodoro' ? this.config.pomodoroMessage : this.config.breakMessage
    }
  }
}
