<template>
  <div class="flex flex-col items-stretch">

    <!--- Pomodoro Timer -->
    <div class="mt-5 basis-80">
      <PomodoroTimer @play="showConfigs = false" @pause="showConfigs = true" class="h-max" ref="pomodoroTimer" />
    </div>


    <!-- Pomodoro configs -->
    <div class="m-3" v-if="showConfigs">
      <h2 class="font-bold text-lg">
        I tuoi focus
      </h2>
      <PomodoroConfigList class="mt-1" @select="reloadPomodoro" />
    </div>

    <!-- New config -->
    <div class="fixed bottom-5 right-5 ">
      <PomodoroConfigForm :placement="top" locked>
        <template #trigger>
          <button class="relative z-10 btn btn-success btn-circle">
            <Icon icon="fluent:edit-48-filled" />
          </button>
        </template>
      </PomodoroConfigForm>
    </div>
  </div>

</template>

<script>
import PomodoroConfigForm from '@/components/pomodoro/PomodoroConfigForm.vue';
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
    },
  },
  components: {
    PomodoroTimer,
    PomodoroConfigList,
    PomodoroConfigForm
  }
}

</script>
