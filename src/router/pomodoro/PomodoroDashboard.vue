<template>
  <div class="container">
    <div v-if="pomodoro">
      <PomodoroTimer @pomodoroFinished="deletePomodoro()" :pomodoro="pomodoro" />
    </div>
    <div v-else>
      <div class="mt-2 mb-4 w-50 mx-auto">
        <div class="row">
          <label for="name" class="col-auto">Nome: </label>
          <input type="text" name="name" v-model="form_config.name" class="col form-control" />
        </div>
        <div class="row">
          <label for="cycles" class="col-auto">Cicli: </label>
          <input type="number" name="cycles" v-model="form_config.cycles" class="col form-control" />
        </div>
        <div class="row">
          <label for="pomodoroTime" class="col-auto">Studio: </label>
          <input type="number" name="pomodoroTime" v-model="form_config.pomodoroTime" class="col form-control" />
        </div>
        <div class="row">
          <label for="breakTime" class="col-auto">Pausa: </label>
          <input type="number" name="breakTime" v-model="form_config.breakTime" class="col form-control" />
        </div>
        <div class="row">
          <div class="col-4 mx-auto">
            <button @click="createPomodoro(form_config)" class="btn btn-primary">Crea</button>
          </div>
        </div>
      </div>
      <div class="w-100 w-md-75 mx-auto">
        <ul class="list-group">
          <li v-for="config in pomodoroConfigs" :key="config._id" class="list-group-item">
            <div class="d-flex flex-column justify-content-start gap-2">
              <div class="d-flex flex-row justify-content-between gap-4" style="flex-basis: 3rem">
                <div class="d-flex justify-content-start align-items-center gap-2" v-if="config.edit">
                  <input type="text" v-model="config.name" class="form-control">
                  <button @click="deleteConfig(config._id)" class="d-flex align-items-center text-danger">
                    <Icon icon="fluent:delete-32-regular" />
                  </button>
                </div>
                <div class="d-flex justify-content-start align-items-center gap-2" v-else>
                  <h2 class="m-0">
                    {{ config.name }}
                  </h2>
                  <button class="d-flex align-items-center mt-1" v-if="!config.edit">
                    <Icon icon="fluent:share-48-regular" />
                  </button>
                </div>
                <div class="d-flex justify-content-end gap-2">
                  <button @click="saveConfig(config)" class="d-flex align-items-center" :disabled="!config.edit"
                    v-if="config.edit">
                    <Icon icon="fluent:save-32-regular" />
                  </button>
                  <button @click="config.edit = true" class="d-flex align-items-center" :disabled="config.edit" v-else>
                    <Icon icon="fluent:edit-32-regular" />
                  </button>
                  <button @click="createPomodoro(config)" class="d-flex align-items-center text-success fs-1"
                    :disabled="config.edit">
                    <Icon icon="fluent:play-48-filled" />
                  </button>
                </div>
              </div>
              <div class="w-100 w-sm-50 d-33 d-flex flex-column gap-1">
                <div class="d-flex flex-row justify-content-start align-items-center gap-1">
                  <p class="m-0">Pomodoro:</p>
                  <div class="flex-grow input-group input-group-sm">
                    <input type="number" v-model="config.pomodoroTime" class="form-control" :disabled="!config.edit"
                      :readonly="!config.edit">
                    <span class="input-group-text">minuti</span>
                  </div>
                </div>
                <div class="d-flex flex-row justify-content-start align-items-center gap-1">
                  <p class="m-0">Pausa:</p>
                  <div class="flew-grow input-group input-group-sm">
                    <input type="number" v-model="config.breakTime" class="form-control" :disabled="!config.edit"
                      :readonly="!config.edit">
                    <span class="input-group-text">minuti</span>
                  </div>
                </div>
                <div class="d-flex flex-row justify-content-start align-items-center gap-1">
                  <p class="m-0">Cicli:</p>
                  <div class="flex-grow input-group input-group-sm">
                    <input type="number" v-model="config.cycles" class="form-control" :disabled="!config.edit"
                      :readonly="!config.edit">
                  </div>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { Icon } from '@iconify/vue'
import { loadPomodoro, createPomodoro, defaultConfig, loadConfigs, updatePomodoroConfig, deletePomodoroConfig } from './pomodoro.js'
import PomodoroTimer from './PomodoroTimer.vue'

export default {
  data() {
    return {
      pomodoro: null,
      form_config: defaultConfig,
      pomodoroConfigs: null
    };
  },
  async mounted() {
    this.pomodoro = await loadPomodoro()
    this.pomodoroConfigs = await loadConfigs()
  },
  methods: {
    async createPomodoro(config) {
      await createPomodoro(config)
        .then(p => {
          this.pomodoro = p
        })
    },
    async saveConfig(config) {
      await updatePomodoroConfig(config)
      config.edit = false
    },
    async deleteConfig(id) {
      await deletePomodoroConfig(id)
      this.pomodoroConfigs = await loadConfigs()
    },
    async deletePomodoro() {
      this.pomodoro = null
      this.pomodoroConfigs = await loadConfigs()
    }
  },
  components: {
    PomodoroTimer,
    Icon
  }
}
</script>
