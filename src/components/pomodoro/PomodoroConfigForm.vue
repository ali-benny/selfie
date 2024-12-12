<template>
  <Popper @open:popper="openHandler" :locked="locked" :placement="placement" arrow>
    <slot name="trigger"></slot>
    <template #content="{ close }">
      <div class="w-screen sm:w-80  p-3 rounded-box flex flex-col items-stretch gap-2" @keyup.escape="close()">
        <!-- Header e delete -->
        <div class="flex justify-between items-center">
          <h4 class="font-bold">
            <span v-if="configId">Edit your focus</span>
            <span v-else>Create your new focus</span>
          </h4>
          <button class="btn btn-outline btn-error btn-sm " @click="deleteConfig(close)"
            :disabled="pomodoroStore.isConfigSelected(configId)" v-if="configId">
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
              <input type="text" v-model="editableConfig.name" class="input input-md" placeholder="Pomodoro"
                ref="configName" required />
            </label>
            <div v-if="!firstStepDone" class="flex flex-col justify-between items-stretch h-72">
              <div class="flex flex-col  gap-1">
                <h5 class="font-semibold flex items-center">
                  Desired focus duration:
                </h5>
                <label class="relative input input-md flex justify-end items-center gap-2">
                  <input v-debounce="updateProposedFocus" type="text"
                    class="absolute top-0 left-0 w-full h-full text-center" maxlength="3" size="3" inputmode="numeric"
                    pattern="[0-9]*" placeholder="120" />
                  minutes
                </label>
                <h5 class="font-semibold flex items-center">
                  Proposed focus:
                </h5>
                <PomodoroConfigInfo :config="editableConfig" />
                {{ focusMinutes }}
              </div>
              <div v-if="focusMinutes">
              </div>
              <div class="flex justify-end items-center">
                <div class="btn btn-neutral" @click="firstStepDone = true">
                  Skip
                </div>
                <div class="btn btn-outline btn-secondary" @click="firstStepDone = true">
                  Next
                </div>
              </div>
            </div>
            <div v-else class="flex flex-col justify-between items-stretch h-72">
              <!-- Pomodoro time -->
              <div class="flex flex-col gap-1">
                <h5 class="font-medium flex items-center">
                  <Icon icon="fluent:clock-24-regular" class="pr-1" />Timer (minutes)
                </h5>
                <div class="w-full grid grid-cols-3 gap-4">
                  <label class="form-control">
                    <div class="label">
                      <span class="label-text">Focus</span>
                    </div>
                    <input type="text" v-model="editableConfig.pomodoroTime" class="w-fit input input-md text-center"
                      maxlength="2" size="2" inputmode="numeric" pattern="[0-9]*" placeholder="25" required />
                  </label>

                  <label class="form-control">
                    <div class="label">
                      <span class="label-text">Short break</span>
                    </div>
                    <input type="text" v-model="editableConfig.shortBreakTime" class="w-fit input input-md text-center"
                      maxlength="2" size="2" inputmode="numeric" pattern="[0-9]*" placeholder="5" required />
                  </label>

                  <label class="form-control">
                    <div class="label">
                      <span class="label-text">Long break</span>
                    </div>
                    <input type="text" v-model="editableConfig.longBreak.time" class="w-fit input  input-md text-center"
                      maxlength="2" size="2" inputmode="numeric" pattern="[0-9]*" placeholder="-"
                      :required="isLongBreakRequired()" />
                  </label>
                </div>
              </div>
              <div class="flex justify-between items-center">
                <label>Long break interval</label>
                <input type="text" v-model="editableConfig.longBreak.interval" class="input input-sm " maxlength="2"
                  size="2" inputmode="numeric" pattern="[0-9]*" placeholder="-" :required="isLongBreakRequired()" />
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
                <button type="button" class="btn btn-ghost" @click="close()">Cancel</button>
                <input type="submit" value="Save" class="btn btn-outline btn-secondary" />
              </div>
            </div>
          </div>
        </form>
      </div>
      {{ editableConfig.longBreak }}
    </template>
  </Popper>
</template>

<script setup>
import { useToast } from 'vue-toastification'
import { flavors } from '@catppuccin/palette'
import { createPomodoroConfig, deletePomodoroConfig, updatePomodoroConfig } from '@/router/pomodoro/pomodoro'
import { useUserStore } from '@/stores/account'
import { nextTick, ref, useTemplateRef, shallowReactive, toRaw, reactive } from 'vue';
import { usePomodoroStore } from '@/stores/pomodoro';
import PomodoroConfigInfo from './PomodoroConfigInfo.vue';

const defaultConfig = {
  pomodoroTime: 25,
  shortBreakTime: 5,
  cycles: 4,
}

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
const userConfigs = pomodoroStore.userConfigs

const editableConfig = reactive({ ...defaultConfig })
if (configId) {
  Object.assign(editableConfig, structuredClone(pomodoroStore.getUserConfig(configId)))
}

if (!editableConfig.longBreak) {
  editableConfig.longBreak = {}
}

const configName = useTemplateRef('configName')
const userId = useUserStore().loggedUser._id

const firstStepDone = ref(false)
const focusMinutes = ref(null)

async function saveConfig(close) {
  try {
    if (configId) {
      userConfigs.set(configId, toRaw(editableConfig))
      if (pomodoroStore.isConfigSelected(configId))
        pomodoroStore.setCurrentConfig(configId)
      await updatePomodoroConfig(editableConfig)
      toast.success('Focus saved!')
    } else {
      const createdConfig = await createPomodoroConfig(userId, editableConfig)
      userConfigs.set(createdConfig._id, createdConfig)
      Object.assign(editableConfig, defaultConfig)
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
    userConfigs.delete(configId)
    await deletePomodoroConfig(configId)
    toast.success('Focus deleted')
    close()
  } catch (error) {
    console.error(error.message)
    toast.error('Failed to delete focus')
  }
}

async function openHandler() {
  if (configId)
    firstStepDone.value = true
  else
    firstStepDone.value = false
  await nextTick()
  configName.value.focus()
}

function updateProposedFocus(minutes) {
  if (minutes === '' || Number(minutes) <= 1) {
    focusMinutes.value = null
    Object.assign(editableConfig, defaultConfig)
    return
  }
  const resultConfig = {}

  minutes = Number(minutes)
  if (minutes < 15) {
    resultConfig.pomodoroTime = Math.floor(minutes * 2 / 3)
    resultConfig.shortBreakTime = minutes - resultConfig.pomodoroTime
    resultConfig.cycles = 1
    editableConfig.value = resultConfig
    focusMinutes.value = minutes
    return
  }

  let cycleDuration
  let proportion
  let longBreakInterval
  let longBreakTime
  if (minutes < 120) {
    cycleDuration = 15
    proportion = 4 / 5
    longBreakInterval = 2
    longBreakTime = 8
  } else if (minutes < 480) {
    cycleDuration = 30
    proportion = 5 / 6
    longBreakInterval = 3
    longBreakTime = 10
  } else {
    cycleDuration = 45
    proportion = 7 / 9
    longBreakInterval = 4
    longBreakTime = 15
  }


  resultConfig.pomodoroTime = Math.ceil(cycleDuration * proportion)
  resultConfig.shortBreakTime = cycleDuration - resultConfig.pomodoroTime

  let { minutes: minutesWithout, cycles: cyclesWithout } = computeMinutes(minutes, resultConfig)
  let { minutes: minutesWith, cycles: cyclesWith, numberOfLongBreaks } = computeMinutes(minutes, {
    ...resultConfig,
    longBreak: {
      time: longBreakTime,
      interval: longBreakInterval
    }
  })

  if (numberOfLongBreaks >= 3 || (numberOfLongBreaks >= 2 && Math.abs(minutesWith - minutes) <= Math.abs(minutesWithout - minutes))) {
    resultConfig.longBreak = {
      time: longBreakTime,
      interval: longBreakInterval
    }

    resultConfig.cycles = cyclesWith
    focusMinutes.value = minutesWith
  } else {
    resultConfig.cycles = cyclesWithout
    focusMinutes.value = minutesWithout
  }

  Object.assign(editableConfig, resultConfig)
}

function computeMinutes(minutes, config) {
  let l = 0
  let m = Number(0)
  let c = 0
  let nbrLongBreaks = 0
  while (m < minutes) {
    c++
    m += config.pomodoroTime
    if (!config.longBreak) {
      m += config.shortBreakTime
      continue
    }

    if (l == config.longBreak.interval) {
      m += config.longBreak.time
      l = 0
      nbrLongBreaks++
    } else {
      m += config.shortBreakTime
      l++
    }
  }
  return { minutes: m, cycles: c, numberOfLongBreaks: nbrLongBreaks }
}

function isLongBreakRequired() {
  if (!editableConfig.longBreak.time && !editableConfig.longBreak.interval)
    return false

  return editableConfig.longBreak.time !== '' || editableConfig.longBreak.interval !== ''
}

</script>
<style scoped>
.btn-neutral {
  @apply bg-transparent border-none text-neutral;
}

.btn-neutral:hover {
  @apply bg-transparent border-none text-neutral;
}

.form-control .label {
  padding-top: 0 !important;
}

.btn-outline {
  border-style: solid !important;
}
</style>
