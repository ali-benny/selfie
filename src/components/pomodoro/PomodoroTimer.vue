<template>
  <div class="timer-container w-full max-w-64 sm:max-w-80">
    <div class="flex flex-col items-center gap-3">
      <div ref="timerContainer" class="relative w-full flex justify-center items-center">
        <div
          class="absolute w-full h-full top-0 left-0 flex justify-center items-center select-none"
        >
          <div class="timer-clock relative">
            <div class="digital">{{ pomodoroStore.timer }}</div>
            <div
              v-if="currentConfig.cycles"
              class="timer-cycles absolute text-neutral w-full flex justify-center"
            >
              {{ pomodoro.cycle }} / {{ currentConfig.cycles }}
            </div>
          </div>
        </div>

        <PomodoroAnimation :width="width" />
      </div>
      <div class="timer-controls w-full flex justify-evenly gap-2">
        <button
          v-if="pomodoro.started"
          :disabled="!pomodoro.running"
          @click="pomodoroStore.restartPomodoroPhase()"
          class="transition text-neutral hover:text-base-content disabled:text-base-content/20"
          title="Restart timer"
        >
          <Icon icon="mingcute:back-fill" />
        </button>
        <div class="timer-controls_player flex flex-col items-center font-bold">
          <button
            v-if="pomodoro.running"
            @click="pomodoroStore.pausePomodoroTimer()"
            title="Pause Pomodoro"
          >
            <Icon icon="mingcute:pause-fill" />
          </button>
          <button v-else @click="pomodoroStore.playPomodoroTimer()" title="Play Pomodoro">
            <Icon icon="mingcute:play-fill" />
          </button>
        </div>
        <button
          v-if="pomodoro.started"
          :disabled="!pomodoro.running"
          @click="pomodoroStore.skipPomodoroPhase()"
          class="transition text-neutral hover:text-base-content disabled:text-base-content/20"
          title="Skip to next phase"
        >
          <Icon icon="mingcute:fast-forward-fill" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { usePomodoroStore } from '@/stores/pomodoro.js'
import { storeToRefs } from 'pinia'
import PomodoroAnimation from './PomodoroAnimation.vue'
import { useElementSize } from '@vueuse/core'
import { useTemplateRef } from 'vue'

const pomodoroStore = usePomodoroStore()
const { pomodoro, currentConfig } = storeToRefs(pomodoroStore)

const { width } = useElementSize(useTemplateRef('timerContainer'))
</script>

<style lang="postcss" scoped>
.digital {
  font-family: Digital-7;
}

/*
 * Responsive timer font size based on timer element dimension
 */
.timer-container {
  container: timer / inline-size;
}
.timer-clock {
  @apply text-2xl;
}
.timer-cycles {
  @apply text-xs;
}
.timer-controls button {
  @apply text-base;
}
.timer-controls_player button {
  @apply text-xl;
}
@container timer (width > 8rem) {
  .timer-clock {
    @apply text-3xl;
  }
  .timer-controls button {
    @apply text-lg;
  }
  .timer-controls_player button {
    @apply text-2xl;
  }
}
@container timer (width > 10rem) {
  .timer-container > div {
    @apply gap-4;
  }
  .timer-clock {
    @apply text-4xl;
  }
  .timer-cycles {
    @apply text-sm;
  }
  .timer-controls button {
    @apply text-xl;
  }
  .timer-controls_player button {
    @apply text-3xl;
  }
}
@container timer (width > 12rem) {
  .timer-clock {
    @apply text-5xl;
  }

  .timer-controls button {
    @apply text-2xl;
  }
  .timer-controls_player button {
    @apply text-4xl;
  }
}
@container timer (width > 14rem) {
  .timer-container > div {
    @apply gap-5;
  }
  .timer-clock {
    @apply text-6xl;
  }
  .timer-cycles {
    @apply text-base;
  }
  .timer-controls button {
    @apply text-3xl;
  }
  .timer-controls_player button {
    @apply text-5xl;
  }
}
@container timer (width > 16rem) {
  .timer-container > div {
    @apply gap-6;
  }
  .timer-clock {
    @apply text-7xl;
  }
}
</style>
