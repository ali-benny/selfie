<template>
  <div ref="container" class="container grid grid-cols-3 gap-5 place-content-center h-[85dvh]">
    <div class="bg-base-200 rounded-xl" data-swapy-slot="1">
      <div class="col-md-6 p-3 rounded-xl shadow-sm bg-surface-0" data-swapy-item="calendar">
        Calendar
      </div>
    </div>
    <div class="bg-base-200 col-span-2 rounded-xl" data-swapy-slot="2">
      <div class="p-3 rounded-xl shadow-sm bg-surface-0" data-swapy-item="notes">
        <div class="flex flew-row justify-between">
          <h4 class="font-semibold text-lg ml-3">Last Notes</h4>
          <Popper arrow>
            <button
              class="btn btn-circle btn-sm transform hover:rotate-45 text-lg hover:text-secondary btn-ghost"
            >
              <Icon icon="fluent:settings-16-filled" />
            </button>
            <template #content>
              <div class="flex flex-row items-center p-3">
                <span class="label-text w-28">Show Last Notes</span>
                <input
                  type="number"
                  placeholder="5"
                  v-model="lastModified"
                  class="input input-sm input-bordered w-16"
                  pattern="[0-9]*"
                />
              </div>
            </template>
          </Popper>
        </div>
        <NoteView
          viewMode="list"
          :lastModified="lastModified"
          :edit="false"
          :extended="false"
        ></NoteView>
      </div>
    </div>
    <div class="bg-base-200 col-span-2 rounded-xl" data-swapy-slot="3">
      <div class="h-100 min-h-36 p-3 rounded-xl shadow-sm bg-surface-0" data-swapy-item="project">
        Projects' Gantt View
      </div>
    </div>
    <div class="bg-base-200 rounded-xl" data-swapy-slot="4">
      <div
        class="h-100 p-3 flex justify-center item-center bg-light rounded-xl shadow-sm bg-surface-0"
        data-swapy-item="pomodoro"
      >
        <div class="w-full p-1">
          <PomodoroTimer data-swapy-no-drag />
        </div>
      </div>
    </div>
  </div>
  <!-- <RouterLink to="/login">Login</RouterLink> -->
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { createSwapy } from 'swapy'
import PomodoroTimer from '@/components/pomodoro/PomodoroTimer.vue'
import NoteView from '@/components/note/NoteView.vue'

const container = ref(null)
const lastModified = ref(3)

onMounted(() => {
  if (container.value) {
    const swapy = createSwapy(container.value, {
      animation: 'dynamic' // Può essere 'dynamic', 'spring' o 'none'
    })
    swapy.onSwap(({ data }) => {
      localStorage.setItem('dashboard', JSON.stringify(data.object))
    })
  }
})
</script>
