<template>
  <div
    class="max-w-full xs:max-w-56 sm:max-w-64 h-full card"
    @click="!selected && pomodoroStore.setCurrentConfig(config)"
    :class="{ selected: pomodoroStore.isConfigSelected(config._id) }"
  >
    <div class="card-body relative">
      <!-- Form edit -->
      <div @click.stop class="absolute top-4 right-4 flex justify-center align-center">
        <PomodoroConfigForm :configId="configId">
          <template #trigger>
            <button class="z-10 text-secondary">
              <Icon icon="fluent:edit-48-filled" />
            </button>
          </template>
        </PomodoroConfigForm>
      </div>

      <!-- Icona e titolo -->
      <div class="card-title flex-col">
        <IconPomodoro :color="config.color.hex" class="text-5xl" />
        <div class="flex items-center gap-2">
          <h3 class="grow text-center m-0">{{ config.name }}</h3>
          <UserShare type="Pomodoro" :id="config._id">
            <button class="flex items-center mt-1">
              <Icon icon="fluent:share-48-regular" class="!text-neutral hover:!text-accent" />
            </button>
          </UserShare>
        </div>
      </div>

      <PomodoroConfigInfo :config="config" />
    </div>
  </div>
</template>

<script setup>
import PomodoroConfigForm from './PomodoroConfigForm.vue'
import IconPomodoro from '../icons/IconPomodoro.vue'
import { usePomodoroStore } from '@/stores/pomodoro'
import { computed } from 'vue'
import PomodoroConfigInfo from './PomodoroConfigInfo.vue'
import UserShare from '../UserShare.vue'

const { configId } = defineProps({
  configId: {
    type: String,
    required: true
  }
})
const pomodoroStore = usePomodoroStore()
const config = computed(() => pomodoroStore.userConfigs.get(configId))
</script>

<style lang="postcss" scoped>
.card {
  @apply transition-all bg-base-200 shadow-lg shadow-base-300 border-2 border-base-300;
}

.card:hover,
.card.selected {
  @apply border-2 bg-base-300;
}

.card:hover {
  @apply cursor-pointer;
  border-color: v-bind('config?.color.hex + 95') !important;
  --tw-shadow-color: v-bind('config?.color.hex + 60');
}

.card.selected {
  border-color: v-bind('config?.color.hex') !important;
  --tw-shadow-color: v-bind('config?.color.hex + 80');
}

.card.selected:hover {
  @apply cursor-default;
}
</style>
