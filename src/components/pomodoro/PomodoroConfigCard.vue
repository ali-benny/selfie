<template>
  <div
    class="max-w-56 sm:max-w-64 h-full card card-compact sm:card-normal"
    @click="$emit('select')"
  >
    <div class="card-body relative">
      <!-- Form edit -->
      <div @click.stop class="absolute top-4 right-4 flex justify-center align-center">
        <PomodoroConfigForm
          :config="config"
          @update:config="$emit('update:config', $event)"
          @delete="$emit('delete')"
        >
          <template #trigger>
            <button class="z-10 hover:text-secondary">
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
          <button @click.stop class="flex items-center mt-1">
            <Icon icon="fluent:share-48-regular" class="!text-neutral hover:!text-accent" />
          </button>
        </div>
      </div>

      <!-- Dati config -->
      <div class="flex items-center gap-2">
        <Icon icon="fluent-emoji-flat:tomato" :inline="true" class="text-xl" />
        <p class="m-0">{{ config.pomodoroTime }}'</p>
      </div>
      <div class="flex items-center gap-2">
        <Icon icon="fluent-emoji-flat:teacup-without-handle" :inline="true" class="text-xl" />
        <p class="m-0">{{ config.shortBreakTime }}'</p>
      </div>
      <div class="flex items-center gap-2">
        <Icon icon="fluent-emoji-flat:zzz" class="text-xl" />
        <p class="m-0">
          {{ config.longBreakTime }}'<span class="text-black-50">
            every {{ config.longBreakInterval }} breaks</span
          >
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import PomodoroConfigForm from './PomodoroConfigForm.vue'
import IconPomodoro from '../icons/IconPomodoro.vue'

export default {
  props: {
    config: {
      required: true
    }
  },
  emits: ['select', 'update:config', 'delete'],
  components: {
    PomodoroConfigForm,
    IconPomodoro
  }
}
</script>
<style lang="postcss" scoped>
.card {
  @apply transition-all bg-base-200 shadow-lg shadow-base-300 border-2 border-base-300;
}

.card:hover,
.selected {
  @apply border-2 bg-base-300 cursor-pointer;
  border-color: v-bind('config?.color.hex + 80') !important;
  box-shadow:
    0 10px 15px -3px v-bind('config?.color.hex + 40'),
    0 4px 6px -4px v-bind('config?.color.hex + 30');
}
</style>
