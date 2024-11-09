<template>
  <div ref="container" class="container grid grid-cols-3 gap-5 place-content-center h-[85dvh]">
    <div class="bg-base-200 rounded-xl" data-swapy-slot="1">
      <div class="col-md-6 p-3 rounded-xl shadow-sm bg-surface-0" data-swapy-item="calendar">
        Calendar
      </div>
    </div>
    <div class="bg-base-200 col-span-2 rounded-xl" data-swapy-slot="2">
      <div class="p-3 rounded-xl shadow-sm bg-surface-0" data-swapy-item="notes">
        <h4>Last Notes</h4>
        <NoteView viewMode="list" :lastModified="3" :edit="false" :extended="false"></NoteView>
      </div>
    </div>
    <div class="bg-base-200 col-span-2 rounded-xl" data-swapy-slot="3">
      <div class="h-100 min-h-36 p-3 rounded-xl shadow-sm bg-surface-0" data-swapy-item="project">
        Projects' Gantt View
      </div>
    </div>
    <div class="bg-base-200 rounded-xl" data-swapy-slot="4">
      <div class="h-100 p-3 bg-light rounded-xl shadow-sm bg-surface-0" data-swapy-item="pomodoro">
        Pomodoro Timer
      </div>
    </div>
  </div>
  <!-- <RouterLink to="/login">Login</RouterLink> -->
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { createSwapy } from 'swapy'
import NoteView from '@/components/NoteView.vue'

const container = ref(null)
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
