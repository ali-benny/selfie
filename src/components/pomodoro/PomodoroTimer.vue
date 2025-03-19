<template>
  <div class="h-full flex justify-center items-center">
    <div
      class="timer-container min-w-96 sm:w-2/3 lg:w-1/2 h-max relative flex flex-col items-center bg-transparent transition-colors duration-1000 rounded-box border-4 border-transparent shadow-xl shadow-transparent gap-6 py-8 z-20"
      :class="{ running: pomodoro.running }"
    >
      <div class="h-60 w-60 sm:w-80 sm:h-80 relative flex justify-center items-center">
        <div class="absolute w-full h-full">
          <PomodoroAnimation />
        </div>
        <div class="pt-2 digital select-none text-7xl m-0">
          {{ pomodoroStore.timer }}
        </div>
      </div>
      <div class="grid items-center" :class="pomodoro.started ? 'grid-cols-3' : ''">
        <button
          v-if="pomodoro.started"
          :disabled="!pomodoro.running"
          @click="pomodoroStore.restartPomodoroPhase()"
          class="text-sm btn btn-xs btn-outline btn-error"
        >
          Reset
        </button>
        <div class="flex flex-col items-center">
          <button
            v-if="pomodoro.running"
            @click="pomodoroStore.pausePomodoroTimer()"
            class="text-4xl hover:text-success"
          >
            <Icon icon="mingcute:pause-fill" />
          </button>
          <button
            v-else
            @click="pomodoroStore.playPomodoroTimer()"
            class="text-4xl hover:text-success"
          >
            <Icon icon="mingcute:play-fill" />
          </button>
        </div>
        <button
          v-if="pomodoro.started"
          :disabled="!pomodoro.running"
          @click="pomodoroStore.skipPomodoroPhase()"
          class="transition text-xl hover:text-success mx-3 disabled:text-base-content/20"
        >
          <Icon icon="mingcute:fast-forward-fill" />
        </button>
      </div>

      <Popper class="absolute top-3 right-3" placement="bottom" arrow locked>
        <button>
          <Icon icon="fluent:info-24-regular" class="text-lg" />
        </button>
        <template #content>
          <div class="w-52 p-3 flex flex-col gap-1 text-sm">
            <h5 class="font-bold mb-1">Current focus</h5>
            <PomodoroConfigInfo :config="config" />
          </div>
        </template>
      </Popper>
    </div>
  </div>
</template>

<script setup>
import { usePomodoroStore } from '@/stores/pomodoro.js'
import { storeToRefs } from 'pinia'
import PomodoroAnimation from './PomodoroAnimation.vue'
import PomodoroConfigInfo from './PomodoroConfigInfo.vue'

const pomodoroStore = usePomodoroStore()
const { pomodoro, currentConfig: config } = storeToRefs(pomodoroStore)
</script>
<style scoped>
.timer-container.running {
  transition-delay: 250ms;
  transition-property: background-color, border-color, box-shadow;
  transition-duration: 1s;
  transition-timing-function: ease-in-out;

  @apply !bg-base-200;
  border-color: v-bind('config?.color.hex') !important;
  --tw-shadow-color: v-bind('config?.color.hex') !important;
}

.digital {
  font-family: Digital-7;
}
</style>
