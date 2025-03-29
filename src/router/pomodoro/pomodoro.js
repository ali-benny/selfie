import { push } from 'notivue'
import { API_URL } from '../../../const.js'
import { flavors } from '@catppuccin/palette'

export const initialConfig = {
  name: 'Pomodoro',
  pomodoroTime: 25,
  shortBreakTime: 5,
  longBreak: {
    time: 10,
    interval: 3
  },
  color: {
    name: flavors.macchiato.colors.maroon.name,
    hex: flavors.macchiato.colors.maroon.hex
  }
}

export const initialPomodoro = {
  initialTimer: null,
  timer: null,
  phase: 'pomodoro',
  cycle: 1,
  started: false,
  running: false,
  finished: false,
  timeoutId: 0,
  longBreakLap: 0
}

export async function loadUserConfigs(userId) {
  if (!userId) return new Map()
  try {
    const response = await fetch(`${API_URL}/${userId}/pomodoros/configs`, {
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
    console.error(error)
  }
}

/*
 * Crea la Config
 */
export async function createPomodoroConfig(userId, config) {
  try {
    if (config.longBreak && Object.keys(config.longBreak).length == 0) {
      delete config.longBreak
    }
    const response = await fetch(`${API_URL}/${userId}/pomodoros/configs/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...config
      })
    })
    if (!response.ok)
      throw new Error(`ERROR - createPomodoroConfig, response status ${response.status}`)

    return response.json()
  } catch (error) {
    console.error(error)
  }
}

/*
 * Crea la Config
 */
export async function createPomodoroConfigs(userIds, configId) {
  try {
    const response = await fetch(API_URL + `/pomodoros/configs/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        users: userIds,
        configId: configId
      })
    })
    if (!response.ok) {
      throw new Error(`ERROR - createPomodoroConfig, response status ${response.status}`)
    }
  } catch (error) {
    console.error(error.message)
  }
}

export async function updatePomodoroConfig(config) {
  try {
    if (config.longBreak && Object.keys(config.longBreak).length == 0) {
      delete config.longBreak
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
    console.error(error)
  }
}

/*
 * Carica la config usata più di recente
 */
export async function loadLatestConfig(
  userId,
  fallbackConfig = { ...initialConfig, userId: userId }
) {
  if (!userId) return fallbackConfig
  try {
    const response = await fetch(API_URL + `/${userId}/pomodoros/configs/latest`, {
      method: 'GET'
    })

    if (!response.ok) {
      throw new Error(`ERROR - loadLatestConfig, response status ${response.status}`)
    }
    return (await response.json()) || fallbackConfig
  } catch (error) {
    console.error(error.message)
  }
}

/*
 * Elimina la Config
 */
export async function deletePomodoroConfig(configId) {
  try {
    const response = await fetch(API_URL + '/pomodoros/configs/' + configId, {
      method: 'DELETE'
    })
    if (!response.ok) {
      throw new Error(`ERROR - deletePomodoroConfig, response status ${response.status}`)
    }
  } catch (error) {
    console.error(error.message)
  }
}

/*
 * Tells the server that the config has been selected so it can update the lastUsed field
 */
export async function selectPomodoroConfig(config) {
  try {
    const response = await fetch(
      `${API_URL}/${config.userId}/pomodoros/configs/${config._id}/select`
    )
    if (!response.ok) {
      throw new Error(`ERROR - selectPomodoroConfig, response status ${response.status}`)
    }
    return true
  } catch (error) {
    console.error(error.message)
    return false
  }
}
