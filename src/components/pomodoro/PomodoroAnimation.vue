<template>
  <svg class="w-full h-full overflow-visible" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <g class="fill-none stroke-none">
      <circle cx="50" cy="50" r="50" class="stroke-neutral" />

      <line id="dot" x1="50" y1="0" x2="50" y2="0" :stroke="breakColor" pathLength="1" />
      <circle id="progress" cx="50" cy="50" r="50" ref="progress" :stroke="color" pathLength="1" />
    </g>
  </svg>
</template>

<script>
import { flavors } from '@catppuccin/palette'
let animation

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
      default: 'pomodoro'
    },
    pomodoroColor: {
      type: String,
      default: flavors.macchiato.colors.red.hex
    },
    breakColor: {
      type: String,
      default: flavors.macchiato.colors.blue.hex
    }
  },
  data() {
    return {
      anim: Object
    }
  },
  expose: ['play', 'pause', 'restart'],
  mounted() {
    animation = this.restart()
    animation.currentTime = (this.duration - this.timer) * 1000
    animation.pause()
  },
  methods: {
    async play() {
      animation.currentTime = (this.duration - this.timer) * 1000
      animation.play()
    },
    pause() {
      animation.pause()
    },
    restart() {
      if (animation) {
        animation.finish()
        animation = null
      }

      animation = this.progress.animate(this.animationKeyframes(), {
        duration: this.duration * 1000,
        fill: 'forwards'
      })

      this.anim = animation
      return animation
    },
    animationKeyframes() {
      if (this.isPomodoroPhase()) {
        return {
          stroke: [this.pomodoroColor, this.breakColor],
          strokeDashoffset: [0, 1],
          easing: 'linear'
        }
      }
      return {
        stroke: [this.breakColor, this.pomodoroColor],
        strokeDashoffset: [-1, 0],
        easing: 'linear'
      }
    },
    isPomodoroPhase() {
      return this.phase === 'pomodoro'
    }
  },
  computed: {
    progress() {
      return this.$refs.progress
    },
    color() {
      if (this.isPomodoroPhase)
        return this.pomodoroColor
      return this.breakColor
    }
  },
  watch: {
    'phase'(oldPhase, newPhase) {
      if (oldPhase && newPhase) {
        this.restart()
      }
    },
    'timer'(timer) {
      animation.currentTime = (this.duration - timer) * 1000
    }
  }
}
</script>

<style scoped>
#progress {
  stroke-linecap: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  transform: rotate(-90deg);
  transform-origin: center;
}

#dot {
  stroke-dasharray: 1;
  stroke-dashoffset: -.999;
  stroke-linecap: round;
}

g>* {
  stroke-width: 0.4rem;
}
</style>
