<template>
  <svg
    width="100%"
    height="100%"
    class="overflow-visible"
    :class="[widget ? 'stroke-[.3rem] p-[.15rem]' : 'stroke-[.5rem] p-[.25rem]']"
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g v-if="widget" class="fill-none stroke-none">
      <rect
        vector-effect="non-scaling-stroke"
        width="100"
        height="100"
        class="linecap-round stroke-surface-0/50"
      />
      <polygon
        ref="progress"
        vector-effect="non-scaling-stroke"
        points="50,0 100,0 100,100, 0,100 0,0 50,0"
        class="linecap-round"
        :stroke-dasharray="pathLength"
      ></polygon>
    </g>

    <g v-else class="fill-none linecap-round">
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

const pomodoroColor = flavors.macchiato.colors.red.hex
const breakColor = flavors.macchiato.colors.lavender.hex

/*
 * NOTE: (Leo) devo passare width e height come props perché se le prendo usando
 * useElementSize sull'svg (o qualsias elemento che lo contiene), queste si
 * non si aggiornano quando il timer è dentro a swapy.
 * È un bug strano, si aggiornano allow swap successivo, ho fatto mille prova, ma
 * non ho capito se è un bug di swapy (perché in altre pagine l'animazione è responsive),
 * useElementSize (ho provato anche a prendere le dimensioni in vanilla js, ma niente),
 * o altro.
 * Questa soluzione non mi fa impazzire ma al memento non intendo spenderci ulteriore tempo.
 */
const { widget, width, height } = defineProps({
  widget: {
    type: Boolean,
    default: false
  },
  width: {
    type: Number,
    default: 0
  },
  height: {
    type: Number,
    default: 0
  }
})

/*
 * Actual animation object of WEB Animation API
 */
let animation = null

const { pomodoro, currentConfig } = storeToRefs(usePomodoroStore())

const progress = useTemplateRef('progress')

/* Usato per rendere responsive l'animazione
 */
const pathLength = computed(() => {
  //  devo togliere il padding dalla width
  return Math.round(
    widget
      ? (width + height - 4 * convertRemToPixels(0.15)) * 2
      : (width - 2 * convertRemToPixels(0.25)) * Math.PI
  )
})

const pomodoroKeyframes = computed(() => [
  { stroke: pomodoroColor, strokeDashoffset: 0 },
  { stroke: breakColor, strokeDashoffset: pathLength.value }
])

const breakKeyframes = computed(() => [
  { stroke: breakColor, strokeDashoffset: -pathLength.value },
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

watch([() => pomodoro.value.phase, () => width, () => height, currentConfig], () => restart())

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
  // if (!isMounted.value) return
  if (animation) animation.cancel()

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
