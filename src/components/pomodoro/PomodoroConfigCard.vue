<template>
  <div class="card p-3 hover:cursor-pointer hover:!bg-base-300 hover:shadow-xl hover:shadow-base-300/30"  @click="$emit('select')" :style="{ backgroundColor: config.color.hex + '40' }">
    <!-- Form edit -->
    <div class="absolute top-2 right-2 flex justify-center align-center p-1">
      <PomodoroConfigForm
        :config="config"
        @update:config="$emit('update:config', $event)"
        @delete="$emit('delete')"
      />
    </div>

    <div class="h-full flex flex-col justify-start items-stretch gap-2">
      <!-- Icona e titolo -->
      <div class="flex flex-col justify-start items-center">
        <IconPomodoro :color="config.color.hex" class="text-5xl" />
        <!-- <Icon icon="fluent-emoji-flat:tomato" class="text-5xl" /> -->
        <div class="flex justify-start items-center gap-2">
          <h3 class="m-0 flex-grow text-xl text-center">{{ config.name }}</h3>
          <button class="flex items-center mt-1">
            <Icon icon="fluent:share-48-regular" class="!text-neutral hover:!text-accent" />
          </button>
        </div>
      </div>

      <!-- Parametri della config -->
      <div class="mt-2">
        <div class="flex justify-start items-center gap-2">
          <Icon icon="fluent-emoji-flat:tomato" :inline="true" color="blue" class="text-xl" />
          <p class="m-0">{{ config.pomodoroTime }}'</p>
        </div>
        <div class="flex justify-start items-center gap-2">
          <Icon icon="fluent-emoji-flat:teacup-without-handle" :inline="true" class="text-xl" />
          <p class="m-0">{{ config.shortBreakTime }}'</p>
        </div>
        <div class="flex justify-start items-center gap-2">
          <Icon icon="fluent-emoji-flat:zzz" class="text-xl" />
          <p class="m-0">
            {{ config.longBreakTime }}'<span class="text-black-50"> ogni {{ config.longBreakInterval }} pause</span>
          </p>
        </div>
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
  emits: [
    'select',
    'update:config',
    'delete'
  ],
  components: {
    PomodoroConfigForm,
    IconPomodoro
  }
}
</script>
