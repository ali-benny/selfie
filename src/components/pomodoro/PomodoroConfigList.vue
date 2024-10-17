<template>
  <div class="w-100 overflow-visible">
    <div class="row row-cols-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 gx-2 gy-1" v-if="configs">
      <div class="col d-flex" v-for="(config, idx) in configs" :key="config._id">
        <PomodoroConfigCard @select="$emit('select', config)" @delete="this.loadConfigs" v-model:config="configs[idx]"
          class="flex-grow-1" />
      </div>
    </div>
  </div>
</template>

<script>
import PomodoroConfigCard from './PomodoroConfigCard.vue'
import { loadConfigs } from '../../router/pomodoro/pomodoro.js'

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
      this.configs = await loadConfigs()
    }
  },
  components: {
    PomodoroConfigCard
  }

}
</script>
