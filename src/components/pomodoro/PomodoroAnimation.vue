<template>
  <svg class="w-full h-full overflow-visible" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <g class="fill-none stroke-none">
      <circle cx="50%" cy="50%" r="50%" class="stroke-gray-50" />
      <path :class="{ 'd-none': isBreakPhase }" ref="pomodoroProgress" class="progress stroke-red" pathLength="1" d="M 50, 0  
            a 50,50 0 1,1 0,100
            a 50,50 0 1,1 0,-100" />
      <path :class="{ 'd-none': isPomodoroPhase }" ref="breakProgress" class="progress stroke-blue" pathLength="1" d="
              M 50, 0  
              a 50,50 0 1,0 0,100
              a 50,50 0 1,0 0,-100" />
    </g>
  </svg>
</template>

<script>

let animation;

export default {
  props: {
    duration: {
      type: Number,
      required: true
    },
    timer: {
      type: Number,
      required: true
    },
    phase: {
      type: String,
      required: true
    }
  },
  expose: [
    'play',
    'pause',
    'restart'
  ],
  mounted() {
    animation = this.restart()
    animation.currentTime = (this.duration - this.timer) * 1000
    animation.pause()
  },
  methods: {
    async play() {
      await new Promise(r => setTimeout(r, 1000)) // ci mette il timer a ripartire
      animation.play()
    },
    pause() {
      animation.pause()
    },
    restart() {
      if (animation)
        animation.cancel()

      animation = this.progress.animate(this.animationKeyframes, {
        duration: this.duration * 1000,
        direction: "reverse",
      })
      return animation
    }
  },
  computed: {
    progress() {
      return this.isPomodoroPhase ? this.$refs.pomodoroProgress : this.$refs.breakProgress
    },
    isPomodoroPhase() {
      return this.phase === 'pomodoro'
    },
    isBreakPhase() {
      return this.phase === 'break'
    },
    animationKeyframes() {
      if (this.isPomodoroPhase) {
        return {
          stroke: ['red', 'blue'],
          strokeDashoffset: [1, 0],
          easing: 'linear'
        }
      }
      return {
        stroke: ['blue', 'red'],
        strokeDashoffset: [0, 1],
        easing: 'linear'
      }
    }
  },
  watch: {
    'duration'() {
      animation = this.restart()
    }
  }
}

</script>

<style scoped>
path {
  stroke-linecap: round;
  stroke-dasharray: 1;
}

g>* {
  stroke-width: .5rem;
}
</style>
