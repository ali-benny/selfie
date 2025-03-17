<template>
  <div class="w-full h-full flex flex-col items-stretch gap-10 pt-10">
    <!--- Pomodoro Timer -->
    <div class="grow" :class="{ 'flex-animation': !showConfigList }">
      <div class="flex justify-center items-center">
        <div
          class="timer-container relative w-3/4 sm:w-2/3 flex justify-center bg-transparent transition-colors duration-1000 rounded-box border-4 border-transparent shadow-xl shadow-transparent p-8"
          :class="{ running: pomodoro.running }"
        >
          <PomodoroTimer />

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

          <YTPlayer class="absolute top-3 left-3">
            <template #trigger>
              <button>
                <Icon icon="fluent:music-note-2-play-20-filled" class="text-xl" />
              </button>
            </template>
          </YTPlayer>
        </div>
      </div>
    </div>

    <!-- Pomodoro configs -->
    <Transition :duration="2000" name="config-fade">
      <div class="flex flex-col items-stretch gap-2 pb-4" v-if="showConfigList">
        <div class="flex justify-between items-center">
          <h2 class="font-bold text-lg">Your saved focuses</h2>

          <PomodoroConfigForm>
            <template #trigger>
              <button class="btn btn-sm btn-accent" :disabled="!showConfigList">
                New focus
                <Icon icon="fluent:new-24-regular" class="text-xl" />
              </button>
            </template>
          </PomodoroConfigForm>
        </div>

        <PomodoroConfigList />
      </div>
    </Transition>
  </div>
</template>

<script setup>
import PomodoroConfigForm from '@/components/pomodoro/PomodoroConfigForm.vue'
import PomodoroConfigInfo from '@/components/pomodoro/PomodoroConfigInfo.vue'
import PomodoroConfigList from '@/components/pomodoro/PomodoroConfigList.vue'
import PomodoroTimer from '@/components/pomodoro/PomodoroTimer.vue'
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { usePomodoroStore } from '@/stores/pomodoro'
import YTPlayer from '@/components/pomodoro/YTPlayer.vue'

const pomodoroStore = usePomodoroStore()
const { pomodoro, currentConfig: config } = storeToRefs(pomodoroStore)

const showConfigList = computed(() => !usePomodoroStore().pomodoro.running)
</script>

<style scoped>
.config-fade-enter-from,
.config-fade-leave-to {
  opacity: 0 !important;
}

.config-fade-enter-to,
.config-fade-leave-from {
  flex-grow: 0.001;
}

.config-fade-enter-active,
.config-fade-leave-active {
  transition: opacity 1s ease;
}

@keyframes flex-grow {
  100% {
    grow: 1;
  }
}

.flex-animation {
  animation-name: flex-grow;
  animation-delay: 250ms;
  animation-duration: 1s;
  animation-fill-mode: forwards;
}

.timer-container.running {
  transition-delay: 250ms;
  transition-property: background-color, border-color, box-shadow;
  transition-duration: 1s;
  transition-timing-function: ease-in-out;

  @apply !bg-base-200;
  border-color: v-bind('config?.color.hex') !important;
  --tw-shadow-color: v-bind('config?.color.hex') !important;
}
</style>
