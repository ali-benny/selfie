<template>
  <svg class="w-full h-full overflow-visible" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <g class="fill-none stroke-none">

      <!-- <circle cx="50" cy="50" r="50" class="stroke-neutral" /> -->
      <line id="dot" x1="50" y1="0" x2="50" y2="0" :stroke="breakColor" class="linecap-round" pathLength="1" />
      <circle id="progress" cx="50" cy="50" r="50" ref="progress" class="linecap-round" pathLength=" 1" />

      <circle cx="50" cy="50" r="50" :stroke="pomodoroColor" :class="['fill-none', { 'hidden': this.phase }]" />
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
      default: flavors.macchiato.colors.lavender.hex
    }
  },
  expose: ['play', 'pause', 'restart', 'reload'],
  mounted() {
    this.reload()
  },
  methods: {
    play() {
      animation.currentTime = (this.duration - this.timer) * 1000
      animation.play()
    },
    pause() {
      animation.pause()
    },
    /* Termina l'animazione in corso (se esiste), e ne fa partire una nuova con la stessa 
     * durata e fase
     */
    restart() {
      if (animation) {
        animation.finish()
      }

      animation = this.progress.animate(this.animationKeyframes(), {
        duration: this.duration * 1000,
        fill: 'forwards'
      })

      return animation
    },
    /* Crea una nuova animazione e aggiorna il tempo della stessa basandosi sul timer.
     * L'animazione non viene fatta partire
     */
    reload() {
      animation = this.restart()
      animation.currentTime = (this.duration - this.timer) * 1000
      animation.pause()
    },
    animationKeyframes() {
      if (this.isPomodoroPhase()) {
        return this.pomodoroKeyframes
      }
      return this.breakKeyframes
    },
    /* true iff phase is unset or phase is pomodoro */
    isPomodoroPhase() {
      return !(this.phase) || this.phase === 'pomodoro'
    }
  },
  computed: {
    progress() {
      return this.$refs.progress
    },
    pomodoroKeyframes() {
      return {
        stroke: [this.pomodoroColor, this.breakColor],
        strokeDashoffset: [0, 1],
        easing: 'linear'
      }
    },
    breakKeyframes() {
      return {
        stroke: [this.breakColor, this.pomodoroColor],
        strokeDashoffset: [-1, 0],
        easing: 'linear'
      }
    }
  },
  watch: {
    'duration'() {
      this.restart()
    },
    'timer'(timer) {
      animation.currentTime = (this.duration - timer) * 1000
    }
  }
}
</script>

<style scoped>
.linecap-round {
  stroke-linecap: round;
}

#progress {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  transform: rotate(-90deg);
  transform-origin: center;
}

g>* {
  stroke-width: 0.3rem;
}
</style>
