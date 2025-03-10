<template>
  <div>
    <div class="w-full h-full flex flex-col items-stretch gap-10">

      <!--- Pomodoro Timer -->
      <div id="timer-container" class="grow pt-10" :class="{ 'flex-animation': !showConfigList }">
        <PomodoroTimer />
      </div>

      <!-- Pomodoro configs -->
      <Transition :duration="2000" name="config-fade">
        <div class="flex flex-col items-stretch gap-2 pb-4" v-if="showConfigList">
          <div class="flex justify-between items-center">
            <h2 class="font-bold text-lg">
              Your saved focuses
            </h2>

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
  </div>

</template>

<script setup>
import PomodoroConfigForm from '@/components/pomodoro/PomodoroConfigForm.vue';
import PomodoroConfigList from '@/components/pomodoro/PomodoroConfigList.vue';
import PomodoroTimer from '@/components/pomodoro/PomodoroTimer.vue';
import { usePomodoroStore } from '@/stores/pomodoro';
import { computed } from 'vue';

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

.flex-animation {
  animation-name: flex-grow;
  animation-delay: 250ms;
  animation-duration: 1s;
  animation-fill-mode: forwards;
}

@keyframes flex-grow {
  100% {
    grow: 1
  }
}
</style>
