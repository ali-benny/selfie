<template>
  <div class="card p-3 flex flex-col justify-start items-stretch">
    <button class="absolute top-2 right-2 z-10 flex justify-center align-center p-1">
      <Icon icon="fluent:edit-48-filled" />
    </button>

    <div class="flex flex-col justify-start items-center">
      <Icon icon="fluent-emoji-flat:tomato" class="text-5xl" />
      <h3 class="m-0 flex-grow text-xl"> {{ config.name }}</h3>
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
import { Icon } from '@iconify/vue'

export default {
  props: {
    config: {
      required: true
    }
  },
  emits: [
    'select'
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
    Icon
  }
}
</script>

<style>
.edit-button {
  position: absolute;
  top: 7px;
  right: 7px;
  z-index: 1;
}

.big-icon {
  font-size: 64px;
}
</style>
