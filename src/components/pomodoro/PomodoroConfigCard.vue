<template>
  <div
    class="max-w-full xs:max-w-56 sm:max-w-64 h-full card"
    @click="selectConfig"
    :class="{ selected: isConfigSelected }"
  >
    <div class="card-body relative">
      <!-- Form edit -->
      <div @click.stop class="absolute top-4 right-4 flex justify-center align-center">
        <PomodoroConfigForm :configId="configId">
          <template #trigger>
            <button class="z-10 text-secondary">
              <Icon icon="fluent:edit-48-filled" />
            </button>
          </template>
        </PomodoroConfigForm>
      </div>

      <!-- Icona e titolo -->
      <div class="card-title flex-col">
        <IconPomodoro :color="config.color.hex" class="text-5xl" />
        <div class="flex items-center gap-2">
          <h3 class="grow text-center m-0">{{ config.name }}</h3>
          <UserShare @click.stop type="Pomodoro" :id="config._id">
            <button class="flex items-center mt-1">
              <Icon icon="fluent:share-48-regular" class="!text-neutral hover:!text-accent" />
            </button>
          </UserShare>
        </div>
      </div>

      <PomodoroConfigInfo :config="config" />
    </div>
  </div>
  <dialog v-if="confirmConfigSelection" :id="modalId" :ref="modalId" class="modal">
    <div class="modal-box">
      <h3 class="font-bold">Caution!</h3>
      <p class="py-3">
        Changing focus now will interrupt your current session and lose its progress.
      </p>
      <div class="flex items-center gap-2">
        <input
          type="checkbox"
          id="dontAskAgain"
          name="dontAskAgain"
          class="checkbox checkbox-sm border-solid"
          v-model="dontAskAgain"
        />
        <label for="dontAskAgain" class="cursor-pointer">Don't ask again.</label>
      </div>
      <div class="modal-action">
        <form method="dialog" class="flex gap-2">
          <button class="btn btn-ghost">Dismiss</button>
          <button class="btn btn-primary" @click="submitConfirmConfigSelection">Confirm</button>
        </form>
      </div>
    </div>
  </dialog>
</template>

<script setup>
import PomodoroConfigForm from './PomodoroConfigForm.vue'
import PomodoroConfigInfo from './PomodoroConfigInfo.vue'
import UserShare from '../UserShare.vue'
import IconPomodoro from '../icons/IconPomodoro.vue'
import { usePomodoroStore } from '@/stores/pomodoro'
import { computed, ref, useTemplateRef } from 'vue'
import { storeToRefs } from 'pinia'
import { useLocalStorage } from '@vueuse/core'

const { configId } = defineProps({
  configId: {
    type: String,
    required: true
  }
})
const { pomodoro, userConfigs } = storeToRefs(usePomodoroStore())
const config = computed(() => userConfigs.value.get(configId))
const isConfigSelected = computed(
  () => !pomodoro.value.finished && usePomodoroStore().isConfigSelected(configId)
)

const modalId = computed(() => `confirmConfigSelection${config.value._id}`)
const modal = useTemplateRef(modalId.value)

const dontAskAgain = ref(false)
const confirmConfigSelection = useLocalStorage('pomodoro.confirmConfigSelection', true)

function selectConfig() {
  if (isConfigSelected.value) return
  if (confirmConfigSelection.value && pomodoro.value.started && !pomodoro.value.finished) {
    modal.value.showModal()
    return
  }
  usePomodoroStore().setCurrentConfig(config.value)
}

async function submitConfirmConfigSelection() {
  confirmConfigSelection.value = !dontAskAgain.value
  dontAskAgain.value = false

  usePomodoroStore().setCurrentConfig(config.value)
}
</script>

<style lang="postcss" scoped>
.card {
  @apply transition-all bg-base-200 shadow-lg shadow-base-300 border-2 border-base-300;
}

.card:hover,
.card.selected {
  @apply border-2 bg-base-300/80;
}

.card:hover {
  @apply cursor-pointer;
  border-color: v-bind('config?.color.hex + 95') !important;
  --tw-shadow-color: v-bind('config?.color.hex + 60');
}

.card.selected {
  border-color: v-bind('config?.color.hex') !important;
  --tw-shadow-color: v-bind('config?.color.hex + 80');
}

.card.selected:hover {
  @apply cursor-default;
}
</style>
