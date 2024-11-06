<template>
  <div class="w-full overflow-visible" v-if="this.configs">
    <div v-if="this.configs.length == 0">
      <p class="text-center">Such empty, create a new focus!</p>
    </div>
    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 auto-rows-fr items-stretch gap-4">
      <div v-for="(config, idx) in configs" :key="config._id">
        <PomodoroConfigCard @select="onSelect(config)" @delete="this.loadConfigs" v-model:config="configs[idx]"
          :selected="isSelected(config)" />
      </div>
    </div>
  </div>
</template>

<script>
import PomodoroConfigCard from './PomodoroConfigCard.vue'
import { loadConfigs } from '../../router/pomodoro/pomodoro.js'

export default {
  props: {
    selected: {
      type: Object
    }
  },
  emits: {
    select: (config) => {
      if (config)
        return true
      return false
    }
  },
  expose: ['loadConfigs', 'selected'],
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
    },
    onSelect(config) {
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
