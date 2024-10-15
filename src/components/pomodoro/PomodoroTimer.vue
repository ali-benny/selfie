<template>
  <div class="row justify-content-center">
    <div class="col-auto display-5">
      {{ message }}
    </div>
    <div class="row justify-content-center">
      <div class="col-auto">
        {{ pomodoro.cycle }} / {{ pomodoro.config.cycles }}
      </div>
    </div>
  </div>
  <div class="row justify-content-center">
    <div class="col-auto display-1 user-select-none digital">
      {{ formattedTime }}
    </div>
  </div>
  <div class="row justify-content-center">
    <div v-if="pomodoro.started" @click="pomodoro.restart()" class="col-auto clickable">
      <Icon icon="fluent:arrow-reset-20-regular" style="color: black" />
    </div>
    <div v-if="pomodoro.running" @click="pomodoro.pause()" class="col-auto user-select-none clickable">
      <Icon icon="fluent:pause-20-regular" style="color: black" />
    </div>
    <div v-else @click="pomodoro.play()" class="col-auto user-select-none clickable">
      <Icon icon="fluent:play-20-regular" style="color: black" />
    </div>
    <div v-if="pomodoro.started" @click="pomodoro.skip()" class="col-auto clickable">
      <Icon icon="fluent:fast-forward-20-regular" style="color: black" />
    </div>
  </div>
  <div class="row">
    <button @click="deletePomodoro()" class="col">
      <Icon icon="fluent:delete-20-regular" />
    </button>
  </div>
</template>

<script>
import { Icon } from '@iconify/vue'
import { Pomodoro, deletePomodoro } from '../../router/pomodoro/pomodoro.js'

export default {
  props: {
    pomodoro: Pomodoro
  },
  emits: [
    'pomodoroFinished'
  ],
  methods: {
    deletePomodoro() {
      deletePomodoro(this.pomodoro)
      this.$emit('pomodoroFinished')
    }
  },
  watchers: {
    'pomodoro.finished'(finished) {
      if (finished) {
        this.$emit('pomodoroFinished')
      }
    }
  },
  computed: {
    formattedTime() {
      if (!this.pomodoro)
        return "00:00"
      let minutes = Math.floor(this.pomodoro.timer / 60)
      let seconds = this.pomodoro.timer % 60
      return (minutes < 10 ? '0' : '') + minutes + ":" + (seconds < 10 ? '0' : '') + seconds
    },
    message() {
      if (!this.pomodoro.started) {
        return "Start pomodoro now!"
      }
      if (this.pomodoro.finished) {
        return "Good job!"
      }
      return this.pomodoro.message()
    }
  },
  components: {
    Icon
  }
}
</script>

<style>
.digital {
  font-family: Digital;
}

.clickable {
  cursor: pointer;
}
</style>
