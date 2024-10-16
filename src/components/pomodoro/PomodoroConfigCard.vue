<template>
  <div class="card p-3 d-flex flex-column justify-content-start align-items-stretch">
    <button class="edit-button d-flex justify-content-center align-items-center p-1">
      <Icon icon="fluent:edit-48-filled" />
    </button>
    <div class="d-flex flex-column justify-content-start align-items-center gap-1">
      <Icon icon="fluent-emoji-flat:tomato" class="big-icon" />
      <h3 class="m-0 flex-grow-1 fs-5"> {{ config.name }}</h3>
    </div>
    <!-- ### DURATA TOTALE ### -->
    <!-- <div class="d-flex justify-content-start align-items-center gap-1 mt-1"> -->
    <!--   <Icon icon="fluent:clock-32-regular" /> -->
    <!--   <p class="m-0 text-black-50 fs-6"> {{ totalDuration }} </p> -->
    <!-- </div> -->

    <div class="mt-2">
      <div class="d-flex justify-content-start align-items-center gap-2">
        <Icon icon="fluent-emoji-flat:tomato" :inline="true" color="blue" class="fs-5" />
        <p class="m-0"> {{ config.pomodoroTime }}'</p>
      </div>
      <div class="d-flex justify-content-start align-items-center gap-2">
        <Icon icon="fluent-emoji-flat:teacup-without-handle" :inline="true" class="fs-5" />
        <p class="m-0"> {{ config.shortBreakTime }}'</p>
      </div>
      <div class="d-flex justify-content-start align-items-center gap-2">
        <Icon icon="fluent-emoji-flat:zzz" class="fs-5" />
        <p class="m-0">
          {{ config.longBreakTime }}'<span class="text-black-50"> ogni {{ config.longBreakInterval }}</span>
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
