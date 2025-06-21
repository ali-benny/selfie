<template>
  <div v-if="isVisible" class="modal modal-open">
    <div class="modal-box w-11/12 max-w-3xl">
      <h3 class="font-bold text-lg mb-4">
        <Icon icon="fluent:task-list-24-filled" class="inline mr-2" />
        {{ isEditing ? 'Modifica Todo' : 'Dettagli Todo' }}
      </h3>

      <form @submit.prevent="saveTodo" class="space-y-4">
        <!-- Titolo -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Title *</span>
          </label>
          <input
            v-model="todoData.title"
            type="text"
            placeholder="Cosa devi fare?"
            class="input input-bordered w-full"
            :disabled="!isEditing"
            required
          />
        </div>

        <!-- Descrizione -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Description</span>
          </label>
          <textarea
            v-model="todoData.description"
            placeholder="Dettagli..."
            class="textarea textarea-bordered h-24"
            :disabled="!isEditing"
          ></textarea>
        </div>

        <!-- Row con Date e Status -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Data di scadenza -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">Date</span>
            </label>
            <input
              v-model="todoData.dueDate"
              type="datetime-local"
              class="input input-bordered w-full"
              :disabled="!isEditing"
            />
          </div>

          <!-- Status -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">Status</span>
            </label>
            <div class="flex items-center gap-4">
              <label class="label cursor-pointer gap-2">
                <input 
                  type="checkbox" 
                  v-model="todoData.checked" 
                  class="checkbox checkbox-primary"
                  :disabled="!isEditing"
                />
                <span class="label-text">Completed</span>
              </label>
              <div class="text-sm text-base-content/70">
                {{ todoData.progress || 0 }}% progress
              </div>
            </div>
          </div>
        </div>

        <!-- Row con Priorità e Categoria -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Priorità -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">Priority</span>
            </label>
            <select v-model="todoData.priority" class="select select-bordered w-full" :disabled="!isEditing">
              <option value="low">🟢 Bassa</option>
              <option value="medium">🟡 Media</option>
              <option value="high">🔴 Alta</option>
              <option value="urgent">🚨 Urgente</option>
            </select>
          </div>

          <!-- Categoria -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">Ctegory</span>
            </label>
            <select v-model="todoData.category" class="select select-bordered w-full" :disabled="!isEditing">
              <option value="personal">👤 Personale</option>
              <option value="work">💼 Lavoro</option>
              <option value="study">📚 Studio</option>
              <option value="health">🏥 Salute</option>
              <option value="household">🏠 Casa</option>
              <option value="finance">💰 Finanze</option>
              <option value="social">👥 Sociale</option>
              <option value="hobby">🎨 Hobby</option>
              <option value="shopping">🛒 Shopping</option>
              <option value="travel">✈️ Viaggi</option>
              <option value="other">📝 Altro</option>
            </select>
          </div>
        </div>

        <!-- Sezione Pomodoro -->
        <div class="card bg-error/5 border border-error/20">
          <div class="card-body p-4">
            <h4 class="card-title text-base">
              <Icon icon="fluent:timer-24-filled" class="!text-error" />
              Gestione Pomodoro
            </h4>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Pomodori stimati -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">Pomodori estimated</span>
                </label>
                <div class="flex items-center gap-4">
                  <input
                    v-model.number="todoData.pomodoro.estimatedPomodoros"
                    type="number"
                    min="0"
                    max="20"
                    class="input input-bordered w-20"
                    :disabled="!isEditing"
                  />
                  <span class="text-sm text-base-content/70">
                    ({{ estimatedTime }} time estimated)
                  </span>
                </div>
              </div>

              <!-- Pomodori completati -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">Pomodori completed</span>
                </label>
                <div class="flex items-center gap-4">
                  <span class="text-2xl font-bold !text-error">
                    {{ todoData.pomodoro.completedPomodoros || 0 }}
                  </span>
                  <span class="text-sm text-base-content/70">
                    / {{ todoData.pomodoro.estimatedPomodoros || 1 }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Pulsante Avvia Pomodoro -->
            <div class="mt-4">
              <button 
                type="button"
                @click="startPomodoro"
                class="btn btn-error btn-sm"
                :disabled="isSaving"
              >
                <Icon icon="fluent:timer-24-filled" class="mr-2" />
                Start Pomodoro for this Todo
              </button>
            </div>
          </div>
        </div>

        <!-- Progetto (se presente) -->
        <div v-if="todoData.projectId" class="card bg-primary/5 border border-primary/20">
          <div class="card-body p-4">
            <h4 class="card-title text-base">
              <Icon icon="fluent:folder-24-filled" class="!text-primary" />
              Project
            </h4>
            <!-- <p>ID Progetto: {{ todoData }}</p> -->
            <span class="badge badge-primary">{{ todoData.type === 'project_task' ? 'Project Task' : 'Basic Todo' }}</span>
          </div>
        </div>

        <!-- Azioni -->
        <div class="modal-action">
          <button type="button" @click="closeModal" class="btn btn-ghost">
            Close
          </button>
          
          <button 
            v-if="!isEditing" 
            type="button" 
            @click="isEditing = true" 
            class="btn btn-primary"
          >
            <Icon icon="fluent:edit-24-filled" class="mr-2" />
            Edit
          </button>
          
          <template v-else>
            <button type="button" @click="cancelEdit" class="btn btn-ghost">
              Don't Edit
            </button>
            <button type="submit" class="btn btn-primary" :disabled="!todoData.title.trim() || isSaving">
              <Icon v-if="isSaving" icon="mingcute:loading-3-fill" class="animate-spin mr-2" />
              <Icon v-else icon="fluent:checkmark-24-filled" class="mr-2" />
              {{ isSaving ? 'Salvataggio...' : 'Salva' }}
            </button>
            <button 
              type="button" 
              @click="deleteTodo" 
              class="btn btn-error"
              :disabled="isSaving"
            >
              <Icon icon="fluent:delete-24-filled" class="mr-2" />
              Delete
            </button>
          </template>
        </div>
      </form>
    </div>
    <div class="modal-backdrop" @click="closeModal"></div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { useCalendarStore } from '@/stores/calendar.js'
import { useUserStore } from '@/stores/account.js'
import { SERVER_URL } from '@/const.js'

const calendarStore = useCalendarStore()
const userStore = useUserStore()

// Props & Emits
const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  todo: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'saved', 'deleted'])

// Refs
const isEditing = ref(false)
const isSaving = ref(false)
const originalData = ref(null)

// Todo data model
const todoData = ref({
  _id: '',
  title: '',
  description: '',
  dueDate: '',
  priority: 'medium',
  category: 'personal',
  checked: false,
  progress: 0,
  pomodoro: {
    estimatedPomodoros: 1,
    completedPomodoros: 0,
    sessions: []
  },
  projectId: '',
  type: 'todo'
})

// Computed
const estimatedTime = computed(() => {
  const minutes = todoData.value.pomodoro.estimatedPomodoros * 25
  if (minutes < 60) {
    return `${minutes}min`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`
})

// Watchers
watch(() => props.todo, (newTodo) => {
  if (newTodo) {
    loadTodoData(newTodo)
  }
}, { immediate: true })

watch(() => props.isVisible, (visible) => {
  if (!visible) {
    isEditing.value = false
  }
})

// Methods
const loadTodoData = (todo) => {
  if (!todo) return

  // Pulisci il titolo dall'icona se presente
  let cleanTitle = todo.title
  if (cleanTitle.startsWith('📋 ') || cleanTitle.startsWith('⏰ ')) {
    cleanTitle = cleanTitle.substring(2).trim()
  }

  todoData.value = {
    _id: todo._id,
    title: cleanTitle,
    description: todo.description || '',
    dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString().slice(0, 16) : '',
    priority: todo.priority || 'medium',
    category: todo.category || 'personal',
    checked: todo.checked || false,
    progress: todo.progress || 0,
    pomodoro: {
      estimatedPomodoros: todo.pomodoro?.estimatedPomodoros || 1,
      completedPomodoros: todo.pomodoro?.completedPomodoros || 0,
      sessions: todo.pomodoro?.sessions || []
    },
    projectId: todo.projectId || '',
    type: todo.type || 'todo'
  }

  // Salva i dati originali per il cancel
  originalData.value = JSON.parse(JSON.stringify(todoData.value))
}

const saveTodo = async () => {
  if (!todoData.value.title.trim()) return

  isSaving.value = true
  try {
    const dataToSave = { ...todoData.value }
    
    // Converte la data in formato ISO se presente
    if (dataToSave.dueDate) {
      dataToSave.dueDate = new Date(dataToSave.dueDate).toISOString()
    }

    // Rimuovi campi non necessari per il backend
    delete dataToSave._id

    const response = await fetch(`${SERVER_URL}/api/todo/${todoData.value._id}`, {      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dataToSave)
    })

    if (response.ok) {
      const updatedTodo = await response.json()
      
      // Aggiorna il calendario
      await calendarStore.fetchCalendarItems()
      
      // Notifica il parent
      emit('saved', updatedTodo)
      
      isEditing.value = false
    } else {
      throw new Error('Errore nel salvataggio del todo')
    }
  } catch (error) {
    console.error('Error saving todo:', error)
    // TODO: Mostra toast di errore
  } finally {
    isSaving.value = false
  }
}

const deleteTodo = async () => {
  if (!confirm('Sei sicuro di voler eliminare questo todo?')) return

  isSaving.value = true
  try {    const response = await fetch(`${SERVER_URL}/api/todo/${todoData.value._id}`, {
      method: 'DELETE'
    })

    if (response.ok) {
      // Aggiorna il calendario
      await calendarStore.fetchCalendarItems()
      
      // Notifica il parent
      emit('deleted', todoData.value._id)
      closeModal()
      
    } else {
      throw new Error('Errore nell\'eliminazione del todo')
    }
  } catch (error) {
    console.error('Error deleting todo:', error)
    // TODO: Mostra toast di errore
  } finally {
    isSaving.value = false
  }
}

const startPomodoro = async () => {
  try {
    await calendarStore.startPomodoroFromTodo(todoData.value)
    // TODO: Mostra toast di successo
  } catch (error) {
    console.error('Errore nell\'avvio del pomodoro:', error)
    // TODO: Mostra toast di errore
  }
}

const cancelEdit = () => {
  if (originalData.value) {
    todoData.value = JSON.parse(JSON.stringify(originalData.value))
  }
  isEditing.value = false
}

const closeModal = () => {
  isEditing.value = false
  emit('close')
}
</script>

<style scoped>
.modal-backdrop {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>
