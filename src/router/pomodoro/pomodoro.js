import { API_URL } from '../../../const.js'

/*
 * TODO: spostare pomodoroMessage e breakMessage
 */
export const defaultConfig = {
  pomodoroTime: 25,
  breakTime: 5,
  cycles: 4,
  pomodoroMessage: 'Work!',
  breakMessage: 'Relax :)'
}

/*
 * Carica un pomodoro dal DB
 * TODO: caricare del pomodoro dell'utente
 */
export async function loadPomodoro() {
  try {
    const response = await fetch(API_URL + '/pomodoros', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`ERROR - loadPomodoro, response status ${response.status}`)
    }
    return response.json().then((obj) => {
      if (obj.length == 0) return null
      const pom = obj[0]
      return new Pomodoro({
        id: pom._id,
        ...pom
      })
    })
  } catch (error) {
    console.error(error.message)
  }
}

/*
 * Aggiorna i campi di un Pomodoro esistente
 */
export async function updatePomodoro(pomodoro) {
  try {
    const response = await fetch(API_URL + '/pomodoros/' + pomodoro.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timer: pomodoro.timer,
        phase: pomodoro.phase,
        cycle: pomodoro.cycle,
        started: pomodoro.started,
        running: pomodoro.running
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
export async function createPomodoro(config) {
  try {
    const response = await fetch(API_URL + '/pomodoros', {
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
  }
}

/*
 * Elimina il Pomodoro
 */
export async function deletePomodoro(pomodoro) {
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

export async function loadConfigs() {
  try {
    const response = await fetch(API_URL + '/pomodoros/configs', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`ERROR - loadPomodoro, response status ${response.status}`)
    }
    return response.json()
  } catch (error) {
    console.error(error.message)
  }
}

export async function updatePomodoroConfig(config) {
  try {
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
      if (--pomodoro.timer <= 0) {
        pomodoro.skip()
      }
    }
  }

  constructor({
    id,
    config = defaultConfig,
    timer = null,
    phase = null,
    cycle = 1,
    started = false,
    running = false
  }) {
    this.id = id
    this.config = config
    this.timer = timer ? timer : config.pomodoroTime * 60
    this.phase = phase
    this.cycle = cycle
    this.started = started
    this.running = running
    this.finished = false
    this.intervalId = null
  }

  /*
   * Metodo che fa partire il timer: viene aggiornato lo stato del Pomodoro e creato l'interval che decrementa
   * il timer. Infine viene salvato lo stato del Pomodoro sul db
   */
  play() {
    if (this.finished || this.running) {
      return
    }

    if (!this.started) {
      this.started = true
      this.phase = 'pomodoro'
      this.timer = this.config.pomodoroTime * 60
    }

    this.running = true
    this.intervalId = setInterval(Pomodoro.createTimerStep(this), 1000)

    updatePomodoro(this)
  }

  /*
   * Metodo che mette in pausa il timer: viene aggiornato lo stato del Pomodoro ed eliminato
   * l'interval che decrementa il timer. Infine viene salvato lo stato del Pomodoro sul db
   */
  pause() {
    if (!this.running) return

    clearInterval(this.intervalId)
    this.running = false
    this.intervalId = null

    updatePomodoro(this)
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

    deletePomodoro(this)
  }

  /*
   * Metodo per passare alla fase successiva del Pomodoro. Viene aggiornato lo stato e terminato il
   * Pomodoro se necessario. Al termine viene salvato lo stato sul db.
   */
  skip() {
    if (!this.started || this.finished) return

    if (this.running) {
      clearInterval(this.intervalId)
    }

    switch (this.phase) {
      case 'pomodoro':
        this.phase = 'break'
        this.timer = this.config.breakTime * 60
        break
      case 'break':
        if (++this.cycle >= this.config.cycles) {
          this.finish()
        } else {
          this.phase = 'pomodoro'
          this.timer = this.config.pomodoroTime * 60
        }
        break
    }

    if (this.running) {
      this.intervalId = setInterval(Pomodoro.createTimerStep(this), 1000)
      updatePomodoro(this)
    }
  }

  /*
   * Metodo per azzerare il timer e far rincominciare la fase in corso da capo.
   */
  restart() {
    if (!this.started || this.finished) return

    if (this.running) {
      clearInterval(this.intervalId)
      this.intervalId = setInterval(Pomodoro.createTimerStep(this), 1000)
    }
    this.timer =
      this.phase === 'pomodoro' ? this.config.pomodoroTime * 60 : this.config.breakTime * 60

    updatePomodoro(this)
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
