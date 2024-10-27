<template>
  <Popper @open:popper="openHandler" v-bind="this.$attrs" arrow>
    <slot name="trigger"></slot>
    <template #content="{ close }">
      <div class="w-screen sm:w-80 h-100 p-3 rounded-box flex flex-col items-stretch gap-2" @keyup.escape="close()">
        <!-- Header e delete -->
        <div class="flex justify-between items-center cursor-default">
          <h4 class="font-bold">
            <span v-if="this.config">Edit your focus</span>
            <span v-else>Create your new focus</span>
          </h4>
          <button v-if="this.config" class="btn btn-outline btn-error btn-sm " @click="deleteConfig(close)">
            <Icon icon="fluent:delete-32-regular" />
          </button>
        </div>

        <form @submit.prevent="saveConfig(close)" ref="form">
          <div class="flex flex-col items-stretch gap-y-4">
            <!-- Nome -->
            <label class="form-control">
              <div class="label">
                <span class="label-text">Name</span>
              </div>
              <input type="text" v-model="form_config.name" class="input input-bordered" placeholder="Pomodoro"
                ref="configName" required />
            </label>

            <!-- Pomodoro time -->
            <div class="flex flex-col gap-1">
              <h5 class="cursor-default font-medium flex items-center">
                <Icon icon="fluent:clock-24-regular" />Timer (minutes)
              </h5>
              <div class="w-full grid grid-cols-3 gap-4">
                <label class="form-control">
                  <div class="label">
                    <span class="label-text">Focus</span>
                  </div>
                  <input type="text" v-model="form_config.pomodoroTime" class="w-fit input input-bordered text-center"
                    maxlength="2" size="2" inputmode="numeric" pattern="[0-9]*" placeholder="25" required />
                </label>

                <label class="form-control">
                  <div class="label">
                    <span class="label-text">Short break</span>
                  </div>
                  <input type="text" v-model="form_config.shortBreakTime" class="w-fit input input-bordered text-center"
                    maxlength="2" size="2" inputmode="numeric" pattern="[0-9]*" placeholder="5" required />
                </label>

                <label class="form-control">
                  <div class="label">
                    <span class="label-text">Long break</span>
                  </div>
                  <input type="text" v-model="form_config.longBreakTime" class="w-fit input input-bordered text-center"
                    maxlength="2" size="2" inputmode="numeric" pattern="[0-9]*" placeholder="20" required />
                </label>
              </div>
            </div>
            <div class="flex justify-between items-center">
              <label>Long break interval</label>
              <input type="text" v-model="form_config.longBreakInterval" class="input input-sm input-bordered"
                maxlength="2" size="2" inputmode="numeric" pattern="[0-9]*" placeholder="4" required />
            </div>

            <!-- Colore -->
            <div class="flex justify-between items-center">
              <label>Color</Label>
              <select name="color" v-model="form_config.color" class="select select-sm" required>
                <option v-for="(color, idx) in colors" :key="idx" :value="{ name: color.name, hex: color.hex }">
                  {{ color.name }}
                </option>
              </select>
            </div>

            <!-- Pulsanti  -->
            <div class="flex flex-row justify-end gap-1">
              <button type="button" class="btn btn-ghost" @click="close()">
                Cancel
              </button>
              <input type="submit" value="Save" class="btn btn-outline btn-secondary" />
            </div>
          </div>
        </form>
      </div>
    </template>
  </Popper>
</template>

<script>
import { useToast } from 'vue-toastification'
import { flavors } from '@catppuccin/palette'
import { createPomodoroConfig, deletePomodoroConfig, updatePomodoroConfig } from '@/router/pomodoro/pomodoro'

const toast = useToast()

export default {
  props: {
    config: Object,
    placement: String,
    locked: Boolean,
    arrow: Boolean
  },
  emits: ['submit', 'update:config', 'delete'],
  data() {
    return {
      form_config: null,
      colors: [
        flavors.mocha.colors.rosewater,
        flavors.mocha.colors.flamingo,
        flavors.mocha.colors.pink,
        flavors.mocha.colors.mauve,
        flavors.mocha.colors.red,
        flavors.mocha.colors.maroon,
        flavors.mocha.colors.peach,
        flavors.mocha.colors.yellow,
        flavors.mocha.colors.teal,
        flavors.mocha.colors.sky,
        flavors.mocha.colors.sapphire,
        flavors.mocha.colors.blue,
        flavors.mocha.colors.lavender
      ]
    }
  },
  created() {
    this.form_config = { ...this.config }
  },
  methods: {
    async saveConfig(close) {
      try {
        if (this.config) {
          await updatePomodoroConfig(this.form_config)
          toast.success('Focus saved!')
        } else {
          await createPomodoroConfig(this.form_config)
          toast.success('Focus created successfully!')
        }
        this.$emit('update:config', this.form_config)
        this.$emit('submit', 'success')

        close()
      } catch (error) {
        console.error(error.message)
        toast.error('Failed to save focus')
      }
    },
    async deleteConfig(close) {
      try {
        await deletePomodoroConfig(this.form_config._id)

        this.$emit('delete')
        toast.success('Focus deleted')

        close()
      } catch (error) {
        console.error(error.message)
        toast.error('Failed to delete focus')
      }
    },
    openHandler() {
      this.form_config = { ...this.config }
      // FIXME: no funzia
      this.$refs.configName.focus()
    }
  },
  computed: {
    configName() {
      return this.$refs.configName
    }
  }
}
</script>
<style scoped>
.form-control .label {
  padding-top: 0 !important;
}

.btn-outline {
  border-style: solid !important;
}
</style>
