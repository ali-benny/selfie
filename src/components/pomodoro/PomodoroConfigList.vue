<template>
  <div class="w-full overflow-visible">
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 items-stretch gap-4">
      <div v-for="(config, idx) in configs" :key="config._id">
        <PomodoroConfigCard
          @select="onSelect(config)"
          @delete="this.loadConfigs"
          v-model:config="configs[idx]"
          :class="{ selected: isSelected(config) }"
        />
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
      if (config) return true
      return false
    }
  },
  expose: ['loadConfigs', 'selected'],
  data() {
    return {
      configs: null,
      selected: null
    }
  },
  async created() {
    await this.loadConfigs()
  },
  methods: {
    async loadConfigs() {
      this.configs = await loadConfigs()
    },
    onSelect(config) {
      this.selected = config
      this.$emit('select', config)
    },
    isSelected(config) {
      return this.selected && config._id == this.selected._id
    }
  },
  components: {
    PomodoroConfigCard
  }
}
</script>
