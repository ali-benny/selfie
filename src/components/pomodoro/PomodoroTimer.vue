<template>
  <div class="w-100 h-100 relative flex flex-col justify-center" v-if="this.pomodoro">
    <div class="w-100 h-min">
      <div class="w-full flex flex-col items-center gap-4">
        <div class="h-60 w-60 sm:w-80 sm:h-80 relative flex justify-center items-center">
          <div class="absolute">
            <PomodoroAnimation
              :duration="pomodoro.initialTimer"
              :timer="pomodoro.timer"
              :phase="pomodoro.phase"
              ref="animation"
            />
          </div>

          <div class="digital select-none text-7xl m-0">
            {{ timer }}
          </div>
        </div>
        <div :class="['grid', pomodoro.started ? 'grid-cols-3' : '']">
          <button
            v-if="pomodoro.started"
            @click="this.restart()"
            class="text-sm btn btn-xs btn-outline btn-error"
          >
            Reset
          </button>
          <div class="flex flex-col items-center">
            <button
              v-if="pomodoro.running"
              @click="this.pause()"
              class="text-2xl hover:text-success"
            >
              <Icon icon="mingcute:pause-fill" />
            </button>
            <button v-else @click="this.play()" class="text-2xl hover:text-success">
              <Icon icon="mingcute:play-fill" />
            </button>
          </div>
          <button
            v-if="pomodoro.started"
            @click="this.skip()"
            class="text-xl hover:text-success mx-3"
          >
            <Icon icon="mingcute:fast-forward-fill" />
          </button>
        </div>
      </div>

      <Popper class="absolute top-2 right-2" placement="bottom" arrow locked>
        <button>
          <Icon icon="fluent:info-24-regular" />
        </button>
        <template #content>
          <div class="w-52 p-3 flex flex-col gap-1 text-sm">
            <h5 class="font-bold mb-1">Current focus</h5>
            <div class="flex gap-1">
              <p class="m-0 font-semibold">Name:</p>
              <p class="m-0">{{ this.pomodoro.config.name }}</p>
            </div>

            <div class="flex flex-wrap gap-x-4 gap-y-1">
              <div class="flex items-center gap-2">
                <Icon icon="fluent-emoji-flat:tomato" :inline="true" class="text-lg" />
                <p class="m-0">{{ this.pomodoro.config.pomodoroTime }}'</p>
              </div>
              <div class="flex items-center gap-2">
                <Icon
                  icon="fluent-emoji-flat:teacup-without-handle"
                  :inline="true"
                  class="text-lg"
                />
                <p class="m-0">{{ this.pomodoro.config.shortBreakTime }}'</p>
              </div>
              <div class="flex items-center gap-2">
                <Icon icon="fluent-emoji-flat:zzz" class="text-lg" />
                <p class="m-0">
                  {{ this.pomodoro.config.longBreakTime }}'<span class="text-black-50">
                    every {{ this.pomodoro.config.longBreakInterval }} breaks</span
                  >
                </p>
              </div>
            </div>
          </div>
        </template>
      </Popper>
    </div>
  </div>
</template>

<script>
import PomodoroAnimation from './PomodoroAnimation.vue'
import { Pomodoro } from '@/router/pomodoro/pomodoro.js'

import {
  defaultConfig,
  loadPomodoro,
  deletePomodoro,
  createPomodoro,
  loadLatestConfig
} from '@/router/pomodoro/pomodoro.js'

export default {
  emits: ['play', 'pause', 'finish'],
  expose: ['replacePomodoro', 'config'],
  data() {
    return {
      pomodoro: null
    }
  },
  async created() {
    if (localStorage.getItem('pomodoro')) {
      this.pomodoro = new Pomodoro(JSON.parse(localStorage.getItem('pomodoro')))
      if (this.pomodoro.running) {
        this.play()
      }
    } else {
      this.pomodoro = await loadPomodoro()
      if (this.pomodoro == null) {
        let config = (await loadLatestConfig()) || defaultConfig
        this.pomodoro = await createPomodoro(config)
      }
      this.pomodoro.running = false
    }
  },
  methods: {
    play() {
      this.pomodoro.play()
      this.animation?.play()
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
        localStorage.removeItem('pomodoro')
      }
      this.pomodoro = await createPomodoro(config)
      this.pomodoro.saveToLocalStorage()
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
    },
    config() {
      return this.pomodoro?.config
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
