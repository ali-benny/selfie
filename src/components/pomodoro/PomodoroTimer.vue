<template>
  <div class="w-100 h-100 flex flex-col justify-center" v-if="this.pomodoro">
    <div class="w-100 h-min flex flex-col items-center gap-y-24">
      <div class="self-stretch flex flex-row justify-evenly lg:justify-center flex-wrap gap-x-4 lg:gap-x-32 gap-y-4">
        <div class="flex flex-col items-center gap-y-1">
          <p class="m-0 font-medium leading-4">Pomodoro</p>
          <p class="m-0 leading-4"> {{ pomodoroTime }} </p>
        </div>
        <div class="flex flex-col items-center gap-y-1">
          <p class="m-0 font-medium leading-4">Pausa breve</p>
          <p class="m-0 leading-4"> {{ shortBreakTime }} </p>
        </div>
        <div class="flex flex-col items-center gap-y-1">
          <p class="m-0 font-medium leading-4">Pausa lunga</p>
          <p class="m-0 leading-4"> {{ longBreakTime }} </p>
        </div>
      </div>

      <div>
        <p class="digital select-none text-7xl m-0 leading-4">
          {{ timer }}
        </p>
      </div>
      <div class="relative mx-auto">
        <div class="flex flex-col">
          <button v-if="pomodoro.running" @click="pomodoro.pause()" class="text-2xl">
            Stop
          </button>
          <button v-else @click="pomodoro.play()" class="text-2xl">
            Start
          </button>
          <button v-if="pomodoro.started" @click="pomodoro.restart()" class="text-sm">
            Reset
          </button>
        </div>
        <div class="w-100 h-100 absolute inset-x-full top-0 flex justify-end items-center">
          <button v-if="pomodoro.started" @click="pomodoro.skip()" class="text-xl">
            <Icon icon="fluent:fast-forward-28-regular" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { loadPomodoro, deletePomodoro, createPomodoro, loadLatestConfig } from '../../router/pomodoro/pomodoro.js'

export default {
  emits: [
    'play',
    'pause',
    'finish'
  ],
  expose: [
    'replacePomodoro'
  ],
  data() {
    return {
      pomodoro: null,
    }
  },
  async created() {
    // Prendo il pomodoro esistente se esiste, altrimenti ne creo uno nuovo con l'ultima config usata
    this.pomodoro = await loadPomodoro();
    if (this.pomodoro == null) {
      let config = await loadLatestConfig()
      this.pomodoro = await createPomodoro(config)
    }

    this.pomodoro.running = false
  },
  methods: {
    deletePomodoro() {
      deletePomodoro(this.pomodoro)
      this.$emit('finish')
    },
    async replacePomodoro(config) {
      if (this.pomodoro) {
        await deletePomodoro(this.pomodoro)
      }
      this.pomodoro = await createPomodoro(config)
    },
    formatClockTime(time) {
      if (!time)
        return '00:00'
      let minutes = Math.floor(time / 60)
      let seconds = time % 60
      return (minutes < 10 ? '0' : '') + minutes + ":" + (seconds < 10 ? '0' : '') + seconds
    },
    formatConfigTime(time) {
      if (!time)
        return '0 min.'
      return time + ' min.'
    }
  },
  watch: {
    'pomodoro.running'(started) {
      if (started) {
        this.$emit('play')
      } else {
        this.$emit('pause')
      }
    },
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
    message() {
      if (!this.pomodoro.started) {
        return "Start pomodoro now!"
      }
      if (this.pomodoro.finished) {
        return "Good job!"
      }
      return this.pomodoro.message()
    },

  }
}
</script>

<style>
.digital {
  font-family: Digital-7;
}
</style>
