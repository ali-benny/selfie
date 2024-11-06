<template>
  <div class="w-full h-full flex flex-col items-stretch gap-10">

    <!--- Pomodoro Timer -->
    <div id="timer-container" class="grow pt-10" :class="{ 'flex-animation': !showConfigs }">
      <PomodoroTimer @play="showConfigs = false" @pause="showConfigs = true" ref="timer" />
    </div>

    <!-- Pomodoro configs -->

    <Transition :duration="2000" name="config-fade">
      <div class="flex flex-col items-stretch gap-2 pb-4" v-if="showConfigs">
        <div class="flex justify-between items-center">
          <h2 class="font-bold text-lg">
            Your saved focuses
          </h2>

          <PomodoroConfigForm @submit="(res) => { if (res === 'success') this.$refs.configList.loadConfigs() }"
            :disabled="!showConfigs">
            <template #trigger>
              <button class="btn btn-sm btn-accent" :disabled="!showConfigs">
                New focus
                <Icon icon="fluent:new-24-regular" class="text-xl" />
              </button>
            </template>
          </PomodoroConfigForm>
        </div>


        <div>
          <PomodoroConfigList @select="reloadPomodoro" :selected="this.timer?.config" ref="configList" />
        </div>
      </div>
    </Transition>
  </div>

</template>

<script>
import PomodoroConfigForm from '@/components/pomodoro/PomodoroConfigForm.vue';
import PomodoroConfigList from '@/components/pomodoro/PomodoroConfigList.vue';
import PomodoroTimer from '@/components/pomodoro/PomodoroTimer.vue';
import { useCounterStore } from '@/stores/counter.js'


export default {
  data() {
    return {
      showConfigs: true,
      isMounted: false
    }
  },
  mounted() {
    this.isMounted = true
  },
  methods: {
    reloadPomodoro(config) {
      this.timer.replacePomodoro(config)
    },
  },
  computed: {
    timer() {
      if (!this.isMounted) return
      return this.$refs.timer
    },
    configList() {
      if (!this.isMounted) return
      return this.$refs.configList
    },
    store() {
      useCounterStore.increment
      return useCounterStore.count
    }
  },
  components: {
    PomodoroTimer,
    PomodoroConfigList,
    PomodoroConfigForm
  }
}
</script>

<style scoped>
.config-fade-enter-from,
.config-fade-leave-to {
  opacity: 0 !important;
}

.config-fade-enter-to,
.config-fade-leave-from {
  flex-grow: 0.001;
}

.config-fade-enter-active,
.config-fade-leave-active {
  transition: opacity 1s ease;
}

.flex-animation {
  animation-name: flex-grow;
  animation-delay: 250ms;
  animation-duration: 1s;
  animation-fill-mode: forwards;
}

@keyframes flex-grow {
  100% {
    flex-grow: 1;
  }
}
</style>
