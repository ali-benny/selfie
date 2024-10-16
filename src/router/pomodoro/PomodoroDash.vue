<template>
  <div class="container">
    <!--- Pomodoro Timer -->
    <div class="w-100">
      <PomodoroTimer @start="showConfigs = false" @finish="showConfigs = true" ref="pomodoroTimer" />
    </div>

    <!-- Pomodoro configs -->
    <div class="w-100" v-if="showConfigs">
      <PomodoroConfigList @select="reloadPomodoro" />
    </div>
  </div>

</template>

<script>
// import { defineAsyncComponent } from 'vue'
import PomodoroTimer from '../../components/pomodoro/PomodoroTimer.vue'
import PomodoroConfigList from '../../components/pomodoro/PomodoroConfigList.vue'

export default {
  data() {
    return {
      showConfigs: true
    }
  },
  methods: {
    reloadPomodoro(config) {
      this.$refs.pomodoroTimer.replacePomodoro(config)
    }
  },
  components: {
    PomodoroTimer,
    PomodoroConfigList
  }
}

</script>
