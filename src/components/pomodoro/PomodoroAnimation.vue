<template>
  <svg
    v-if="widget"
    width="100%"
    height="100%"
    ref="animationElem"
    class="overflow-visible stroke-[.3em] p-[0.15rem]"
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g class="fill-none stroke-none">
      <rect
        vector-effect="non-scaling-stroke"
        width="100"
        height="100"
        class="linecap-round stroke-surface-0/50"
      />
      <polygon
        ref="progress"
        vector-effect="non-scaling-stroke"
        points="50,0 0,0 0,100, 100,100 100,0 50,0"
        class="linecap-round"
        :stroke-dasharray="pathLength"
      ></polygon>
    </g>
  </svg>
  <svg
    v-else
    ref="animationElem"
    class="overflow-visible stroke-surface stroke-[.5em] p-[.25rem]"
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g class="fill-none linecap-round">
      <line
        id="dot"
        x1="50"
        y1="0"
        x2="50"
        y2="0"
        vector-effect="non-scaling-stroke"
        :stroke="breakColor"
        pathLength="1"
      />
      <circle
        cx="50"
        cy="50"
        r="50"
        vector-effect="non-scaling-stroke"
        class="stroke-surface-0/50"
      />
      <circle
        ref="progress"
        vector-effect="non-scaling-stroke"
        class="stroke-primary origin-center -rotate-90"
        cx="50"
        cy="50"
        r="50"
        :stroke-dasharray="pathLength"
      />
    </g>
  </svg>
</template>

<script setup>
import { flavors } from '@catppuccin/palette'
import { usePomodoroStore } from '@/stores/pomodoro'
import { storeToRefs } from 'pinia'
import { computed, onMounted, useTemplateRef, watch } from 'vue'
import { useElementSize, useMounted } from '@vueuse/core'

const pomodoroColor = flavors.macchiato.colors.red.hex
const breakColor = flavors.macchiato.colors.lavender.hex

const isMounted = useMounted()

const { widget } = defineProps({
  widget: {
    type: Boolean,
    default: false
  }
})

/*
 * Actual animation object of WEB Animation API
 */
let animation = null

const { pomodoro, currentConfig } = storeToRefs(usePomodoroStore())

const animationElem = useTemplateRef('animationElem')
const progress = useTemplateRef('progress')
const { width, height } = useElementSize(animationElem, {
  width: 0,
  height: 0
})

/*
 * Used when animation is widget to make the animation responsive
 */
const pathLength = computed(() => {
  const pathLength = widget
    ? (width.value + height.value) * 2
    : (width.value - 2 * convertRemToPixels(0.25)) * Math.PI
  return Math.round(pathLength)
})

// const pomodoroKeyframes = computed(() => [
//   { stroke: pomodoroColor, strokeDashoffset: 0 },
//   { stroke: breakColor, strokeDashoffset: -pathLength.value }
// ])

// const breakKeyframes = computed(() => [
//   { stroke: breakColor, strokeDashoffset: pathLength.value },
//   { stroke: pomodoroColor, strokeDashoffset: 0 }
// ])

const pomodoroKeyframes = computed(() => [
  { stroke: pomodoroColor, strokeDashoffset: 0 },
  { stroke: breakColor, strokeDashoffset: pathLength.value * (widget ? -1 : 1) }
])

const breakKeyframes = computed(() => [
  { stroke: breakColor, strokeDashoffset: pathLength.value * (widget ? 1 : -1) },
  { stroke: pomodoroColor, strokeDashoffset: 0 }
])

const animationOptions = computed(() => ({
  duration: pomodoro.value.initialTimer * 1000,
  fill: 'forwards',
  easing: 'linear'
}))

const currentTime = computed(() => pomodoro.value.initialTimer - pomodoro.value.timer)

onMounted(() => {
  restart()
})

watch([width, height, currentConfig], () => restart())
watch(
  () => pomodoro.value.phase,
  () => restart()
)

watch(currentTime, () => {
  if (!animation) return
  if (pomodoro.value.running) {
    if (animation.playState !== 'running') animation.play()
  } else if (animation.playState !== 'paused') {
    animation.pause()
  }
  animation.currentTime = currentTime.value * 1000
})

watch(
  () => pomodoro.value.running,
  () => {
    if (!animation) return

    if (pomodoro.value.running) {
      animation.currentTime = currentTime.value * 1000
      animation.play()
    } else animation.pause()
  }
)

/* Termina l'animazione in corso (se esiste), e ne fa partire una nuova  */
function restart() {
  if (!isMounted.value) return

  if (animation) {
    animation.cancel()
  }

  const keyframes = new KeyframeEffect(
    progress.value,
    pomodoro.value.phase === 'pomodoro' ? pomodoroKeyframes.value : breakKeyframes.value,
    animationOptions.value
  )

  animation = new Animation(keyframes, document.timeline)
  animation.currentTime = currentTime.value * 1000

  if (pomodoro.value.running) animation.play()
  else animation.pause()
}

function convertRemToPixels(rem) {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize)
}
</script>

<style scoped>
.linecap-round {
  stroke-linecap: round;
}
</style>
