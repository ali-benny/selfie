<template>
  <Popper @open:popper="openHandler" :locked="locked" :placement="placement" arrow>
    <slot name="trigger"></slot>
    <template #content="{ close }">
      <div
        class="w-screen sm:w-80 cursor-default p-3 rounded-box flex flex-col items-stretch gap-2"
        @keyup.escape="close()"
      >
        <!-- Header e delete -->
        <div class="flex justify-between items-center">
          <h4 class="font-bold">
            <span v-if="configId">Edit your focus</span>
            <span v-else>Create your new focus</span>
          </h4>
          <button
            class="btn btn-outline btn-error btn-sm"
            @click="deleteConfig(close)"
            :disabled="pomodoroStore.isConfigSelected(configId)"
            v-if="configId"
          >
            <Icon icon="fluent:delete-32-regular" />
          </button>
        </div>

        <form @submit.prevent="saveConfig(close)" ref="form">
          <div class="flex flex-col items-stretch gap-y-2">
            <!-- Nome -->
            <label class="form-control">
              <div class="label">
                <span class="label-text">Name</span>
              </div>
              <input
                type="text"
                v-model="editableConfig.name"
                class="input input-md"
                placeholder="Pomodoro"
                ref="configName"
                :required="firstStepDone"
              />
            </label>
            <div
              v-if="!firstStepDone"
              class="flex flex-col justify-between items-stretch h-[19em] gap-1"
            >
              <h5 class="font-semibold flex items-center">Desired focus duration:</h5>
              <div class="flex items-center gap-2">
                <div class="relative input input-md flex justify-center items-center grow">
                  <label
                    class="flex justify-center items-center"
                    v-if="editableConfig.durationFormat === 'mm'"
                  >
                    <input
                      @keypress="updateProposedFocus()"
                      v-model="totalMinutes"
                      type="text"
                      maxlength="3"
                      size="3"
                      inputmode="numeric"
                      pattern="[0-9]*"
                      placeholder="120"
                      class="text-center"
                      required
                    />
                    minutes
                  </label>
                  <div class="flex justify-end items-center" v-else>
                    <input
                      @keypress="updateProposedFocus()"
                      v-model="hours"
                      type="text"
                      class="text-center"
                      maxlength="2"
                      size="2"
                      inputmode="numeric"
                      pattern="[0-9]*"
                      placeholder="2"
                      required
                    />
                    h
                    <input
                      @input="
                        (e) => {
                          if (e.target.value.length > 2)
                            e.target.value = e.target.value.substr(0, 2)
                        }
                      "
                      @keypress="updateProposedFocus()"
                      v-model="minutes"
                      type="text"
                      class="text-center"
                      maxlength="3"
                      size="2"
                      inputmode="numeric"
                      pattern="[0-9]*"
                      placeholder="00"
                      required
                    />
                    m
                  </div>
                  <div
                    class="absolute top-0 right-0 w-fit h-full flex justify-center items-center pr-3 gap-2 pt-1"
                  >
                    <ToggleSpin
                      v-model="preferredDurationFormat"
                      true-value="mm"
                      false-value="hhmm"
                    />
                  </div>
                </div>
              </div>
              <div class="flex flex-col justify-between items-stretch gap-1">
                <h5 class="font-semibold flex items-center">Proposed focus:</h5>
                <PomodoroConfigInfo :config="editableConfig" />
              </div>
              <div class="flex justify-end items-center">
                <div class="btn btn-neutral" @click="firstStepDone = true">Skip</div>
                <div
                  class="btn btn-outline btn-secondary"
                  @click="
                    () => {
                      if (form.reportValidity()) firstStepDone = true
                    }
                  "
                >
                  Next
                </div>
              </div>
            </div>
            <div v-else class="flex flex-col justify-between items-stretch h-[19em]">
              <!-- Pomodoro time -->
              <div class="flex flex-col">
                <h5 class="font-medium flex items-center">
                  <Icon icon="fluent:clock-24-regular" class="pr-1" />Timer (minutes)
                </h5>
                <div class="w-full grid grid-cols-3 gap-4">
                  <label class="form-control">
                    <div class="label">
                      <span class="label-text">Focus</span>
                    </div>
                    <input
                      type="text"
                      v-model="pomodoroTime"
                      class="w-fit input input-md text-center"
                      maxlength="2"
                      size="2"
                      inputmode="numeric"
                      pattern="[0-9]*"
                      placeholder="25"
                      required
                    />
                  </label>

                  <label class="form-control">
                    <div class="label">
                      <span class="label-text">Short break</span>
                    </div>
                    <input
                      type="text"
                      v-model="shortBreakTime"
                      class="w-fit input input-md text-center"
                      maxlength="2"
                      size="2"
                      inputmode="numeric"
                      pattern="[0-9]*"
                      placeholder="5"
                      required
                    />
                  </label>

                  <label class="form-control">
                    <div class="label">
                      <span class="label-text">Long break</span>
                    </div>
                    <input
                      type="text"
                      v-model="longBreakTime"
                      class="w-fit input input-md text-center"
                      maxlength="2"
                      size="2"
                      inputmode="numeric"
                      pattern="[0-9]*"
                      placeholder="-"
                      :required="isLongBreakRequired()"
                    />
                  </label>
                </div>
              </div>
              <div class="flex justify-between items-center">
                <label>Long break interval</label>
                <input
                  type="text"
                  v-model="longBreakInterval"
                  class="input input-sm"
                  maxlength="2"
                  size="2"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  placeholder="-"
                  :required="isLongBreakRequired()"
                />
              </div>

              <div class="flex justify-between items-center">
                <label>Cycles</label>
                <input
                  type="text"
                  v-model="cycles"
                  class="input input-sm"
                  maxlength="2"
                  size="2"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  placeholder="-"
                />
              </div>

              <div class="flex justify-between items-center">
                <span>Total duration: </span>
                <div class="flex justify-center items-center gap-2 select-none">
                  <div v-if="duration === Infinity" class="input input-sm flex items-center gap-2">
                    Inf
                    <Icon
                      icon="fluent-emoji-flat:three-oclock"
                      inline
                      class="text-lg"
                      title="Total focus duration."
                    />
                  </div>
                  <div v-else class="flex items-center gap-2">
                    <ToggleSpin
                      v-model="editableConfig.durationFormat"
                      true-value="mm"
                      false-value="hhmm"
                    />
                    <div class="input input-sm px-2">
                      <div class="w-20 flex justify-end items-center gap-1">
                        {{ formattedDuration }}
                        <Icon
                          icon="fluent-emoji-flat:three-oclock"
                          inline
                          class="text-lg"
                          title="Total focus duration."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Colore -->
              <div class="flex justify-between items-center">
                <label>Color</label>
                <select
                  name="color"
                  v-model="editableConfig.color"
                  class="select select-sm"
                  required
                >
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
              <div class="flex flex-row justify-end gap-1">
                <button type="button" class="btn btn-ghost" @click="close()">Cancel</button>
                <input type="submit" value="Save" class="btn btn-outline btn-secondary" />
              </div>
            </div>
          </div>
        </form>
      </div>
    </template>
  </Popper>
</template>

<script setup>
import { flavors } from '@catppuccin/palette'
import {
  createPomodoroConfig,
  deletePomodoroConfig,
  initialConfig,
  updatePomodoroConfig
} from '@/router/pomodoro/pomodoro'
import { useUserStore } from '@/stores/account'
import { nextTick, ref, useTemplateRef, toRaw, computed, watch } from 'vue'
import { usePomodoroStore } from '@/stores/pomodoro'
import PomodoroConfigInfo from './PomodoroConfigInfo.vue'
import { storeToRefs } from 'pinia'
import { useDebounceFn, whenever } from '@vueuse/core'
import ToggleSpin from '../ToggleSpin.vue'

// const toast = useNotivue()

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

const { configId, placement, locked } = defineProps({
  configId: {
    type: String,
    default: null
  },
  placement: String,
  locked: Boolean
})

const pomodoroStore = usePomodoroStore()
const { userConfigs } = storeToRefs(pomodoroStore)
const { preferredDurationFormat } = storeToRefs(pomodoroStore)
const userId = useUserStore().loggedUser._id
const firstStepDone = ref(false)

const configName = useTemplateRef('configName')
const form = useTemplateRef('form')

const config = configId ? pomodoroStore.getUserConfig(configId) : initialConfig
const editableConfig = ref({ ...config })

if (!configId) {
  editableConfig.value.durationFormat = preferredDurationFormat.value
}

/* Used in first step to input the desired focus duration */
const desiredDuration = ref(0)

/* Used in second step to display the focus duration */
const duration = computed(() => pomodoroStore.computeConfigDuration(editableConfig))
const formattedDuration = computed(() =>
  pomodoroStore.formatDuration(duration.value, editableConfig.value.durationFormat)
)

const pomodoroTime = computed(
  buildConfigField({ fieldName: 'pomodoroTime', validators: [validateMinutes] })
)
const shortBreakTime = computed(
  buildConfigField({ fieldName: 'shortBreakTime', validators: [validateMinutes] })
)
const cycles = computed(
  buildConfigField({ fieldName: 'cycles', validators: [validateNumberPositive] })
)

const longBreakTime = computed(buildLongBreakField('time'))
const longBreakInterval = computed(buildLongBreakField('interval'))

const totalMinutes = computed({
  get() {
    return desiredDuration.value == 0 ? null : Number(desiredDuration.value)
  },
  set(value) {
    if (validateNumberPositive(value)) desiredDuration.value = value
    else desiredDuration.value = null
  }
})

const hours = computed({
  get() {
    return desiredDuration.value == 0 ? null : Math.floor(Number(desiredDuration.value) / 60)
  },
  set(value) {
    desiredDuration.value = Number(minutes.value)
    if (validateNumberPositive(value)) desiredDuration.value += Number(value) * 60
  }
})

const minutes = computed({
  get() {
    if (desiredDuration.value == 0) return null
    const value = Number(desiredDuration.value) - hours.value * 60
    if (value < 10) return '0' + value
    return value
  },
  async set(value) {
    desiredDuration.value = hours.value * 60
    value %= 100
    if (validateMinutes(value)) desiredDuration.value += Number(value)
  }
})

whenever(
  () => desiredDuration.value == null,
  () => (desiredDuration.value = 0)
)

watch(preferredDurationFormat, () => {
  editableConfig.value.durationFormat = preferredDurationFormat.value
})

async function saveConfig(close) {
  try {
    if (configId) {
      userConfigs.value.set(configId, { ...toRaw(editableConfig) })
      await updatePomodoroConfig(toRaw(editableConfig))
      if (pomodoroStore.isConfigSelected(config._id)) pomodoroStore.setCurrentConfig(config)
      push.success('Focus saved!')
    } else {
      const createdConfig = await createPomodoroConfig(userId, toRaw(editableConfig))
      userConfigs.value.set(createdConfig._id, createdConfig)
      push.success('Focus created successfully!')
    }

    close()
  } catch (error) {
    console.error(error.message)
    push.error('Failed to save focus')
  }
}

async function deleteConfig(close) {
  try {
    userConfigs.value.delete(configId)
    await deletePomodoroConfig(configId)
    push.success('Focus deleted')
    close()
  } catch (error) {
    console.error(error.message)
    push.error('Failed to delete focus')
  }
}

async function openHandler() {
  if (configId) firstStepDone.value = true
  else firstStepDone.value = false

  desiredDuration.value = 0

  if (configId) {
    Object.assign(editableConfig, structuredClone(pomodoroStore.getUserConfig(configId)))
  } else {
    editableConfig.value.durationFormat = preferredDurationFormat.value
  }

  await nextTick()
  configName.value.focus()
}

const updateProposedFocus = useDebounceFn(() => {
  const minutes = desiredDuration.value
  const resultConfig = { longBreak: {} }

  if (isNaN(minutes) || minutes <= 1) {
    desiredDuration.value = null
    editableConfig.value = initialConfig
    return
  }

  if (minutes < 15) {
    resultConfig.pomodoroTime = Math.floor((minutes * 2) / 3)
    resultConfig.shortBreakTime = minutes - resultConfig.pomodoroTime
    resultConfig.cycles = 1
    Object.assign(editableConfig, resultConfig)
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
  let {
    minutes: minutesWith,
    cycles: cyclesWith,
    numberOfLongBreaks
  } = computeMinutes(minutes, {
    ...resultConfig,
    longBreak: {
      time: longBreakTime,
      interval: longBreakInterval
    }
  })

  if (
    numberOfLongBreaks >= 3 ||
    (numberOfLongBreaks >= 2 &&
      Math.abs(minutesWith - minutes) <= Math.abs(minutesWithout - minutes))
  ) {
    resultConfig.longBreak = {
      time: longBreakTime,
      interval: longBreakInterval
    }

    resultConfig.cycles = cyclesWith
  } else {
    resultConfig.cycles = cyclesWithout
  }

  Object.assign(editableConfig, resultConfig)
}, 300)

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
  if (!editableConfig.value.longBreak) return false

  if (!editableConfig.value.longBreak.time && !editableConfig.value.longBreak.interval) return false

  return (
    editableConfig.value.longBreak.time !== '' || editableConfig.value.longBreak.interval !== ''
  )
}

function validateNumber(n) {
  return n !== '' && !isNaN(n)
}

function validateNumberPositive(n) {
  return validateNumber(n) && Number(n) > 0
}

function validateMinutes(n) {
  return validateNumberPositive(n) && Number(n) <= 60
}

function buildConfigField({ fieldName, validators = [] }) {
  return {
    get() {
      return editableConfig[fieldName]
    },
    async set(value) {
      let valid = true
      validators.forEach((validator) => (valid &= validator(value)))
      if (valid) editableConfig[fieldName] = value
      else await invalidate({ fieldName: fieldName })
    }
  }
}

function buildLongBreakField(longBreakSubField) {
  return {
    get() {
      return editableConfig.value.longBreak
        ? editableConfig.value.longBreak[longBreakSubField]
        : undefined
    },
    set(value) {
      if (validateNumberPositive(value)) {
        if (!editableConfig.value.longBreak) editableConfig.value.longBreak = {}
        editableConfig.value.longBreak[longBreakSubField] = Number(value)
      } else {
        invalidate({ fieldName: longBreakSubField })
      }
    }
  }
}

async function invalidate({ fieldName, subfieldName }) {
  if (subfieldName) {
    if (!editableConfig[fieldName][subfieldName]) {
      editableConfig[fieldName][subfieldName] = {}
      await nextTick()
    }
    delete editableConfig[fieldName][subfieldName]
    if (!editableConfig[fieldName]) delete editableConfig[fieldName]
  } else {
    if (!editableConfig[fieldName]) {
      editableConfig[fieldName] = {}
      await nextTick()
    }
    delete editableConfig[fieldName]
  }
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

.spin {
  animation: myspin 500ms ease-in-out infinite forwards;
}

@keyframes myspin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(180deg);
  }
}
</style>
