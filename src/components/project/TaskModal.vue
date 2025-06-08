<template>
  <!-- Task Modal Overlay - Solo quando visible è true -->
  <div 
    v-if="visible"
    class="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50" 
    @click.self="$emit('close')"
  >
    <div class="bg-base-100 rounded-lg shadow-xl border border-base-300 w-full max-w-xl max-h-[85vh] overflow-y-auto" @click.stop>
      <div class="p-6">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-2xl font-bold">{{ task ? 'Modifica Task' : 'Nuova Task' }}</h3>
          <button @click="$emit('close')" class="btn btn-ghost btn-sm btn-circle">
            <Icon icon="mingcute:close-fill" />
          </button>
        </div>
            <!-- Form -->
            <form @submit.prevent="handleSubmit" class="space-y-6">
              <!-- Title -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-semibold">Titolo *</span>
                </label>
                <input 
                  v-model="formData.title" 
                  type="text" 
                  placeholder="Inserisci il titolo della task" 
                  class="input input-bordered w-full" 
                  required 
                />
              </div>

              <!-- Description -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-semibold">Descrizione</span>
                </label>
                <textarea 
                  v-model="formData.description" 
                  class="textarea textarea-bordered h-24" 
                  placeholder="Descrizione della task"
                ></textarea>
              </div>

              <!-- Type and State -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-semibold">Tipo</span>
                  </label>
                  <select v-model="formData.type" class="select select-bordered w-full text-md">
                    <option value="task"><Icon icon="fluent:clipboard-task-24-filled" /> Task</option>
                    <option value="milestone"><Icon icon="mingcute:target-fill"/> Milestone</option>
                    <option value="phase"><Icon icon="mingcute:flag-4-fill"/> Fase</option>
                  </select>
                </div>
                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-semibold">Stato</span>
                  </label>
                  <select v-model="formData.state" class="select select-bordered w-full">
                    <option value="not_activatable">Non attivabile</option>
                    <option value="activatable">Attivabile</option>
                    <option value="active">Attiva</option>
                    <option value="completed">Completata</option>
                    <option value="delayed">In ritardo</option>
                    <option value="abandoned">Abbandonata</option>
                  </select>
                </div>
              </div>

              <!-- Phase -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-semibold">Fase</span>
                </label>
                <input 
                  v-model="formData.phase" 
                  list="phases"
                  type="text" 
                  placeholder="Inserisci o seleziona una fase" 
                  class="input input-bordered w-full" 
                />
                <datalist id="phases">
                  <option v-for="phase in availablePhases" :key="phase" :value="phase">
                    {{ phase }}
                  </option>
                </datalist>
              </div>

              <!-- Dates -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-semibold">Data Inizio</span>
                  </label>
                  <input 
                    v-model="formData.startDate" 
                    type="date" 
                    class="input input-bordered w-full" 
                  />
                </div>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-semibold">Data Fine</span>
                  </label>
                  <input 
                    v-model="formData.endDate" 
                    type="date" 
                    class="input input-bordered w-full" 
                  />
                </div>
              </div>

              <!-- Estimated Hours and Progress -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-semibold">Ore Stimate</span>
                  </label>
                  <input 
                    v-model.number="formData.estimatedHours" 
                    type="number" 
                    min="0" 
                    step="0.5"
                    placeholder="0" 
                    class="input input-bordered w-full" 
                  />
                </div>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-semibold">Progresso (%)</span>
                  </label>
                  <input 
                    v-model.number="formData.progress" 
                    type="number" 
                    min="0" 
                    max="100"
                    placeholder="0" 
                    class="input input-bordered w-full" 
                  />
                </div>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-semibold">Priorità</span>
                  </label>
                  <select v-model="formData.priority" class="select select-bordered w-full">
                    <option value="low">🟢 Bassa</option>
                    <option value="medium">🟡 Media</option>
                    <option value="high">🟠 Alta</option>
                    <option value="urgent">🔴 Urgente</option>
                  </select>
                </div>
              </div>

              <!-- Assigned Users -->
              <div class="form-control" v-if="projectMembers && projectMembers.length > 0">
                <label class="label">
                  <span class="label-text font-semibold">Utenti Assegnati</span>
                </label>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-base-200 rounded-lg">
                  <label 
                    v-for="member in projectMembers" 
                    :key="member.userId" 
                    class="cursor-pointer label justify-start gap-3 p-2 hover:bg-base-300 rounded"
                  >
                    <input 
                      v-model="formData.assignedUsers" 
                      :value="member.userId"
                      type="checkbox" 
                      class="checkbox checkbox-primary checkbox-sm" 
                    />
                    <span class="label-text">{{ member.username }}</span>
                  </label>
                </div>
              </div>

              <!-- Pomodoro Settings -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-semibold">🍅 Pomodori Stimati</span>
                </label>
                <input 
                  v-model.number="formData.pomodoro.estimatedPomodoros" 
                  type="number" 
                  min="0"
                  placeholder="0" 
                  class="input input-bordered w-full" 
                />
                <div class="label">
                  <span class="label-text-alt">Numero di pomodori stimati per completare la task</span>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex justify-end gap-3 pt-4 border-t">
                <button type="button" @click="$emit('close')" class="btn btn-ghost">
                  Annulla
                </button>
                <button type="submit" class="btn btn-primary" :disabled="!formData.title">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {{ task ? 'Aggiorna' : 'Crea' }} Task
                </button>              </div>
            </form>
          </div>
        </div>
      </div>
    </template>

<script>
import { ref, computed, watch } from 'vue'

export default {
  name: "TaskModal",
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    task: {
      type: Object,
      default: null
    },
    projectId: {
      type: String,
      required: true
    },
    projectMembers: {
      type: Array,
      default: () => []
    },
    availablePhases: {
      type: Array,
      default: () => []
    }
  },
  emits: ['close', 'save'],
  setup(props, { emit }) {
    // Form data
    const formData = ref({
      title: '',
      description: '',
      type: 'task',
      phase: '',
      startDate: '',
      endDate: '',
      assignedUsers: [],
      estimatedHours: 0,
      progress: 0,
      priority: 'medium',
      state: 'not_activatable',
      pomodoro: {
        estimatedPomodoros: 0,
        completedPomodoros: 0
      }
    })

    // Initialize form data
    const initializeForm = () => {
      if (props.task) {
        formData.value = {
          ...props.task,
          startDate: props.task.startDate ? props.task.startDate.split('T')[0] : '',
          endDate: props.task.endDate ? props.task.endDate.split('T')[0] : '',
          assignedUsers: props.task.assignedUsers || [],
          progress: Math.round((props.task.progress || 0) * 100), // Convert to percentage
          pomodoro: {
            estimatedPomodoros: props.task.pomodoro?.estimatedPomodoros || 0,
            completedPomodoros: props.task.pomodoro?.completedPomodoros || 0
          }
        }
      } else {
        formData.value = {
          title: '',
          description: '',
          type: 'task',
          phase: '',
          startDate: '',
          endDate: '',
          assignedUsers: [],
          estimatedHours: 0,
          progress: 0,
          priority: 'medium',
          state: 'not_activatable',
          pomodoro: {
            estimatedPomodoros: 0,
            completedPomodoros: 0
          }
        }
      }
    }

    // Watch for changes in task prop
    watch(() => props.task, initializeForm, { immediate: true })
    watch(() => props.visible, (newVal) => {
      if (newVal) {
        initializeForm()
      }
    })

    const handleSubmit = () => {
      if (!formData.value.title.trim()) {
        return
      }

      // Prepare data for save
      const taskData = {
        ...formData.value,
        projectId: props.projectId,
        progress: formData.value.progress / 100, // Convert percentage to decimal
        startDate: formData.value.startDate ? new Date(formData.value.startDate + 'T00:00:00') : null,
        endDate: formData.value.endDate ? new Date(formData.value.endDate + 'T23:59:59') : null,
      }

      emit('save', taskData)
    }

    return {
      formData,
      handleSubmit
    }  }
}
</script>

<style scoped>
/* Forza la visibilità dei bordi per tutti gli elementi del form */
.input-bordered,
.textarea-bordered,
.select-bordered {
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  background-color: rgba(0, 0, 0, 0.1);
}

/* Tema scuro specifico per Catppuccin */
[data-theme="macchiato"] .input-bordered,
[data-theme="macchiato"] .textarea-bordered,
[data-theme="macchiato"] .select-bordered {
  border: 1px solid #6c7086 !important; /* Catppuccin overlay1 */
  background-color: #1e2030; /* Catppuccin surface0 */
  color: #cad3f5; /* Catppuccin text */
}

/* Focus state per tutti i temi */
.input-bordered:focus,
.textarea-bordered:focus,
.select-bordered:focus {
  border-color: #8aadf4 !important; /* Catppuccin blue */
  outline: 2px solid rgba(138, 173, 244, 0.3) !important;
  outline-offset: 2px;
  box-shadow: 0 0 0 3px rgba(138, 173, 244, 0.1) !important;
}

/* Stile per il modal container */
.bg-base-100 {
  background-color: #24273a !important; /* Catppuccin base */
  border: 1px solid #494d64 !important; /* Catppuccin surface2 */
}

/* Assicura che il testo sia sempre visibile */
.label-text {
  color: #cad3f5 !important; /* Catppuccin text */
  font-weight: 600;
}

/* Stile per i placeholder */
.input::placeholder,
.textarea::placeholder {
  color: #a5adcb !important; /* Catppuccin subtext0 */
}

/* Fix per i select che potrebbero avere problemi di visibilità */
.select-bordered option {
  background-color: #1e2030 !important;
  color: #cad3f5 !important;
}

/* Background per le sezioni con utenti assegnati */
.bg-base-200 {
  background-color: #1e2030 !important;
  border: 1px solid #494d64 !important;
}

.hover\:bg-base-300:hover {
  background-color: #363a4f !important;
}

/* Checkbox styling */
.checkbox-primary {
  border-color: #6c7086 !important;
}

.checkbox-primary:checked {
  background-color: #8aadf4 !important;
  border-color: #8aadf4 !important;
}
</style>
