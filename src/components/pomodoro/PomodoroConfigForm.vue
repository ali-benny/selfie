<template>
  <Popper :locked="true" @open:popper="this.form_config = { ...this.config }">
    <button class="z-10 hover:text-primary focus:text-primary">
      <Icon icon="fluent:edit-48-filled" />
    </button>
    <template #content="{ close }">
      <form @submit.prevent="saveConfig(close)" class="bg-base-300 rounded-box">
        <!-- Header e delete -->
        <div class="w-screen sm:w-80 h-100 flex flex-col items-stretch p-3 gap-2">
          <div class="flex flex-row justify-between items-center">
            <h4 class="font-bold">Modifica il tuo focus</h4>
            <button class="btn btn-outline btn-error btn-sm text-lg" @click="deleteConfig(close)">
              <Icon icon="fluent:delete-32-regular" />
            </button>
          </div>

          <!-- Nome -->
          <label class="input input-sm text-lg flex items-center gap-2 !text-secondary">
            Nome
            <input
              type="text"
              name="config-name"
              v-model="form_config.name"
              class="grow !text-base-content"
              required
            />
          </label>

          <!-- Pomdoro time -->
          <label class="input input-sm text-lg grid grid-cols-4 items-center gap-2 !text-secondary">
            <span class="col-span-2">Focus</span>
            <input
              type="number"
              name="pomodoroTime"
              v-model="form_config.pomodoroTime"
              class="!text-base-content"
              required
            />minuti
          </label>

          <!-- Short break time -->
          <label class="input input-sm text-lg grid grid-cols-4 items-center gap-2 !text-secondary">
            <span class="col-span-2">Pausa Breve</span>
            <input
              type="number"
              name="shortBreakTime"
              v-model="form_config.shortBreakTime"
              class="!text-base-content w-11"
              required
            />minuti
          </label>

          <!-- Long break time  -->
          <label class="input input-sm text-lg grid grid-cols-4 items-center gap-2 !text-secondary">
            <span class="col-span-2">Pausa Lunga</span>
            <input
              type="number"
              name="longBreakTime"
              v-model="form_config.longBreakTime"
              class="!text-base-content w-11"
              required
            />minuti
          </label>

          <!-- Long break interval  -->
          <label class="input input-sm text-lg grid grid-cols-4 items-center gap-2 !text-secondary">
            <span class="col-span-2">Intervallo</span>
            <input
              type="number"
              name="longBreakInterval"
              v-model="form_config.longBreakInterval"
              class="!text-base-content w-11"
              required
            />pomodori
          </label>

          <!-- Colore -->
          <div class="flex flex-row content-start items-center gap-2 bg-base-200 rounded-lg pl-3">
            <label for="color" class="m-0 shrink-0 !text-secondary">Colore</label>
            <select name="color" v-model="form_config.color" class="select select-sm w-full" required>
              <option
                v-for="(color, idx) in colors"
                :key="idx"
                :value="{ name: color.name, hex: color.hex }"
              >
                {{ color.name }}
              </option>
            </select>
          </div>

          <!-- Pulsanti  -->
          <div class="flex flex-row justify-center gap-1">
            <button type="button" class="btn btn-outline btn-error" @click="close()">
              Annulla
            </button>
            <input type="submit" value="Salva" class="btn btn-outline btn-success" />
          </div>
        </div>
      </form>
    </template>
  </Popper>
</template>

<script>
import { flavors } from '@catppuccin/palette'
import { deletePomodoroConfig, updatePomodoroConfig } from '@/router/pomodoro/pomodoro'

export default {
  props: {
    config: {
      required: true
    }
  },
  emits: ['update:config', 'delete'],
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
