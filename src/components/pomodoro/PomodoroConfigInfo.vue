<template>
  <div class="flex flex-col items-stretch gap-1">
    <div class="flex items-center gap-2">
      <Icon
        icon="fluent-emoji-flat:tomato"
        inline
        class="text-xl"
        title="Focus phase duration in minutes."
        role="img"
        aria-label="[title]"
      />
      <p class="m-0">{{ config.pomodoroTime }}'</p>
    </div>
    <div class="flex items-center gap-2">
      <Icon
        icon="fluent-emoji-flat:teacup-without-handle"
        inline
        class="text-xl"
        title="Short break duration in minutes."
      />
      <p class="m-0">{{ config.shortBreakTime }}'</p>
    </div>
    <div class="flex items-center gap-2" v-if="hasLongBreak">
      <Icon icon="fluent-emoji-flat:zzz" class="text-xl" title="Long break duratio in minutes." />
      <p class="m-0">
        {{ config.longBreak.time }}'<span class="text-black-50">
          every {{ config.longBreak.interval }} breaks</span
        >
      </p>
    </div>
    <div class="flex items-center gap-2" v-if="config.cycles">
      <Icon
        icon="fluent-emoji-flat:counterclockwise-arrows-button"
        inline
        class="text-xl"
        title="Number of cycles."
      />
      <p class="m-0">{{ config.cycles }} <span class="text-black-50">cycles</span></p>
    </div>
    <div class="flex items-center gap-2" v-if="duration !== Infinity">
      <Icon
        icon="fluent-emoji-flat:three-oclock"
        inline
        class="text-xl"
        title="Total focus duration."
      />
      <p class="m-0">{{ formattedDuration }}</p>
    </div>
  </div>
</template>
<script setup>
import { usePomodoroStore } from '@/stores/pomodoro'
import { computed, ref, watch } from 'vue'

const { config } = defineProps({
  config: {
    type: Object,
    required: true
  }
})

const durationFormat = ref(config.durationFormat || usePomodoroStore().preferredDurationFormat)

watch(
  () => config.durationFormat,
  () => (durationFormat.value = config.durationFormat)
)

const duration = computed(() => usePomodoroStore().computeConfigDuration(config))

const hasLongBreak = computed(() => {
  if (!config.longBreak) return false
  return config.longBreak.time && config.longBreak.interval
})

const formattedDuration = computed(() =>
  usePomodoroStore().formatDuration(duration.value, durationFormat.value)
)
</script>
