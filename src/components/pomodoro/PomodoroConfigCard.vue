<template>
  <div class="card p-3 flex flex-col justify-start items-stretch">
    <div class="absolute top-2 right-2 z-10 flex justify-center align-center p-1">
      <PomodoroConfigForm :config="config" @update:config="$emit('update:config', $event)" @delete="$emit('delete')" />
    </div>

    <div class="flex flex-col justify-start items-center">
      <Icon icon="fluent-emoji-flat:tomato" class="text-5xl" />
      <div class="flex justify-start items-center gap-2">
        <h3 class="m-0 flex-grow text-xl"> {{ config.name }}</h3>
        <button class="flex items-center mt-1">
          <Icon icon="fluent:share-48-regular" class="text-gray-500" />
        </button>
      </div>
    </div>

    <div class="mt-2">
      <div class="flex justify-start items-center gap-2">
        <Icon icon="fluent-emoji-flat:tomato" :inline="true" color="blue" class="text-xl" />
        <p class="m-0"> {{ config.pomodoroTime }}'</p>
      </div>
      <div class="flex justify-start items-center gap-2">
        <Icon icon="fluent-emoji-flat:teacup-without-handle" :inline="true" class="text-xl" />
        <p class="m-0"> {{ config.shortBreakTime }}'</p>
      </div>
      <div class="flex justify-start items-center gap-2">
        <Icon icon="fluent-emoji-flat:zzz" class="text-xl" />
        <p class="m-0">
          {{ config.longBreakTime }}'<span class="text-black-50"> ogni {{ config.longBreakInterval }} pause</span>
        </p>
      </div>
      <div class="mt-2 text-center">
        <button class="btn btn-outline-success mx-auto" @click="$emit('select')">
          Seleziona
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import PomodoroConfigForm from './PomodoroConfigForm.vue'

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
  computed: {
    /*
    totalDuration() {
      let duration = (this.config.pomodoroTime + this.config.shortBreakTime) * this.config.cycles
      let hours = Math.floor(duration / 60)
      let minutes = duration % 60
      let formatted = hours + (hours > 1 ? ' ore' : ' ora')
      if (minutes > 0) {
        formatted = formatted + ' e ' + minutes + ' min'
      }
      return formatted
    }
    */
  },
  components: {
    PomodoroConfigForm
  }
}
</script>
