import { defineStore } from 'pinia'
import { useUserStore } from './account'
import { useAsyncState, useLocalStorage, useSessionStorage, whenever } from '@vueuse/core'
import {
  initialConfig,
  initialPomodoro,
  loadUserConfigs,
  loadLatestConfig,
  selectPomodoroConfig
} from '@/router/pomodoro/pomodoro.js'
import { computed } from 'vue'
import { useToast } from 'vue-toastification'
import { useRoute } from 'vue-router'
import { sendPomodoroAlert } from '@/router/notifications/notifications'

export const usePomodoroStore = defineStore('pomodoro', () => {
  const toast = useToast()

  const defaultConfig = {
    ...initialConfig,
    userId: useUserStore().loggedUser?._id
  }

  /*
   * Map [id, config] of all Pomodoro Configurations of the user.
   */
  const { state: userConfigs } = useAsyncState(
    loadUserConfigs(useUserStore().loggedUser?._id),
    new Map(),
    { shallow: false }
  )

  /*
   * Pomodoro Timer status.
   */
  const pomodoro = useSessionStorage('pomodoro', initialPomodoro)

  /*
   * Currently selected Pomodoro Configuration.
   */
  const { state: config, isReady: isConfigReady } = useAsyncState(
    loadLatestConfig(useUserStore().loggedUser?._id),
    defaultConfig,
    { shallow: false }
  )

  const userTimeFormat = useLocalStorage('pomodoro.userTimeFormat', 'mm')

  /*
   * Formatted timer to be displayed.
   */
  const timer = computed(() => formatClockTime(pomodoro.value.timer))

  const isWidgetOpen = useSessionStorage('pomodoro.isWidgetOpen', false)

  whenever(isConfigReady, () => {
    if (pomodoro.value?.configId !== config.value._id) initNewPomodoro()

    if (pomodoro.value.started) {
      if (pomodoro.value.running) playPomodoroTimer()
      return
    }
    initNewPomodoro()
  })

  whenever(
    () => pomodoro.value.timer == 30 && pomodoro.value.phase === 'break',
    () => {
      toast.info('Get ready! Focus is about to start.')
    }
  )

  function initNewPomodoro() {
    pomodoro.value = structuredClone(initialPomodoro)

    pomodoro.value.configId = config.value._id
    pomodoro.value.initialTimer = config.value.pomodoroTime * 60
    pomodoro.value.timer = pomodoro.value.initialTimer
  }

  function playPomodoroTimer() {
    if (pomodoro.value.finished) return

    if (!pomodoro.value.started) {
      pomodoro.value.started = true
      pomodoro.value.phase = 'pomodoro'
      pomodoro.value.timer = pomodoro.value.initialTimer
    }

    pomodoro.value.running = true

    if (pomodoro.value.timeoutId) clearTimeout(pomodoro.value.timeoutId)
    pomodoro.value.timeoutId = setTimeout(timerProgress, 1000)
  }

  function pausePomodoroTimer() {
    if (!pomodoro.value.running) return

    clearTimeout(pomodoro.value.timeoutId)
    pomodoro.value.running = false
    pomodoro.value.timeoutId = null
  }

  function finishPomodoro() {
    if (!pomodoro.value.started) return
    pausePomodoroTimer()
    pomodoro.value.finished = true
    pomodoro.value.timer = 0
    pomodoro.value.phase = null
  }

  async function skipPomodoroPhase() {
    if (!pomodoro.value.started || pomodoro.value.finished) return

    switch (pomodoro.value.phase) {
      case 'pomodoro':
        pomodoro.value.phase = 'break'

        if (!config.value.longBreak) {
          pomodoro.value.initialTimer = config.value.shortBreakTime * 60
          break
        }

        if (isLongBreakPhase()) {
          pomodoro.value.initialTimer = config.value.longBreak.time * 60
          pomodoro.value.longBreakLap = 0
        } else pomodoro.value.initialTimer = config.value.shortBreakTime * 60

        break
      case 'break':
        if (config.value.cycles && pomodoro.value.cycle >= config.value.cycles) {
          finishPomodoro()
          return
        }
        pomodoro.value.phase = 'pomodoro'
        pomodoro.value.initialTimer = config.value.pomodoroTime * 60
        pomodoro.value.cycle++
        pomodoro.value.longBreakLap++

        break
    }

    pomodoro.value.timer = pomodoro.value.initialTimer
    playPomodoroTimer()
  }

  function restartPomodoroPhase() {
    if (!pomodoro.value.started || pomodoro.value.finished) return

    if (pomodoro.value.running) {
      clearTimeout(pomodoro.value.timeoutId)
      playPomodoroTimer()
    }

    switch (pomodoro.value.phase) {
      case 'pomodoro':
        pomodoro.value.initialTimer = config.value.pomodoroTime * 60
        break
      case 'break':
        if (isLongBreakPhase()) pomodoro.value.initialTimer = config.value.longBreak.time * 60
        else pomodoro.value.initialTimer = config.value.shortBreakTime * 60
        break
    }

    pomodoro.value.timer = pomodoro.value.initialTimer
  }

  function timerProgress() {
    if (!useUserStore().loggedUser) {
      config.value = initialConfig
      initNewPomodoro()
      return
    }

    pomodoro.value.timer--

    if (pomodoro.value.timer == 30) {
      let title = isPomodoroPhase() ? 'Pomodoro timer' : 'Pomodoro timer'
      let message = isPomodoroPhase()
        ? 'Great work! You will be resting soon!'
        : 'Get ready! You have to focus soon!'
      sendPomodoroAlert(useUserStore().loggedUser, title, message)
    }

    if (pomodoro.value.timer <= 0) skipPomodoroPhase()
    else if (pomodoro.value.running && !pomodoro.value.finished)
      pomodoro.value.timeoutId = setTimeout(timerProgress, 1000)
  }

  function isConfigSelected(id) {
    return id === config.value._id
  }

  function isConfigDeletable(id) {
    if (!pomodoro.value.started || pomodoro.value.finished) return true

    return !isConfigSelected(id)
  }

  function setCurrentConfig(c) {
    if (!selectPomodoroConfig(c)) return

    if (pomodoro.value.finished || config.value._id !== c._id) {
      config.value = c
      initNewPomodoro()
      return
    }

    let restartPhaseNeeded = false
    if (
      config.value.pomodoroTime != c.pomodoroTime ||
      config.value.shortBreakTime != c.shortBreakTime ||
      config.value.longBreak != c.longBreak
    )
      restartPhaseNeeded = true

    if (!config.value.cycles && c.cycles) pomodoro.value.cycle = 0

    config.value = c

    if (restartPhaseNeeded) restartPomodoroPhase()
    if (pomodoro.value.cycle >= config.value.cycles) finishPomodoro()
  }

  function formatClockTime(time) {
    if (!time) return '00:00'
    let minutes = Math.floor(time / 60)
    let seconds = Math.floor(time % 60)
    return (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds
  }

  function isPomodoroPhase() {
    return pomodoro.value.phase === 'pomodoro'
  }

  function isShortBreakPhase() {
    return (
      pomodoro.value.phase === 'break' &&
      pomodoro.value.initialTimer === config.value.shortBreakTime * 60
    )
  }

  function isLongBreakPhase() {
    return (
      pomodoro.value.phase === 'break' &&
      pomodoro.value.initialTimer === config.value.longBreak.time * 60
    )
  }

  function showPomodoroWidget() {
    const route = useRoute()
    return (
      route.name !== 'Pomodoro' &&
      route.name !== 'login' &&
      route.name !== 'home' &&
      route.name !== 'NotFound' &&
      pomodoro.value.started &&
      !pomodoro.value.finished
    )
  }

  function computeConfigDuration(config) {
    if (!config.cycles) return Infinity
    if (config.longBreak && !config.longBreak.time != !config.longBreak.interval) return 0

    let c = 0
    let l = 0
    let duration = 0
    while (c < config.cycles) {
      c++
      duration += Number(config.pomodoroTime)
      if (!config.longBreak) {
        duration += Number(config.shortBreakTime)
        continue
      }

      if (l == config.longBreak.interval) {
        duration += Number(config.longBreak.time)
        l = 0
      } else {
        duration += Number(config.shortBreakTime)
        l++
      }
    }
    return duration
  }

  function formatDuration(duration, format) {
    if (isNaN(duration) || duration <= 0) {
      return '-'
    }
    if (format === 'mm') {
      return duration + "'"
    } else {
      const hours = Math.floor(duration / 60)
      let minutes = duration - hours * 60
      if (minutes < 10) {
        minutes = '0' + minutes
      }
      return `${hours}h ${minutes}m`
    }
  }

  function toggleWidgetOpen() {
    isWidgetOpen.value = !isWidgetOpen.value
  }

  return {
    currentConfig: config,
    pomodoro,
    userConfigs,
    timer,
    userTimeFormat,
    isWidgetOpen,
    playPomodoroTimer,
    pausePomodoroTimer,
    skipPomodoroPhase,
    restartPomodoroPhase,
    isConfigSelected,
    setCurrentConfig,
    isPomodoroPhase,
    isShortBreakPhase,
    isLongBreakPhase,
    showPomodoroWidget,
    computeConfigDuration,
    formatDuration,
    toggleWidgetOpen,
    isConfigDeletable
  }
})
