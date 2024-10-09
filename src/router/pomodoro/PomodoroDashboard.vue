<template>
  <div class="container-md text-center">
    <div v-if="pomodoro">
      <PomodoroTimer :pomodoro="pomodoro" />
    </div>
    <div v-else>
      <div class="row">
        <label for="cycles" class="col">Cicli: </label>
        <input type="number" name="cycles" v-model="config.cycles" class="col"/>
      </div>
      <div class="row">
        <label for="pomodoroTime" class="col">Studio: </label>
        <input type="number" name="pomodoroTime" v-model="config.pomodoroTime"  class="col"/>
      </div>
      <div class="row">
        <label for="breakTime" class="col">Pausa: </label>
        <input type="number" name="breakTime" v-model="config.breakTime" class="col"/>
      </div>
      <button @click="createPomodoro">Crea</button>
    </div>
    <p>{{ pomodoro }}</p>
  </div>
</template>

<script>
import { loadPomodoro, createPomodoro, defaultConfig } from './pomodoro.js'
import PomodoroTimer from './PomodoroTimer.vue'

export default {
  data() {
    return {
      pomodoro: null,
      config: defaultConfig
    };
  },
  async mounted() {
    this.pomodoro = await loadPomodoro()
  },
  methods: {
    createPomodoro() {
      createPomodoro(this.config)
        .then(p => {
          this.pomodoro = p
        })
    }
  },
  watch: {
    'pomodoro.finished'(finished) {
      // quando il pomodoro finisce, elimino anche l'istanza salvata
      if (finished) {
        this.pomodoro = null
      }
    }
  },
  components: {
    PomodoroTimer
  }
}
</script>
