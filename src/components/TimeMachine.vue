<template>
  <div class="fixed bottom-4 left-4 z-50">
    <!-- Single Transition Container -->
    <Transition
      name="time-machine"
      mode="out-in"
      enter-active-class="transition-all duration-300 ease-out"
      leave-active-class="transition-all duration-200 ease-in"
      enter-from-class="scale-95 opacity-0"
      enter-to-class="scale-100 opacity-100"
      leave-from-class="scale-100 opacity-100"
      leave-to-class="scale-95 opacity-0"
    >
      <!-- Collapsed Toggle Button -->
      <div
        v-if="isCollapsed"
        key="collapsed"
        class="!bg-primary border border-base-300 rounded-lg shadow-lg p-2 cursor-pointer hover:shadow-xl hover:scale-110 transition-transform duration-200 w-auto inline-block"
        @click="toggleCollapsed"
        title="Mostra Time Machine"
      >
        <Icon icon="fluent-emoji-high-contrast:crystal-ball" class="text-2xl text-base-300" />
      </div>

      <!-- Floating Time Machine Widget -->
      <div
        v-else
        key="expanded"
        class="bg-base-100 border border-base-300 rounded-lg shadow-lg p-3 min-w-64"
      >
        <!-- Header -->
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <Icon icon="mingcute:time-fill" class="!text-primary text-lg" />
            <span class="text-sm font-semibold">Time Machine</span>
          </div>
          <button
            @click="toggleCollapsed"
            class="btn btn-ghost btn-xs text-subtext-0 hover:text-error"
            title="Nascondi Time Machine"
          >
            <Icon icon="mingcute:close-fill" />
          </button>
        </div>

        <!-- Current Time Display -->
        <div class="text-center mb-3">
          <div class="text-xs text-subtext-0 mb-1">
            {{ timeMachine.isVirtualModeEnabled ? 'Tempo Virtuale' : 'Tempo Reale' }}
          </div>
          <div class="font-mono text-base font-bold text-base-content">
            {{
              timeMachine.isVirtualModeEnabled
                ? timeMachine.formattedVirtualTime
                : formattedRealTime
            }}
          </div>
          <div v-if="!timeMachine.isToday" class="text-xs mt-1" :class="daysDifferenceClass">
            {{ daysDifferenceText }}
          </div>
        </div>

        <!-- Controls -->
        <div class="space-y-3 border-t border-base-300 pt-3">
          <!-- Virtual Mode Toggle -->
          <div class="flex items-center justify-between">
            <span class="text-sm">Modalità Virtuale</span>
            <input
              type="checkbox"
              class="toggle toggle-primary toggle-sm"
              v-model="timeMachine.isVirtualModeEnabled"
              @change="onVirtualModeToggle"
            />
          </div>

          <!-- Date Selection (always visible when virtual mode is enabled) -->
          <Transition
            name="virtual-controls"
            enter-active-class="transition-all duration-300 ease-out"
            leave-active-class="transition-all duration-200 ease-in"
            enter-from-class="opacity-0 transform -translate-y-2"
            enter-to-class="opacity-100 transform translate-y-0"
            leave-from-class="opacity-100 transform translate-y-0"
            leave-to-class="opacity-0 transform -translate-y-2"
          >
            <div v-if="timeMachine.isVirtualModeEnabled" class="space-y-3">
              <!-- Date Picker -->
              <!-- <div class="space-y-2"> -->
              <!--   <label class="text-sm font-medium !text-primary">📅 Imposta Data:</label> -->
              <!--   <input -->
              <!--     type="date" -->
              <!--     class="input input-bordered input-sm w-full" -->
              <!--     :value="currentDateString" -->
              <!--     @change="onDateChange" -->
              <!--   /> -->
              <!-- </div> -->

              <!-- Quick Date Jumps -->
              <div class="space-y-2">
                <label class="text-xs text-subtext-0">Salti rapidi:</label>
                <div class="grid grid-cols-2 gap-1">
                  <button @click="jumpDays(-7)" class="btn btn-outline btn-xs">-7 giorni</button>
                  <button @click="jumpDays(7)" class="btn btn-outline btn-xs">+7 giorni</button>
                  <button @click="jumpDays(-1)" class="btn btn-outline btn-xs">-1 giorno</button>
                  <button @click="jumpDays(1)" class="btn btn-outline btn-xs">+1 giorno</button>
                </div>
              </div>

              <!-- Reset to Today -->
              <button @click="resetToToday" class="btn !btn-primary btn-sm w-full">
                <Icon icon="mingcute:calendar-fill" />
                Torna a Oggi
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useTimeMachineStore } from '@/stores/timeMachine'
import { Icon } from '@iconify/vue'
import { useNow } from '@vueuse/core'

export default {
  name: 'TimeMachine',
  components: {
    Icon
  },
  setup() {
    const timeMachine = useTimeMachineStore()
    const isCollapsed = ref(true)
    const showTimeProgression = ref(false)
    const currentDateString = ref('')

    const now = useNow()

    // Update currentDateString when virtual time changes
    watch(
      () => timeMachine.virtualTime,
      (newTime) => {
        const year = newTime.getFullYear()
        const month = String(newTime.getMonth() + 1).padStart(2, '0')
        const day = String(newTime.getDate()).padStart(2, '0')
        currentDateString.value = `${year}-${month}-${day}`
      },
      { immediate: true }
    )

    // Computed properties for display
    const daysDifferenceClass = computed(() => {
      const diff = timeMachine.daysDifference
      if (diff > 0) return '!text-success'
      if (diff < 0) return '!text-error'
      return '!text-warning'
    })

    const daysDifferenceText = computed(() => {
      const diff = timeMachine.daysDifference
      if (diff === 0) return 'Oggi'
      if (diff === 1) return 'Domani'
      if (diff === -1) return 'Ieri'
      if (diff > 1) return `Tra ${diff} giorni`
      return `${Math.abs(diff)} giorni fa`
    })

    // Event handlers
    const toggleCollapsed = () => {
      isCollapsed.value = !isCollapsed.value
    }

    const onVirtualModeToggle = () => {
      if (!timeMachine.isVirtualModeEnabled) {
        timeMachine.disableVirtualMode()
      } else {
        timeMachine.enableVirtualMode()
      }
    }

    const onDateChange = (event) => {
      const selectedDate = new Date(event.target.value + 'T12:00:00')
      timeMachine.jumpToTime(selectedDate)
    }

    const resetToToday = () => {
      timeMachine.jumpToToday()
    }

    // Quick jump functions
    const jumpDays = (days) => {
      timeMachine.addDays(days)
    }

    const jumpHours = (hours) => {
      timeMachine.addHours(hours)
    }

    const jumpMinutes = (minutes) => {
      timeMachine.addMinutes(minutes)
    }

    return {
      timeMachine,
      isCollapsed,
      showTimeProgression,
      currentDateString,
      daysDifferenceClass,
      daysDifferenceText,
      toggleCollapsed,
      onVirtualModeToggle,
      onDateChange,
      resetToToday,
      jumpDays,
      jumpHours,
      jumpMinutes,
      now
    }
  },
  computed: {
    formattedRealTime() {
      return this.now.toLocaleString('it-IT', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
/* Assicurati che il widget sia sempre sopra tutto */
.z-50 {
  z-index: 50;
}

/* Stile per il range slider */
.range::-webkit-slider-thumb {
  background: oklch(var(--p));
}

.range::-moz-range-thumb {
  background: oklch(var(--p));
}

/* Transizione personalizzata unica per evitare conflitti */
.time-machine-enter-active {
  transition: all 0.3s ease-out;
}

.time-machine-leave-active {
  transition: all 0.2s ease-in;
}

.time-machine-enter-from {
  transform: scale(0.95);
  opacity: 0;
}

.time-machine-enter-to {
  transform: scale(1);
  opacity: 1;
}

.time-machine-leave-from {
  transform: scale(1);
  opacity: 1;
}

.time-machine-leave-to {
  transform: scale(0.95);
  opacity: 0;
}

/* Transizione per i controlli virtuali */
.virtual-controls-enter-active,
.virtual-controls-leave-active {
  transition: all 0.3s ease;
}

.virtual-controls-enter-from,
.virtual-controls-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.virtual-controls-enter-to,
.virtual-controls-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
