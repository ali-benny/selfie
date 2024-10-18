<template>
  <Popper arrow :locked="true" @open:popper="this.form_config = { ...this.config }">
    <button class="z-10">
      <Icon icon="fluent:edit-48-filled" />
    </button>
    <template #content="{ close }">
      <form @submit.prevent="saveConfig(close)">
        <!-- Header e delete -->
        <div class="w-screen sm:w-80 h-100 flex flex-col items-stretch py-4 px-3 gap-2">
          <div class="flex flex-row justify-between items-center">
            <h4 class="font-bold">Modifica il tuo focus</h4>
            <button class="btn" @click="deleteConfig(close)">
              <Icon icon="fluent:delete-32-regular" color="red" />
            </button>
          </div>

          <!-- Nome -->
          <div class="flex flex-row items-center gap-1">
            <label for="config-name" class="m-0 shrink-0">Nome:</label>
            <div class="input-group input-group-sm">
              <input type="text" name="config-name" v-model="form_config.name" class="form-control" required>
            </div>
          </div>

          <!-- Pomdoro time -->
          <div class="flex flex-row justify-start items-center gap-1">
            <label for="pomodoroTime" class="m-0 shrink-0">Pomodoro:</label>
            <div class="input-group input-group-sm">
              <input type="number" name="pomodoroTime" v-model="form_config.pomodoroTime" class="form-control" required>
              <span class="input-group-text">minuti</span>
            </div>
          </div>

          <!-- Short break time -->
          <div class="flex flex-row content-start items-center gap-1">
            <label for="shortBreakTime" class="shrink-0 m-0">Pausa breve:</label>
            <div class="input-group input-group-sm">
              <input type="number" name="shortBreakTime" v-model="form_config.shortBreakTime" class="form-control"
                required>
              <span class="input-group-text">minuti</span>
            </div>
          </div>

          <!-- Long break time  -->
          <div class="flex flex-row content-start items-center gap-1">
            <label for="longBreakTime" class="m-0 shrink-0">Pausa lunga:</label>
            <div class="input-group input-group-sm">
              <input type="number" name="longBreakTime" v-model="form_config.longBreakTime" class="form-control"
                required>
              <span class="input-group-text">minuti</span>
            </div>
          </div>

          <!-- Long break interval  -->
          <div class="flex flex-row content-start items-center gap-1">
            <label for="longBreakInterval" class="m-0 shrink-0">Intervallo pausa lunga:</label>
            <input type="number" name="longBreakInterval" v-model="form_config.longBreakInterval" class="form-control"
              required>
          </div>

          <!-- Colore -->
          <div class="flex flex-row content-start items-center gap-1">
            <label for="color" class="m-0 shrink-0">Colore:</label>
            <select name="color" v-model="form_config.color" class="form-control" required>
              <option v-for="(color, idx) in colors" :key="idx" :value="{ name: color.name, hex: color.hex }">
                {{ color.name }}
              </option>
            </select>
          </div>

          <!-- Pulsanti  -->
          <div class="flex flex-row justify-center gap-1">
            <button type="button" class="btn btn-outline-secondary" @click="close()">
              Annulla
            </button>
            <input type="submit" value="Salva" class="btn btn-outline-success" />
          </div>
        </div>
      </form>
    </template>
  </Popper>
</template>

<script>
import { flavors } from '@catppuccin/palette'
import { deletePomodoroConfig, updatePomodoroConfig } from '@/router/pomodoro/pomodoro';

export default {
  props: {
    config: {
      required: true
    }
  },
  emits: [
    'update:config',
    'delete'
  ],
  data() {
    return {
      form_config: null,
      colors: [
        flavors.latte.colors.rosewater,
        flavors.latte.colors.flamingo,
        flavors.latte.colors.pink,
        flavors.latte.colors.mauve,
        flavors.latte.colors.red,
        flavors.latte.colors.maroon,
        flavors.latte.colors.peach,
        flavors.latte.colors.teal,
        flavors.latte.colors.sky,
        flavors.latte.colors.sapphire,
        flavors.latte.colors.blue,
        flavors.latte.colors.lavender
      ]
    }
  },
  created() {
    this.form_config = { ...this.config }
  },
  methods: {
    async saveConfig(close) {
      try {
        await updatePomodoroConfig(this.form_config)

        this.$emit('update:config', this.form_config)

        close()
      } catch (error) {
        console.error(error.message)
      }
    },
    async deleteConfig(close) {
      try {
        await deletePomodoroConfig(this.form_config._id)

        this.$emit('delete')

        close()
      } catch (error) {
        console.error(error.message)
      }
    }
  }
}
</script>

<style>
:root {
  --popper-theme-background-color: #f3f3f3;
  --popper-theme-background-color-hover: #f3f3f3;
  --popper-theme-text-color: inherit;
  --popper-theme-border-width: 0px;
  --popper-theme-border-style: solid;
  --popper-theme-border-radius: 6px;
  --popper-theme-padding: 0;
  --popper-theme-box-shadow: 0 6px 30px -6px rgba(0, 0, 0, 0.25);
}
</style>
