<template>
  <div class="w-full h-full">
    <svg v-if="widget" width="100%" height="100%" ref="animationElem" class="overflow-hidden stroke-[.6em]"
      viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <g class="fill-none stroke-none">
        <line id="dot" x1="50" y1="0" x2="50" y2="0" vector-effect="non-scaling-stroke" :stroke="breakColor"
          class="linecap-round" />
        <rect vector-effect="non-scaling-stroke" width="100" height="100" class="linecap-round stroke-surface-0/50" />
        <polygon ref="progress" vector-effect="non-scaling-stroke" points="50,0 0,0 0,100, 100,100 100,0 50,0"
          class="linecap-round" :stroke-dasharray="progressPathLength">
        </polygon>
      </g>
    </svg>
    <svg v-else class="overflow-visible stroke-surface stroke-[.3em]" viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg">
      <g class="fill-none linecap-round">
        <line id="dot" x1="50" y1="0" x2="50" y2="0" :stroke="breakColor" pathLength="1" />
        <circle cx="50" cy="50" r="50" class="stroke-surface-0/50" />
        <circle ref="progress" class="origin-center -rotate-90" cx="50" cy="50" r="50" pathLength="1"
          stroke-dasharray="1" />
      </g>
    </svg>
  </div>
</template>

<script setup>
import { flavors } from '@catppuccin/palette'
import { usePomodoroStore } from '@/stores/pomodoro';
import { storeToRefs } from 'pinia';
import { computed, onMounted, reactive, useTemplateRef, watch } from 'vue';
import { useElementSize, useMounted } from '@vueuse/core';

const pomodoroColor = flavors.macchiato.colors.red.hex
const breakColor = flavors.macchiato.colors.lavender.hex

const isMounted = useMounted()
/*
 * Actual animation object of WEB Animation API
 */
let animation = null

const pomodoroStore = usePomodoroStore()
const { pomodoro, currentConfig } = storeToRefs(pomodoroStore)

const animationElem = useTemplateRef('animationElem')
const animationSize = reactive(useElementSize(animationElem, { width: 0, height: 0 }))

const progress = useTemplateRef('progress')

const pomodoroDashoffset = computed(() => widget ? [0, -progressPathLength.value] : [0, 1])
const breakDashoffset = computed(() => widget ? [progressPathLength.value, 0] : [-1, 0])

const pomodoroKeyframes = computed(() => {
  return {
    stroke: [pomodoroColor, breakColor],
    strokeDashoffset: pomodoroDashoffset.value,
    easing: 'linear'
  }
})

const breakKeyframes = computed(() => {
  return {
    stroke: [breakColor, pomodoroColor],
    strokeDashoffset: breakDashoffset.value,
    easing: 'linear'
  }
})

const animationKeyframes = computed(() => {
  if (pomodoro.value.phase === 'pomodoro') {
    return pomodoroKeyframes.value
  }
  return breakKeyframes.value
})

const currentTime = computed(() => pomodoro.value.initialTimer - pomodoro.value.timer)

const { widget } = defineProps({
  widget: {
    type: Boolean,
    default: false
  }
})

onMounted(() => restart())

watch([() => currentConfig.value._id, () => pomodoro.value.phase], () => restart())


watch(() => currentTime.value, () => {
  if (!animation) return
  if (pomodoro.value.running) {
    if (animation.playState !== 'running')
      animation.play()
  } else if (animation.playState !== 'paused') {
    animation.pause()
  }
  animation.currentTime = currentTime.value * 1000
})

watch(() => pomodoro.value.running, () => {
  if (!animation) return

  if (pomodoro.value.running) {
    animation.currentTime = currentTime.value * 1000
    animation.play()
  } else
    animation.pause()
})

watch(() => animationSize.width, () => { if (widget) restart() })

/* Termina l'animazione in corso (se esiste), e ne fa partire una nuova  */
function restart() {
  if (!isMounted.value) return

  if (animation) {
    animation.cancel()
  }

  animation = progress.value.animate(animationKeyframes.value, {
    duration: pomodoro.value.initialTimer * 1000,
    fill: 'forwards'
  })

  animation.currentTime = currentTime.value * 1000

  if (pomodoro.value.running) animation.play()
  else animation.pause()
}

/*
 * Used when animation is widget to make the animation responsive
 */
const progressPathLength = computed(() => (animationSize.width + animationSize.height) * 2)
</script>

<style scoped>
.linecap-round {
  stroke-linecap: round;
}
</style>
