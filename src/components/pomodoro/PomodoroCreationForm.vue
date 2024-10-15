<template>
  <div class="modal fade" id="pomodoroForm" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <Modal>
      <template #header>

      </template>
    </Modal>

    <form @submit.prevent="createPomodoro(form_config)">
      <div class="modal-dialog">
        <div class="modal-content">
          <!-- <div class="modal-header"> -->
          <!--   <h5 class="modal-title" id="exampleModalLabel">Modal title</h5> -->
          <!--   <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button> -->
          <!-- </div> -->
          <div class="modal-body">
            <div class="w-100 w-sm-50 d-flex flex-column gap-2 mx-auto">
              <div class="d-flex flex-row justify-content-start align-items-center gap-1">
                <p class="m-0">Nome:</p>
                <div class="flex-grow input-group input-group-sm">
                  <input type="text" v-model="config.name" class="form-control" required>
                </div>
              </div>
              <div class="d-flex flex-row justify-content-start align-items-center gap-1">
                <p class="m-0">Pomodoro:</p>
                <div class="flex-grow input-group input-group-sm">
                  <input type="number" v-model="config.pomodoroTime" :placeholder="[[defaultConfig.pomodoroTime]]"
                    class="form-control" required>
                  <span class="input-group-text">minuti</span>
                </div>
              </div>
              <div class="d-flex flex-row justify-content-start align-items-center gap-1">
                <p class="m-0">Pausa:</p>
                <div class="flew-grow input-group input-group-sm">
                  <input type="number" v-model="config.breakTime" :placeholder="[[defaultConfig.breakTime]]"
                    class="form-control" required>
                  <span class="input-group-text">minuti</span>
                </div>
              </div>
              <div class="d-flex flex-row justify-content-start align-items-center gap-1">
                <p class="m-0">Cicli:</p>
                <div class="flex-grow input-group input-group-sm">
                  <input type="number" v-model="config.cycles" :placeholder="[[defaultConfig.cycles]]"
                    class="form-control" required>
                </div>
              </div>
              <div class="align-self-center">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button type="submit" class="btn btn-primary">Crea</button>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
import { defaultConfig, createPomodoro } from "../../router/pomodoro/pomodoro.js"

export default {
  emits: {
    pomodoroCreated: ({ pomodoro }) => {
      if (pomodoro)
        return true
      return false
    }
  },
  data() {
    return {
      config: {}
    }
  },
  methods: {
    async createPomodoro() {
      await createPomodoro(this.config)
        .then((pomodoro) => {
          this.$emit('pomodoroCreated', { pomodoro })
        })
    }
  },
  computed: {
    defaultConfig() {
      return defaultConfig
    }
  }
}

</script>
