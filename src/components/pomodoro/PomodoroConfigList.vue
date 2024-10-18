<template>
  <div class="w-full overflow-visible">
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-2 gap-y-1" v-if="configs">
      <div class="flex" v-for="(config, idx) in configs" :key="config._id">
        <PomodoroConfigCard @select="$emit('select', config)" @delete="this.loadConfigs" v-model:config="configs[idx]"
          class="grow" />
      </div>
    </div>
  </div>
</template>

<script>
import PomodoroConfigCard from './PomodoroConfigCard.vue'
import { loadLatestConfigs } from '../../router/pomodoro/pomodoro.js'

export default {
  emits: {
    select: (config) => {
      if (config)
        return true
      return false
    }
  },
  data() {
    return {
      configs: null
    }
  },
  async created() {
    await this.loadConfigs()
  },
  methods: {
    async loadConfigs() {
      this.configs = await loadLatestConfigs()
    }
  },
  components: {
    PomodoroConfigCard
  }

}
</script>
