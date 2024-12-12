<template>
  <div class="flex flex-col items-stretch gap-1">
    <div class="flex items-center gap-2">
      <Icon icon="fluent-emoji-flat:tomato" inline class="text-xl" title="Focus phase duration in minutes." role="img"
        aria-label="[title]" />
      <p class="m-0">{{ config.pomodoroTime }}'</p>
    </div>
    <div class="flex items-center gap-2">
      <Icon icon="fluent-emoji-flat:teacup-without-handle" inline class="text-xl"
        title="Short break duration in minutes." />
      <p class="m-0">{{ config.shortBreakTime }}'</p>
    </div>
    <div class="flex items-center gap-2" v-if="config.longBreak">
      <Icon icon="fluent-emoji-flat:zzz" class="text-xl" title="Long break duratio in minutes." />
      <p class="m-0">
        {{ config.longBreak.time }}'<span class="text-black-50">
          every {{ config.longBreak.interval }} breaks</span>
      </p>
    </div>
    <div class="flex items-center gap-2" v-if="config.cycles">
      <Icon icon="fluent-emoji-flat:counterclockwise-arrows-button" inline class="text-xl" title="Number of cycles." />
      <p class="m-0">{{ config.cycles }} <span class="text-black-50">cycles</span></p>
    </div>
    <h5 class="font-medium flex items-center" v-if="duration !== Infinity">
      <Icon icon="fluent-emoji-flat:three-oclock" inline class="text-xl" title="Total focus duration." />
      <p class="m-0">{{ duration }}<span class="text-sm"> minutes</span>
      </p>
    </h5>
  </div>
</template>
<script setup>
import { computed } from 'vue'

const { config } = defineProps({
  config: {
    type: Object,
    required: true
  }
})

const duration = computed(() => {
  if (!config.cycles) {
    return Infinity
  }
  let c = 0
  let l = 0
  let duration = 0
  while (c < config.cycles) {
    c++
    duration += config.pomodoroTime
    if (!config.longBreak) {
      duration += config.shortBreakTime
      continue
    }

    if (l == config.longBreak.interval) {
      duration += config.longBreak.time
      l = 0
    } else {
      duration += config.shortBreakTime
      l++
    }
  }
  return duration
})

</script>
