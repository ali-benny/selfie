<template>
  <div v-if="isOpen" class="modal modal-open">
    <div class="modal-box w-11/12 max-w-2xl">
      <h3 class="font-bold text-lg mb-4">
        <Icon icon="fluent:task-list-add-24-filled" class="inline mr-2" />
        Nuovo Todo
      </h3>

      <form @submit.prevent="saveTodo" class="space-y-4">
        <!-- Titolo -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Titolo *</span>
          </label>
          <input
            v-model="todo.title"
            type="text"
            placeholder="Cosa devi fare?"
            class="input input-bordered w-full"
            required
            ref="titleInput"
          />
        </div>

        <!-- Descrizione -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Descrizione</span>
          </label>
          <textarea
            v-model="todo.description"
            placeholder="Dettagli opzionali..."
            class="textarea textarea-bordered h-24"
          ></textarea>
        </div>

        <!-- Data di scadenza -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Scadenza</span>
          </label>
          <input v-model="todo.dueDate" type="datetime-local" class="input input-bordered w-full" />
        </div>

        <!-- Priorità -->
        <!-- <div class="form-control"> -->
        <!--   <label class="label"> -->
        <!--     <span class="label-text font-medium">Priorità</span> -->
        <!--   </label> -->
        <!--   <select v-model="todo.priority" class="select select-bordered w-full"> -->
        <!--     <option value="low">🟢 Bassa</option> -->
        <!--     <option value="medium">🟡 Media</option> -->
        <!--     <option value="high">🔴 Alta</option> -->
        <!--     <option value="urgent">🚨 Urgente</option> -->
        <!--   </select> -->
        <!-- </div> -->

        <!-- Categoria -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Categoria</span>
          </label>
          <select v-model="todo.category" class="select select-bordered w-full">
            <option value="personal">👤 Personale</option>
            <option value="work">💼 Lavoro</option>
            <option value="study">📚 Studio</option>
            <option value="health">🏥 Salute</option>
            <option value="travel">✈️ Viaggi</option>
            <option value="other">📝 Altro</option>
          </select>
        </div>

        <!-- Pomodoro Settings -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">
              <Icon icon="fluent:timer-24-filled" class="inline mr-1" />
              Pomodoro estimated
            </span>
          </label>
          <div class="flex items-center gap-4">
            <input
              v-model.number="todo.pomodoro.estimatedPomodoros"
              type="number"
              min="0"
              max="20"
              class="input input-bordered w-20"
            />
            <span class="text-sm text-base-content/70"> ({{ estimatedTime }} time estimated) </span>
          </div>
        </div>

        <!-- Azioni -->
        <div class="modal-action">
          <button type="button" @click="closeModal" class="btn btn-ghost">Annulla</button>
          <button type="submit" class="btn btn-primary" :disabled="!todo.title.trim() || isSaving">
            <Icon v-if="isSaving" icon="mingcute:loading-3-fill" class="animate-spin mr-2" />
            <Icon v-else icon="fluent:checkmark-24-filled" class="mr-2" />
            {{ isSaving ? 'Salvataggio...' : 'Crea Todo' }}
          </button>
        </div>
      </form>
    </div>
    <div class="modal-backdrop" @click="closeModal"></div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useCalendarStore } from '@/stores/calendar.js'
import { useUserStore } from '@/stores/account.js'
import { SERVER_URL } from '@/const.js'

const calendarStore = useCalendarStore()
const userStore = useUserStore()

// Props & Emits
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  initialDate: {
    type: Date,
    default: null
  }
})

const emit = defineEmits(['close', 'created'])

// Refs
const titleInput = ref(null)
const isSaving = ref(false)

// Todo model
const todo = ref({
  title: '',
  description: '',
  dueDate: '',
  priority: 'medium',
  category: 'personal',
  pomodoro: {
    estimatedPomodoros: 1,
    completedPomodoros: 0,
    sessions: []
  },
  type: 'simple',
  status: 'todo',
  userId: ''
})

// Computed
const estimatedTime = computed(() => {
  const minutes = todo.value.pomodoro.estimatedPomodoros * 25
  if (minutes < 60) {
    return `${minutes}min`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`
})

// Watchers
watch(
  () => props.isOpen,
  async (newValue) => {
    if (newValue) {
      resetForm()
      // Focus sul campo titolo
      nextTick(() => {
        titleInput.value?.focus()
      })
    }
  }
)

watch(
  () => props.initialDate,
  (newDate) => {
    if (newDate) {
      // Imposta la data di scadenza sulla data selezionata
      const isoString = new Date(newDate.getTime() - newDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
      todo.value.dueDate = isoString
    }
  }
)

// Carica i progetti quando l'utente è disponibile
watch(
  () => userStore.loggedUser,
  (newUser) => {
    if (newUser?._id && props.isOpen) {
    }
  },
  { immediate: true }
)

// Methods
const resetForm = () => {
  todo.value = {
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    category: 'personal',
    pomodoro: {
      estimatedPomodoros: 1,
      completedPomodoros: 0,
      sessions: []
    },
    type: 'simple',
    status: 'todo',
    userId: userStore.loggedUser?._id || ''
  }

  // Se c'è una data iniziale, impostala
  if (props.initialDate) {
    const isoString = new Date(
      props.initialDate.getTime() - props.initialDate.getTimezoneOffset() * 60000
    )
      .toISOString()
      .slice(0, 16)
    todo.value.dueDate = isoString
  }
}

const saveTodo = async () => {
  if (!todo.value.title.trim()) return
  isSaving.value = true
  try {
    // Prepara i dati del todo
    const todoData = { ...todo.value }

    // Converte la data in formato ISO se presente
    if (todoData.dueDate) {
      todoData.dueDate = new Date(todoData.dueDate).toISOString()
    }

    // Chiama l'API unificata per creare il todo
    const response = await fetch(`${SERVER_URL}/api/todo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(todoData)
    })

    if (response.ok) {
      const createdTodo = await response.json()

      // Aggiorna il calendario
      await calendarStore.fetchCalendarItems()

      // Notifica la creazione
      emit('created', createdTodo)
      closeModal()
    } else {
      const errorData = await response.text()
      console.error('📝 Server error:', errorData)
      throw new Error(`Errore nella creazione del todo: ${response.status}`)
    }
  } catch (error) {
    console.error('Error creating todo:', error)
    // TODO: Mostra toast di errore
  } finally {
    isSaving.value = false
  }
}

const closeModal = () => {
  emit('close')
}
</script>

<style scoped>
.modal-backdrop {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>
