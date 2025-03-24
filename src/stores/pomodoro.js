import { defineStore } from 'pinia'
import { useUserStore } from './account'
import { useAsyncState, useLocalStorage, useSessionStorage, whenever } from '@vueuse/core'
import { defaultConfig, loadUserConfigs, loadLatestConfig } from '@/router/pomodoro/pomodoro.js'
import { computed, toRaw, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { useRoute } from 'vue-router'

export const usePomodoroStore = defineStore('pomodoro', () => {
  const currentRoute = useRoute()
  const toast = useToast()

  const fallbackConfig = {
    ...defaultConfig,
    userId: useUserStore().loggedUser?._id
  }

  const { state: currentConfig, isReady: isCurrentConfigReady } = useAsyncState(
    loadLatestConfig(useUserStore().loggedUser?._id),
    fallbackConfig,
    { shallow: false }
  )

  const { state: userConfigs } = useAsyncState(
    loadUserConfigs(useUserStore().loggedUser?._id),
    new Map(),
    { shallow: false }
  )

  const pomodoro = useSessionStorage('pomodoro', {
    initialTimer: null,
    timer: null,
    phase: 'pomodoro',
    cycle: 1,
    started: false,
    running: false,
    finished: false,
    timeoutId: 0,
    longBreakLap: 0
  })

  const preferredDurationFormat = useLocalStorage('pomodoro.preferredDurationFormat', 'mm')

  const timer = computed(() => formatClockTime(pomodoro.value.timer))

  whenever(isCurrentConfigReady, () => {
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

  watch(currentConfig, () => {
    if (!pomodoro.value.started) {
      initNewPomodoro()
    }
  })

  function initNewPomodoro() {
    pomodoro.value.initialTimer = currentConfig.value.pomodoroTime * 60
    pomodoro.value.timer = pomodoro.value.initialTimer
    pomodoro.value.phase = 'pomodoro'
    pomodoro.value.cycle = 1
    pomodoro.value.started = false
    pomodoro.value.running = false
    pomodoro.value.finished = false
    pomodoro.value.timeoutId = 0
    if (currentConfig.value.longBreak) {
      pomodoro.value.longBreakLap = 0
    }
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

  function skipPomodoroPhase() {
    if (!pomodoro.value.started || pomodoro.value.finished) return

    switch (pomodoro.value.phase) {
      case 'pomodoro':
        pomodoro.value.phase = 'break'

        if (!currentConfig.value.longBreak) {
          pomodoro.value.initialTimer = currentConfig.value.shortBreakTime * 60
          break
        }

        if (pomodoro.value.longBreakLap == currentConfig.value.longBreak.interval) {
          pomodoro.value.initialTimer = currentConfig.value.longBreak.time * 60
          pomodoro.value.longBreakLap = 0
        } else {
          pomodoro.value.initialTimer = currentConfig.value.shortBreakTime * 60
        }

        break
      case 'break':
        pomodoro.value.cycle++
        pomodoro.value.longBreakLap++
        if (currentConfig.value.cycles && pomodoro.value.cycle >= currentConfig.value.cycles) {
          finishPomodoro()
        } else {
          pomodoro.value.phase = 'pomodoro'
          pomodoro.value.initialTimer = currentConfig.value.pomodoroTime * 60
        }
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

    pomodoro.value.timer = pomodoro.value.initialTimer
  }

  function timerProgress() {
    pomodoro.value.timer--
    if (pomodoro.value.timer <= 0) skipPomodoroPhase()
    else if (pomodoro.value.running && !pomodoro.value.finished)
      pomodoro.value.timeoutId = setTimeout(timerProgress, 1000)
  }

  function isConfigSelected(config) {
    return config._id === currentConfig.value._id
  }

  function setCurrentConfig(config) {
    if (currentConfig.value._id !== config._id) {
      currentConfig.value = config
      initNewPomodoro()
      return
    }

    if (!pomodoro.value.started) {
      currentConfig.value = config
      initNewPomodoro()
      return
    }

    let restartNeeded = false
    if (
      currentConfig.value.pomodoroTime != config.pomodoroTime ||
      currentConfig.value.shortBreakTime != config.shortBreakTime ||
      currentConfig.value.longBreak != config.longBreak
    )
      restartNeeded = true
    currentConfig.value = config
    if (restartNeeded) restartPomodoroPhase()
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
      pomodoro.value.initialTimer === currentConfig.value.shortBreakTime * 60
    )
  }

  function isLongBreakPhase() {
    return (
      pomodoro.value.phase === 'break' &&
      pomodoro.value.initialTimer === currentConfig.value.longBreak.time * 60
    )
  }

  function getUserConfig(configId) {
    return toRaw(userConfigs.value.get(configId))
  }

  function showPomodoroWidget() {
    return (
      currentRoute.name !== 'pomodoro' &&
      currentRoute.name !== 'login' &&
      pomodoro.value.started &&
      !pomodoro.value.finished
    )
  }

  function computeConfigDuration(config) {
    if (!config.cycles) {
      return Infinity
    }
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

  return {
    currentConfig,
    pomodoro,
    userConfigs,
    timer,
    preferredDurationFormat,
    playPomodoroTimer,
    pausePomodoroTimer,
    skipPomodoroPhase,
    restartPomodoroPhase,
    isConfigSelected,
    setCurrentConfig,
    isPomodoroPhase,
    isShortBreakPhase,
    isLongBreakPhase,
    getUserConfig,
    showPomodoroWidget,
    computeConfigDuration,
    formatDuration
  }
})
