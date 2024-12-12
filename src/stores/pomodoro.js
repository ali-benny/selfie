import { defineStore } from 'pinia'
import { useUserStore } from './account'
import { reactivePick, toReactive, useAsyncState, useSessionStorage, whenever } from '@vueuse/core'
import { defaultConfig, loadUserConfigs, loadLatestConfig } from '@/router/pomodoro/pomodoro.js'
import { computed, toRaw, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { useRoute } from 'vue-router'

export const usePomodoroStore = defineStore('pomodoro', () => {
  const currentRoute = useRoute()
  const toast = useToast()

  const fallbackConfig = {
    ...defaultConfig,
    userId: useUserStore().loggedUser._id
  }

  const { state: currentConfig, isReady: isCurrentConfigReady } = useAsyncState(
    loadLatestConfig(useUserStore().loggedUser?._id),
    fallbackConfig
  )

  const { state: userConfigs } = useAsyncState(
    loadUserConfigs(useUserStore().loggedUser?._id),
    new Map()
  )

  const pomodoro = toReactive(
    useSessionStorage('pomodoro', {
      initialTimer: null,
      timer: null,
      phase: 'pomodoro',
      cycle: 1,
      started: false,
      running: false,
      finished: false,
      timeoutId: 0
    })
  )

  const timer = computed(() => formatClockTime(pomodoro.timer))

  watch(
    () => isCurrentConfigReady,
    () => {
      if (pomodoro.started) {
        if (pomodoro.running) playPomodoroTimer()
        return
      }
      initNewPomodoro()
    },
    { once: true }
  )

  whenever(
    () => pomodoro.timer == 30 && pomodoro.phase === 'break',
    () => {
      toast.info('Get ready! Focus is about to start.')
    }
  )

  function initNewPomodoro() {
    pomodoro.initialTimer = currentConfig.pomodoroTime * 60
    pomodoro.timer = pomodoro.initialTimer
    pomodoro.phase = 'pomodoro'
    pomodoro.cycle = 0
    pomodoro.started = false
    pomodoro.running = false
    pomodoro.finished = false
    pomodoro.timeoutId = 0
  }

  function playPomodoroTimer() {
    if (pomodoro.value.finished) return

    if (!pomodoro.value.started) {
      pomodoro.started = true
      pomodoro.phase = 'pomodoro'
      pomodoro.timer = pomodoro.initialTimer
      pomodoro.cycle = 1
      if (currentConfig.longBreak) {
        pomodoro.longBreakLap = 1
      }
    }

    pomodoro.running = true

    if (pomodoro.timeoutId) clearTimeout(pomodoro.timeoutId)
    pomodoro.timeoutId = setTimeout(timerProgress, 1000)
  }

  function pausePomodoroTimer() {
    if (!pomodoro.running) return

    clearTimeout(pomodoro.timeoutId)
    pomodoro.running = false
    pomodoro.timeoutId = null
  }

  function finishPomodoro() {
    if (!pomodoro.started) return
    pausePomodoroTimer()
    pomodoro.finished = true
    pomodoro.timer = 0
    pomodoro.phase = null
  }

  function skipPomodoroPhase() {
    if (!pomodoro.started || pomodoro.finished) return

    switch (pomodoro.phase) {
      case 'pomodoro':
        pomodoro.phase = 'break'
        pomodoro.cycle++

        if (!currentConfig.longBreak) {
          pomodoro.initialTimer = currentConfig.shortBreak.time * 60
          break
        }

        pomodoro.longBreakLap++
        if (pomodoro.longBreakLap == currentConfig.longBreak.interval) {
          pomodoro.initialTimer = currentConfig.longBreak.time * 60
          pomodoro.longBreakLap = 0
        } else {
          pomodoro.initialTimer = currentConfig.shortBreak.time * 60
        }
        break
      case 'break':
        if (currentConfig.cycles && pomodoro.cycle >= currentConfig.cycles) {
          finishPomodoro()
        } else {
          pomodoro.phase = 'pomodoro'
          pomodoro.initialTimer = currentConfig.pomodoroTime * 60
        }
        break
    }

    pomodoro.timer = pomodoro.initialTimer
    playPomodoroTimer()
  }

  function restartPomodoroPhase() {
    if (!pomodoro.started || pomodoro.finished) return

    if (pomodoro.running) {
      clearTimeout(pomodoro.timeoutId)
      playPomodoroTimer()
    }

    pomodoro.timer = pomodoro.initialTimer
  }

  function timerProgress() {
    pomodoro.timer--
    if (pomodoro.timer <= 0) skipPomodoroPhase()
    else if (pomodoro.running && !pomodoro.finished)
      pomodoro.timeoutId = setTimeout(timerProgress, 1000)
  }

  function isConfigSelected(config) {
    return config._id === currentConfig._id
  }

  function setCurrentConfig(config) {
    if (currentConfig._id !== config._id) {
      Object.assign(currentConfig, config)
      initNewPomodoro()
      return
    }

    let restartNeeded =
      currentConfig.pomodoroTime != config.pomodoroTime ||
      currentConfig.shortBreakTime != config.shortBreakTime ||
      currentConfig.longBreak != config.longBreak ||
      currentConfig.longBreak.time != config.longBreak.time ||
      currentConfig.longBreak.interval != config.longBreak.interval

    Object.assign(currentConfig, config)

    if (restartNeeded) restartPomodoroPhase()
  }

  function formatClockTime(time) {
    if (!time) return '00:00'
    let minutes = Math.floor(time / 60)
    let seconds = Math.floor(time % 60)
    return (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds
  }

  function isPomodoroPhase() {
    return pomodoro.phase === 'pomodoro'
  }

  function isShortBreakPhase() {
    return pomodoro.phase === 'break' && pomodoro.initialTimer === currentConfig.shortBreakTime * 60
  }

  function isLongBreakPhase() {
    if (!currentConfig.longBreak) return false
    return pomodoro.phase === 'break' && pomodoro.initialTimer === currentConfig.longBreak.time * 60
  }

  function showPomodoroWidget() {
    return currentRoute.name !== 'pomodoro' && pomodoro.started && !pomodoro.finished
  }

  function getUserConfig(configId) {
    return toRaw(userConfigs.get(configId))
  }

  return {
    currentConfig,
    pomodoro,
    userConfigs,
    timer,
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
    getUserConfig
  }
})
