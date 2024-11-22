<template>
  <div class="mx-auto flex flex-col items-stretch gap-12">

    {{
      this.store
    }}
    <!--- Pomodoro Timer -->
    <div class="mt-5 basis-80">
      <PomodoroTimer
        @play="showConfigs = false"
        @pause="showConfigs = true"
        class="h-max"
        ref="timer"
      />
    </div>

    <!-- Pomodoro configs -->
    <div class="px-3 pb-4 flex flex-col items-stretch gap-2">
      <div class="flex justify-between items-center">
        <h2 class="font-bold text-lg">Your saved focuses</h2>

        <PomodoroConfigForm
          @submit="
            (res) => {
              if (res === 'success') this.$refs.configList.loadConfigs()
            }
          "
          :disabled="!showConfigs"
        >
          <template #trigger>
            <button class="btn btn-sm btn-accent" :disabled="!showConfigs">
              New focus
              <Icon icon="fluent:new-24-regular" class="text-xl" />
            </button>
          </template>
        </PomodoroConfigForm>
      </div>

      <div class="relative">
        <PomodoroConfigList @select="reloadPomodoro" ref="configList" />
        <div
          class="transition-all z-10 absolute top-0 left-0 w-full h-full bg-base-100 opacity-0"
          :class="{ invisible: showConfigs, 'opacity-50': !showConfigs }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script>
import PomodoroConfigForm from '@/components/pomodoro/PomodoroConfigForm.vue'
import PomodoroConfigList from '@/components/pomodoro/PomodoroConfigList.vue'
import PomodoroTimer from '@/components/pomodoro/PomodoroTimer.vue'
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
    }
  },
  watch: {
    'timer.config'(newValue, oldValue) {
      if (!oldValue) {
        this.configList.selected = newValue
      }
    }
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
