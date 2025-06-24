import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'

export const useTimeMachineStore = defineStore('timeMachine', () => {
  // Virtual time state
  const virtualTime = ref(new Date())
  const isVirtualModeEnabled = ref(false)
  const timeSpeed = ref(1) // 1 = normal speed, 2 = 2x speed, etc.
  const isPlaying = ref(false)

  // Real time tracking for speed calculation
  const lastRealTime = ref(Date.now())
  const lastVirtualTime = ref(virtualTime.value.getTime())

  // Timer for automatic time progression
  let progressionTimer = null

  // Rollover system for day changes
  const rolloverCallbacks = ref(new Set())
  const lastProcessedDate = ref(null)

  // Load state from localStorage on initialization
  const loadState = () => {
    try {
      const saved = localStorage.getItem('timeMachine')
      if (saved) {
        const state = JSON.parse(saved)
        virtualTime.value = new Date(state.virtualTime)
        isVirtualModeEnabled.value = state.isVirtualModeEnabled || false
        timeSpeed.value = state.timeSpeed || 1
        isPlaying.value = false // Always start paused
      }
    } catch (error) {
      console.warn('Failed to load TimeMachine state:', error)
    }
  }

  // Save state to localStorage
  const saveState = () => {
    try {
      const state = {
        virtualTime: virtualTime.value.toISOString(),
        isVirtualModeEnabled: isVirtualModeEnabled.value,
        timeSpeed: timeSpeed.value
      }
      localStorage.setItem('timeMachine', JSON.stringify(state))
    } catch (error) {
      console.warn('Failed to save TimeMachine state:', error)
    }
  }

  // Load last processed date from localStorage
  const loadRolloverState = () => {
    try {
      const saved = localStorage.getItem('timeMachine_rollover')
      if (saved) {
        const state = JSON.parse(saved)
        lastProcessedDate.value = state.lastProcessedDate ? new Date(state.lastProcessedDate) : null
      }
    } catch (error) {
      console.warn('Failed to load TimeMachine rollover state:', error)
    }
  }

  // Save last processed date to localStorage
  const saveRolloverState = () => {
    try {
      const state = {
        lastProcessedDate: lastProcessedDate.value?.toISOString()
      }
      localStorage.setItem('timeMachine_rollover', JSON.stringify(state))
    } catch (error) {
      console.warn('Failed to save TimeMachine rollover state:', error)
    }
  }

  // Watch for changes to save state
  watch([virtualTime, isVirtualModeEnabled, timeSpeed], saveState, { deep: true })

  // Start/stop time progression
  const startTimeProgression = () => {
    if (progressionTimer) return

    isPlaying.value = true
    lastRealTime.value = Date.now()
    lastVirtualTime.value = virtualTime.value.getTime()

    progressionTimer = setInterval(() => {
      const now = Date.now()
      const realDelta = now - lastRealTime.value
      const virtualDelta = realDelta * timeSpeed.value

      virtualTime.value = new Date(lastVirtualTime.value + virtualDelta)
      lastRealTime.value = now
      lastVirtualTime.value = virtualTime.value.getTime()
    }, 100) // Update every 100ms for smooth progression
  }

  const stopTimeProgression = () => {
    if (progressionTimer) {
      clearInterval(progressionTimer)
      progressionTimer = null
    }
    isPlaying.value = false
  }

  const toggleTimeProgression = () => {
    if (isPlaying.value) {
      stopTimeProgression()
    } else {
      startTimeProgression()
    }
  }

  // Main API: Get current time (virtual or real)
  const getCurrentTime = () => {
    if (isVirtualModeEnabled.value) {
      return new Date(virtualTime.value)
    }
    return new Date()
  }

  // Get current date without time
  const getCurrentDate = () => {
    const time = getCurrentTime()
    return new Date(time.getFullYear(), time.getMonth(), time.getDate())
  }

  // Time manipulation functions
  const setVirtualTime = (newTime) => {
    if (typeof newTime === 'string') {
      virtualTime.value = new Date(newTime)
    } else if (newTime instanceof Date) {
      virtualTime.value = new Date(newTime)
    } else {
      console.error('Invalid time format for setVirtualTime')
      return
    }

    // Update tracking variables
    lastVirtualTime.value = virtualTime.value.getTime()
    lastRealTime.value = Date.now()
  }

  const jumpToTime = (targetTime) => {
    stopTimeProgression()
    setVirtualTime(targetTime)
  }

  const jumpToToday = () => {
    jumpToTime(new Date())
  }

  const addTime = (milliseconds) => {
    const newTime = new Date(virtualTime.value.getTime() + milliseconds)
    setVirtualTime(newTime)
  }

  const addDays = (days) => {
    addTime(days * 24 * 60 * 60 * 1000)
  }

  const addHours = (hours) => {
    addTime(hours * 60 * 60 * 1000)
  }

  const addMinutes = (minutes) => {
    addTime(minutes * 60 * 1000)
  }

  // Enable/disable virtual mode
  const enableVirtualMode = () => {
    isVirtualModeEnabled.value = true
  }

  const disableVirtualMode = () => {
    isVirtualModeEnabled.value = false
    stopTimeProgression()
  }

  const toggleVirtualMode = () => {
    if (isVirtualModeEnabled.value) {
      disableVirtualMode()
    } else {
      enableVirtualMode()
    }
  }

  // Speed control
  const setTimeSpeed = (speed) => {
    if (speed <= 0) {
      console.error('Time speed must be positive')
      return
    }

    timeSpeed.value = speed

    // If playing, restart with new speed
    if (isPlaying.value) {
      stopTimeProgression()
      startTimeProgression()
    }
  }

  // Computed properties
  const formattedVirtualTime = computed(() => {
    if (isVirtualModeEnabled.value) {
      return virtualTime.value.toLocaleString('it-IT', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    } else {
      return new Date().toLocaleString('it-IT', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }
  })

  const formattedVirtualDate = computed(() => {
    return virtualTime.value.toLocaleDateString('it-IT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  })

  const isToday = computed(() => {
    const today = new Date()
    const virtual = virtualTime.value
    return (
      virtual.getDate() === today.getDate() &&
      virtual.getMonth() === today.getMonth() &&
      virtual.getFullYear() === today.getFullYear()
    )
  })

  const daysDifference = computed(() => {
    const today = new Date()
    const virtual = virtualTime.value
    const diffTime = virtual.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  })

  // Utility functions
  const formatTimeForDisplay = (date = null) => {
    const timeToFormat = date || getCurrentTime()
    return timeToFormat.toLocaleString('it-IT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isSameDay = (date1, date2) => {
    const d1 = date1 instanceof Date ? date1 : new Date(date1)
    const d2 = date2 instanceof Date ? date2 : new Date(date2)

    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    )
  }

  // Register callback for rollover events
  const registerRolloverCallback = (callback) => {
    rolloverCallbacks.value.add(callback)
    console.log('[TimeMachine] Registered rollover callback, total:', rolloverCallbacks.value.size)

    // Return unregister function
    return () => {
      rolloverCallbacks.value.delete(callback)
      console.log(
        '[TimeMachine] Unregistered rollover callback, total:',
        rolloverCallbacks.value.size
      )
    }
  }

  // Check for day rollover and trigger callbacks
  const checkForRollover = () => {
    const currentDate = getCurrentDate()
    const currentDateStr = currentDate.toDateString()
    const lastDateStr = lastProcessedDate.value?.toDateString()

    // Check if we've crossed midnight (day change)
    if (lastProcessedDate.value && lastDateStr !== currentDateStr) {
      console.log('[TimeMachine] Day rollover detected:', {
        from: lastDateStr,
        to: currentDateStr,
        callbackCount: rolloverCallbacks.value.size
      })

      // Trigger all registered callbacks
      rolloverCallbacks.value.forEach((callback) => {
        try {
          callback(lastProcessedDate.value, currentDate)
        } catch (error) {
          console.error('[TimeMachine] Rollover callback error:', error)
        }
      })
    }

    // Update last processed date
    lastProcessedDate.value = currentDate
    saveRolloverState()
  }

  // Manual rollover trigger (for testing)
  const triggerManualRollover = () => {
    const currentDate = getCurrentDate()
    const previousDate = new Date(currentDate)
    previousDate.setDate(previousDate.getDate() - 1)

    console.log('[TimeMachine] Manual rollover triggered:', {
      from: previousDate.toDateString(),
      to: currentDate.toDateString(),
      callbackCount: rolloverCallbacks.value.size
    })

    rolloverCallbacks.value.forEach((callback) => {
      try {
        callback(previousDate, currentDate)
      } catch (error) {
        console.error('[TimeMachine] Manual rollover callback error:', error)
      }
    })
  }

  // Watch virtualTime for automatic rollover detection
  watch(virtualTime, () => {
    if (isVirtualModeEnabled.value) {
      checkForRollover()
    }
  })

  // Initialize rollover state
  loadRolloverState()

  // Initialize store
  loadState()

  // Cleanup on unmount
  const cleanup = () => {
    stopTimeProgression()
  }

  return {
    // State
    virtualTime,
    isVirtualModeEnabled,
    timeSpeed,
    isPlaying,

    // Computed
    formattedVirtualTime,
    formattedVirtualDate,
    isToday,
    daysDifference,

    // Core API
    getCurrentTime,
    getCurrentDate,

    // Time manipulation
    setVirtualTime,
    jumpToTime,
    jumpToToday,
    addTime,
    addDays,
    addHours,
    addMinutes,

    // Mode control
    enableVirtualMode,
    disableVirtualMode,
    toggleVirtualMode,

    // Speed control
    setTimeSpeed,
    startTimeProgression,
    stopTimeProgression,
    toggleTimeProgression,

    // Utilities
    formatTimeForDisplay,
    isSameDay,
    cleanup,

    // Rollover API
    registerRolloverCallback,
    triggerManualRollover
  }
})

// Global helper function to replace new Date()
export const now = () => {
  const timeMachine = useTimeMachineStore()
  return timeMachine.getCurrentTime()
}

export const today = () => {
  const timeMachine = useTimeMachineStore()
  return timeMachine.getCurrentDate()
}
