<template>
  <div class="w-full max-w-60 sm:max-w-80 flex flex-col items-center gap-4">
    <div class="@container relative w-full flex justify-center items-center">
      <div
        class="absolute w-full h-full top-0 r-0 flex justify-center items-center text-4xl @[16rem]:text-5xl @[18rem]:text-6xl @xs:text-7xl digital select-none"
      >
        {{ pomodoroStore.timer }}
      </div>

      <PomodoroAnimation />
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
  </div>
</template>

<script setup>
import { usePomodoroStore } from '@/stores/pomodoro.js'
import { storeToRefs } from 'pinia'
import PomodoroAnimation from './PomodoroAnimation.vue'

const pomodoroStore = usePomodoroStore()
const { pomodoro } = storeToRefs(pomodoroStore)
</script>

<style scoped>
.digital {
  font-family: Digital-7;
}
</style>
