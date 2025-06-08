<template>
  <!-- Progress Modal Overlay -->  <div 
    class="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center p-4 z-50" 
    @click.self="$emit('close')"
  >
    <div class="bg-base-100 rounded-lg shadow-xl w-full max-w-md" @click.stop>
          <div class="p-6">
            <!-- Header -->
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-xl font-bold">Aggiorna Progresso</h3>
              <button @click="$emit('close')" class="btn btn-ghost btn-sm btn-circle">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <!-- Form -->
            <form @submit.prevent="saveProgress" class="space-y-4">
              <!-- Task Name -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-semibold">Task</span>
                </label>
                <div class="p-3 bg-base-200 rounded-lg font-medium">
                  {{ task?.title || task?.name || 'N/A' }}
                </div>
              </div>
              
              <!-- Progress Input -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-semibold">Progresso (%)</span>
                </label>
                <input
                  v-model.number="progress"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  class="input input-bordered w-full"
                  required
                />
                <div class="label">
                  <span class="label-text-alt">Inserisci la percentuale di completamento</span>
                </div>
              </div>
              
              <!-- Actions -->
              <div class="flex justify-end gap-3 pt-4 border-t">
                <button type="button" @click="$emit('close')" class="btn btn-ghost">
                  Annulla
                </button>
                <button type="submit" class="btn btn-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Salva Progresso
                </button>
              </div>            </form>
          </div>
        </div>
      </div>
    </template>

<script>
import { ref, watch } from 'vue'

export default {
  name: "ProgressModal",
  props: {
    task: {
      type: Object,
      required: true
    }
  },
  emits: ['close', 'save'],
  setup(props, { emit }) {
    // Convert task progress from decimal (0-1) to percentage (0-100) for display
    const progress = ref(Math.round((props.task?.progress || 0) * 100))

    // Watch for changes in task prop
    watch(
      () => props.task,
      (newTask) => {
        if (newTask) {
          progress.value = Math.round((newTask.progress || 0) * 100)
        }
      }
    )

    const saveProgress = () => {
      if (progress.value < 0 || progress.value > 100) {
        return
      }

      // Convert percentage back to decimal and emit
      const progressData = {
        progress: progress.value / 100, // Convert percentage to decimal
        actualHours: props.task.actualHours || 0
      }

      emit('save', progressData)
    }

    return {
      progress,
      saveProgress
    }
  }
}
</script>