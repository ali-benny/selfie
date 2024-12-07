<template>
  <Popper @open:popper="openHandler" :locked="locked" :placement="placement" arrow>
    <slot name="trigger"></slot>
    <template #content="{ close }">
      <div class="w-screen sm:w-80 h-100 p-3 rounded-box flex flex-col items-stretch gap-2" @keyup.escape="close()">
        <!-- Header e delete -->
        <div class="flex justify-between items-center cursor-default">
          <h4 class="font-bold">
            <span v-if="config">Edit your focus</span>
            <span v-else>Create your new focus</span>
          </h4>
          <button class="btn btn-outline btn-error btn-sm " @click="deleteConfig(close)"
            :disabled="pomodoroStore.isConfigSelected(config)" v-if="config">
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
              <input type="text" v-model="editableConfig.name" class="input input-bordered input-md"
                placeholder="Pomodoro" ref="configName" required />
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
                  <input type="text" v-model="editableConfig.pomodoroTime"
                    class="w-fit input input-bordered input-md text-center" maxlength="2" size="2" inputmode="numeric"
                    pattern="[0-9]*" placeholder="25" required />
                </label>

                <label class="form-control">
                  <div class="label">
                    <span class="label-text">Short break</span>
                  </div>
                  <input type="text" v-model="editableConfig.shortBreakTime"
                    class="w-fit input input-bordered input-md text-center" maxlength="2" size="2" inputmode="numeric"
                    pattern="[0-9]*" placeholder="5" required />
                </label>

                <label class="form-control">
                  <div class="label">
                    <span class="label-text">Long break</span>
                  </div>
                  <input type="text" v-model="editableConfig.longBreakTime"
                    class="w-fit input input-bordered input-md text-center" maxlength="2" size="2" inputmode="numeric"
                    pattern="[0-9]*" placeholder="20" required />
                </label>
              </div>
            </div>
            <div class="flex justify-between items-center">
              <label>Long break interval</label>
              <input type="text" v-model="editableConfig.longBreakInterval" class="input input-sm input-bordered"
                maxlength="2" size="2" inputmode="numeric" pattern="[0-9]*" placeholder="4" required />
            </div>

            <!-- Colore -->
            <div class="flex justify-between items-center">
              <label>Color</Label>
              <select name="color" v-model="editableConfig.color" class="select select-sm" required>
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

<script setup>
import { useToast } from 'vue-toastification'
import { flavors } from '@catppuccin/palette'
import { createPomodoroConfig, deletePomodoroConfig, updatePomodoroConfig } from '@/router/pomodoro/pomodoro'
import { useUserStore } from '@/stores/account'
import { computed, nextTick, ref, useTemplateRef } from 'vue';
import { usePomodoroStore } from '@/stores/pomodoro';

const colors = [
  flavors.macchiato.colors.rosewater,
  flavors.macchiato.colors.flamingo,
  flavors.macchiato.colors.pink,
  flavors.macchiato.colors.mauve,
  flavors.macchiato.colors.red,
  flavors.macchiato.colors.maroon,
  flavors.macchiato.colors.peach,
  flavors.macchiato.colors.yellow,
  flavors.macchiato.colors.teal,
  flavors.macchiato.colors.sky,
  flavors.macchiato.colors.sapphire,
  flavors.macchiato.colors.blue,
  flavors.macchiato.colors.lavender
]

const toast = useToast()

const { configId, placement, locked } = defineProps({
  configId: {
    type: String,
    default: null
  },
  placement: String,
  locked: Boolean
})
const pomodoroStore = usePomodoroStore()
const configMap = usePomodoroStore().configMap
const config = computed(() => configMap.get(configId))
const editableConfig = ref({ ...config.value }, {})

const configName = useTemplateRef('configName')
const userId = useUserStore().loggedUser._id

async function saveConfig(close) {
  try {
    if (configId) {
      configMap.set(configId, { ...editableConfig.value })
      if (pomodoroStore.isConfigSelected(config.value))
        pomodoroStore.setCurrentConfig(config.value)
      await updatePomodoroConfig(config.value)
      toast.success('Focus saved!')
    } else {
      const createdConfig = await createPomodoroConfig(userId, editableConfig.value)
      configMap.set(createdConfig._id, createdConfig)
      editableConfig.value = {}
      toast.success('Focus created successfully!')
    }

    close()
  } catch (error) {
    console.error(error.message)
    toast.error('Failed to save focus')
  }
}

async function deleteConfig(close) {
  try {
    configMap.delete(configId)
    await deletePomodoroConfig(configId)
    toast.success('Focus deleted')
    close()
  } catch (error) {
    console.error(error.message)
    toast.error('Failed to delete focus')
  }
}

async function openHandler() {
  await nextTick()
  configName.value.focus()
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
