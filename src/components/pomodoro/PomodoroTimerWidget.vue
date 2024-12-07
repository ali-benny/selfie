<template>
  <div v-if="isSmallScreen" class="absolute bottom-20 left-0 w-full h-16 flex justify-end">
    <div class="fixed w-fit h-16 z-10 flex justify-end bg-base-200 rounded-l-lg overflow-hidden shadow grow">
      <button @click="() => isWidgetOpen = !isWidgetOpen"
        class="flex flex-col justify-center px-4 text-4xl cursor-pointer">
        <IconPomodoro v-if="pomodoroStore.isPomodoroPhase()" :color="config.color.hex" />
        <Icon v-else-if="pomodoroStore.isShortBreakPhase()" icon="fluent-emoji-flat:teacup-without-handle" />
        <Icon v-else-if="pomodoroStore.isLongBreakPhase()" icon="fluent-emoji-flat:zzz" />
      </button>

      <Transition name="pomo_widget">
        <div class="relative flex justify-center items-center w-52 h-16" v-if="isWidgetOpen">
          <PomodoroAnimation widget />
          <div class="absolute w-full h-full flex items-center  gap-2 px-3">
            <div class="flex justify-center items-center  grow">
              <span class="align-baseline pt-2 digital select-none text-5xl">
                {{ pomodoroStore.timer }}
              </span>
            </div>
            <div class="flex items-center gap-1">
              <button v-if="pomodoro.running" @click="pomodoroStore.pausePomodoroTimer()"
                class="text-2xl hover:text-accent">
                <Icon icon="mingcute:pause-fill" inline />
              </button>
              <button v-else @click="pomodoroStore.playPomodoroTimer()" class="text-2xl hover:text-accent">
                <Icon icon="mingcute:play-fill" inline />
              </button>
              <button v-if="pomodoro?.started" :disabled="!pomodoro.running" @click="pomodoroStore.skipPomodoroPhase()"
                class="transition text-lg hover:text-success disabled:text-base-content/20">
                <Icon icon="mingcute:fast-forward-fill" inline />
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
  <div v-else class="fixed bottom-0 left-0 w-screen h-16 z-10 bg-base-200">
    <div class="w-full h-full static flex justify-center items-center">
      <PomodoroAnimation widget />


      <div class="absolute flex justify-center items-center top-0 left-0 w-full h-full p-3">
        <div class="flex justify-center w-12 text-4xl">
          <IconPomodoro v-if="pomodoroStore.isPomodoroPhase()" :color="config.color.hex" />
          <Icon v-else-if="pomodoroStore.isShortBreakPhase()" icon="fluent-emoji-flat:teacup-without-handle" />
          <Icon v-else-if="pomodoroStore.isLongBreakPhase()" icon="fluent-emoji-flat:zzz" />
        </div>
        <div class="flex justify-center items-end digital select-none text-5xl grow ">
          <div class="pt-2">
            {{ pomodoroStore.timer }}
          </div>
        </div>
        <div class="w-12 flex items-center gap-2">
          <button v-if="pomodoro.running" @click="pomodoroStore.pausePomodoroTimer()"
            class="text-2xl hover:text-accent">
            <Icon icon="mingcute:pause-fill" inline />
          </button>
          <button v-else @click="pomodoroStore.playPomodoroTimer()" class="text-2xl hover:text-accent">
            <Icon icon="mingcute:play-fill" inline />
          </button>
          <button v-if="pomodoro.started" :disabled="!pomodoro.running" @click="pomodoroStore.skipPomodoroPhase()"
            class="transition text-lg hover:text-success disabled:text-base-content/20">
            <Icon icon="mingcute:fast-forward-fill" inline />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { usePomodoroStore } from '@/stores/pomodoro.js'
import { storeToRefs } from 'pinia';
import PomodoroAnimation from './PomodoroAnimation.vue';
import { useScreens } from '@/stores/screens';
import IconPomodoro from '../icons/IconPomodoro.vue';

const pomodoroStore = usePomodoroStore()
const isWidgetOpen = ref(false)

const { isSmallScreen } = storeToRefs(useScreens())

const { pomodoro, currentConfig: config } = storeToRefs(pomodoroStore)

</script>

<style scoped>
.digital {
  font-family: Digital-7;
}

.running {
  color: v-bind('config.color.hex') !important;
}

.pomo_widget-enter-active,
.pomo_widget-leave-active {
  transition: all .5s ease-in;
}

.pomo_widget-enter-to,
.pomo_widget-leave-from {
  @apply w-48 opacity-100 w-48
}

.pomo_widget-enter-from,
.pomo_widget-leave-to {
  @apply w-0 opacity-0 w-0
}
</style>
