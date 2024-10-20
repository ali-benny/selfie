<template>
  <div class="flex flex-col items-stretch">

    <!--- Pomodoro Timer -->
    <div class="mt-5 basis-80">
      <PomodoroTimer @play="showConfigs = false" @pause="showConfigs = true" class="h-max" ref="pomodoroTimer"/>
    </div>


    <!-- Pomodoro configs -->
    <div class="m-3" v-if="showConfigs">
      <h2 class="font-bold text-lg">
        I tuoi focus
      </h2>
      <PomodoroConfigList class="mt-1" @select="reloadPomodoro" />
    </div>
  </div>

</template>

<script>
import PomodoroConfigList from '@/components/pomodoro/PomodoroConfigList.vue';
import PomodoroTimer from '@/components/pomodoro/PomodoroTimer.vue';

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
