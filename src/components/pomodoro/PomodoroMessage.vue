<template>
  <div class="flex justify-center text-sm sm:text-base md:text-lg lg:text-xl font-semibold">
    <Transition>
      <h2 v-if="!pomodoro.started">Ready to start?</h2>
      <div v-else-if="pomodoro.finished" class="relative text-base sm:text-lg md:text-xl">
        <h2>Session done!</h2>

        <div class="icon-container !top-1 md:!top-px">
          <Icon icon="fluent-emoji-flat:party-popper" inline />
        </div>
      </div>

      <h2 v-else-if="!pomodoro.running">Taking a moment...</h2>

      <div v-else-if="usePomodoroStore().isPomodoroPhase()" class="relative">
        <h2>Deep work!</h2>
        <div class="icon-container">
          <Icon icon="fluent-emoji-flat:tomato" inline />
        </div>
      </div>

      <div v-else-if="usePomodoroStore().isShortBreakPhase()" class="relative">
        <h2>Recharge now.</h2>
        <div class="icon-container">
          <Icon icon="fluent-emoji-flat:teacup-without-handle" inline />
        </div>
      </div>

      <div v-else-if="usePomodoroStore().isLongBreakPhase()" class="relative">
        <h2>Big pause. Enjoy!</h2>
        <div class="icon-container">
          <Icon icon="fluent-emoji-flat:zzz" inline />
        </div>
      </div>
    </Transition>
  </div>
</template>
<script setup>
import { usePomodoroStore } from '@/stores/pomodoro'
import { storeToRefs } from 'pinia'

const { pomodoro } = storeToRefs(usePomodoroStore())
</script>
<style scoped>
.icon-container {
  @apply absolute top-px -left-5 sm:-left-6 md:-left-7 text-base sm:text-xl md:text-2xl;
}

.v-leave-from {
  display: none;
}
</style>
