<template>
  <div v-if="this.pomodoro">
    <div class="d-flex flex-column align-items-center">
      <div class="digital fs-1">
        {{ formattedTime }}
      </div>
      <div class="d-flex flex-row justify-content-center align-items-center">
        <button v-if="pomodoro.started" @click="pomodoro.restart()" class="btn button-success">
          <Icon icon="fluent:arrow-reset-24-regular" />
        </button>
        <button v-if="pomodoro.running" @click="pomodoro.pause()" class="btn button-success">
          <Icon icon="fluent:pause-24-regular" />
        </button>
        <button v-else @click="pomodoro.play()" class="btn button-success">
          <Icon icon="fluent:play-24-regular" />
        </button>
        <button v-if="pomodoro.started" @click="pomodoro.skip()" class="btn button-success">
          <Icon icon="fluent:fast-forward-24-regular" />
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { Icon } from '@iconify/vue'
import { loadPomodoro, deletePomodoro, createPomodoro, loadLatestConfig } from '../../router/pomodoro/pomodoro.js'

export default {
  emits: [
    'start',
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
    this.pomdoro.running = false
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
    }
  },
  watchers: {
    'pomodoro.started'(started) {
      if (started) {
        this.$emit('start')
      }
    },
    'pomodoro.finished'(finished) {
      if (finished) {
        this.$emit('finish')
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
