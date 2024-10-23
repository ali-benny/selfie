<template>
  <div class="w-100 h-100 flex flex-col justify-center" v-if="this.pomodoro">
    <div class="w-100 h-min flex flex-col items-center justify-center gap-y-5">
      <div class="self-stretch flex flex-row justify-evenly lg:justify-center flex-wrap gap-x-4 lg:gap-x-32 gap-y-4">
        <div class="flex flex-col items-center gap-y-1">
          <p class="m-0 font-medium leading-4">Pomodoro</p>
          <p class="m-0 leading-4">{{ pomodoroTime }}</p>
        </div>
        <div class="flex flex-col items-center gap-y-1">
          <p class="m-0 font-medium leading-4">Pausa breve</p>
          <p class="m-0 leading-4">{{ shortBreakTime }}</p>
        </div>
        <div class="flex flex-col items-center gap-y-1">
          <p class="m-0 font-medium leading-4">Pausa lunga</p>
          <p class="m-0 leading-4">{{ longBreakTime }}</p>
        </div>
      </div>

      <div class="h-80 w-80 relative flex flex-col justify-center items-center">
        <div class="absolute">
          <PomodoroAnimation :duration="pomodoro.initialTimer" :timer="pomodoro.timer" :phase="pomodoro.phase"
            ref="animation" />
        </div>

        <p class="digital select-none text-7xl m-0 leading-4">
          {{ timer }}
        </p>
      </div>
      <div :class="['grid', pomodoro.started ? 'grid-cols-3' : '']">
        <button v-if="pomodoro.started" @click="this.restart()" class="text-sm btn btn-xs btn-outline btn-error">
          Reset
        </button>
        <div class="flex flex-col items-center">
          <button v-if="pomodoro.running" @click="this.pause()" class="text-2xl hover:text-success">
            <Icon icon="mingcute:pause-fill" />
          </button>
          <button v-else @click="this.play()" class="text-2xl hover:text-success">
            <Icon icon="mingcute:play-fill" />
          </button>
        </div>
        <button v-if="pomodoro.started" @click="this.skip()" class="text-xl hover:text-success mx-3">
          <Icon icon="mingcute:fast-forward-fill" />
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import PomodoroAnimation from './PomodoroAnimation.vue'
import {
  defaultConfig,
  loadPomodoro,
  deletePomodoro,
  createPomodoro,
  loadLatestConfig
} from '../../router/pomodoro/pomodoro.js'

export default {
  emits: ['play', 'pause', 'finish'],
  expose: ['replacePomodoro'],
  data() {
    return {
      pomodoro: null
    }
  },
  async created() {
    this.pomodoro = await loadPomodoro()
    if (this.pomodoro == null) {
      let config = (await loadLatestConfig()) || defaultConfig
      this.pomodoro = await createPomodoro(config)
    }

    this.pomodoro.running = false
  },
  methods: {
    play() {
      this.pomodoro.play()
      this.animation.play()
      this.$emit('play')
    },
    pause() {
      this.pomodoro.pause()
      this.animation.pause()
      this.$emit('pause')
    },
    restart() {
      this.pomodoro.restart()
      this.animation.restart()
    },
    skip() {
      this.pomodoro.skip()
      this.animation.restart()
    },
    async replacePomodoro(config) {
      if (this.pomodoro) {
        await deletePomodoro(this.pomodoro)
      }
      this.pomodoro = await createPomodoro(config)
      this.animation.reload()
    },
    formatClockTime(time) {
      if (!time) return '00:00'
      let minutes = Math.floor(time / 60)
      let seconds = time % 60
      return (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds
    },
    formatConfigTime(time) {
      if (!time) return '0 min.'
      return time + ' min.'
    }
  },
  watch: {
    'pomodoro.finished'(finished) {
      if (finished) {
        this.$emit('finish')
      }
    }
  },
  computed: {
    timer() {
      return this.formatClockTime(this.pomodoro?.timer)
    },
    pomodoroTime() {
      return this.formatConfigTime(this.pomodoro?.config.pomodoroTime)
    },
    shortBreakTime() {
      return this.formatConfigTime(this.pomodoro?.config.shortBreakTime)
    },
    longBreakTime() {
      return this.formatConfigTime(this.pomodoro?.config.longBreakTime)
    },
    animation() {
      return this.$refs.animation
    },
    message() {
      if (!this.pomodoro.started) {
        return 'Start pomodoro now!'
      }
      if (this.pomodoro.finished) {
        return 'Good job!'
      }
      return this.pomodoro.message()
    }
  },
  components: {
    PomodoroAnimation
  }
}
</script>
<style scoped>
.digital {
  font-family: Digital-7;
}
</style>
