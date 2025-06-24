<template>
  <div class="calendar-container h-full flex flex-col">
    <!-- Header del calendario -->
    <div class="calendar-header bg-base-200 rounded-xl p-4 mb-4">
      <div class="flex justify-between items-center">
        <!-- Navigazione -->
        <div class="flex items-center gap-2">
          <button
            @click="calendarStore.navigatePrevious()"
            class="btn btn-sm btn-ghost"
            :disabled="isLoading"
          >
            <Icon icon="fluent:chevron-left-24-filled" />
          </button>

          <button
            @click="calendarStore.navigateToday()"
            class="btn btn-sm !btn-primary"
            :disabled="isLoading"
          >
            Oggi
          </button>

          <button
            @click="calendarStore.navigateNext()"
            class="btn btn-sm btn-ghost"
            :disabled="isLoading"
          >
            <Icon icon="fluent:chevron-right-24-filled" />
          </button>
        </div>

        <!-- Titolo -->
        <h2 class="text-xl font-bold">
          {{ formatCurrentPeriod() }}
        </h2>

        <!-- Selettore vista -->
        <div class="join">
          <button
            v-for="view in views"
            :key="view.value"
            @click="calendarStore.changeView(view.value)"
            class="btn btn-sm join-item"
            :class="{
              '!btn-primary': currentView === view.value,
              'btn-outline': currentView !== view.value
            }"
          >
            {{ view.label }}
          </button>
        </div>
      </div>

      <!-- Barra azioni -->
      <div class="flex justify-between items-center mt-4">
        <div class="flex gap-2">
          <button @click="openEventModal({})" class="btn btn-sm btn-accent">
            <Icon icon="fluent:add-24-filled" />
            Nuovo Evento
          </button>
          <button @click="openQuickTodoModal()" class="btn btn-sm btn-primary">
            <Icon icon="fluent:task-list-add-24-filled" />
            Nuovo Todo
          </button>
        </div>
        <!-- Filtri -->
        <div class="flex items-center gap-4">
          <!-- Filtri categoria -->
          <div class="dropdown dropdown-end">
            <div tabindex="0" role="button" class="btn btn-sm btn-ghost">
              <Icon icon="fluent:filter-24-filled" />
              Categorie
              <Icon icon="fluent:chevron-down-24-filled" />
            </div>
            <ul
              tabindex="0"
              class="dropdown-content menu bg-base-100 rounded-box z-[1] w-56 p-2 shadow border border-base-300"
            >
              <li class="menu-title">
                <span>Filtra per categoria</span>
              </li>
              <li v-for="category in calendarStore.eventCategories" :key="category.value">
                <label class="label cursor-pointer">
                  <span class="flex items-center gap-2">
                    <span>{{ category.icon }}</span>
                    <span>{{ category.label }}</span>
                  </span>
                  <input
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    :checked="calendarStore.activeCategories.includes(category.value)"
                    @change="calendarStore.toggleCategoryFilter(category.value)"
                  />
                </label>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Contenuto calendario -->
    <div class="calendar-content flex-1 bg-base-100 rounded-xl overflow-hidden">
      <div v-if="isLoading" class="flex justify-center items-center h-full">
        <Icon icon="mingcute:loading-3-fill" class="animate-spin text-4xl text-primary" />
      </div>

      <div v-else class="h-full">
        <!-- Vista Mensile -->
        <CalendarMonthView
          v-if="currentView === 'month'"
          @create-event="openEventModal"
          @create-todo="openQuickTodoModal"
          @select-event="openEventModal"
          @day-selected="goToDay"
        />

        <!-- Vista Settimanale -->
        <CalendarWeekView
          v-else-if="currentView === 'week'"
          @create-event="openEventModal"
          @create-todo="openQuickTodoModal"
          @select-event="openEventModal"
          @day-selected="goToDay"
        />

        <!-- Vista Giornaliera -->
        <CalendarDayView
          v-else-if="currentView === 'day'"
          @create-event="openEventModal"
          @create-todo="openQuickTodoModal"
          @select-event="openEventModal"
        />
      </div>
    </div>
    <!-- Modal Creazione/Modifica Evento -->
    <EventModal
      :is-visible="showEventModal"
      :event="selectedEvent"
      :initial-data="eventModalInitialData"
      @close="closeEventModal"
      @save="onEventSaved"
      @delete="onEventDeleted"
    />
    <!-- Modal Creazione Rapida Todo -->
    <QuickTodoModal
      :is-open="showQuickTodoModal"
      :initial-date="todoModalInitialDate"
      @close="closeQuickTodoModal"
      @created="onTodoCreated"
    />

    <!-- Modal Visualizzazione/Modifica Todo -->
    <TodoModal
      :is-visible="showTodoModal"
      :todo="selectedTodo"
      @close="closeTodoModal"
      @saved="onTodoSaved"
      @deleted="onTodoDeleted"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useCalendarStore } from '@/stores/calendar'
import { storeToRefs } from 'pinia'
import CalendarMonthView from './CalendarMonthView.vue'
import CalendarWeekView from './CalendarWeekView.vue'
import CalendarDayView from './CalendarDayView.vue'
import EventModal from './EventModal.vue'
import QuickTodoModal from './QuickTodoModal.vue'
import TodoModal from './TodoModal.vue'

const calendarStore = useCalendarStore()
const { currentView, currentDate, visibleEvents, isLoading } = storeToRefs(calendarStore)

// State locale
const showEventModal = ref(false)
const showQuickTodoModal = ref(false)
const showTodoModal = ref(false)
const showEvents = ref(true)
const showTodos = ref(true)
const selectedEvent = ref(null)
const selectedTodo = ref(null)
const eventModalInitialData = ref({})
const todoModalInitialDate = ref(null)

// Opzioni delle viste
const views = [
  { value: 'day', label: 'Giorno' },
  { value: 'week', label: 'Settimana' },
  { value: 'month', label: 'Mese' }
]

// Computed
const filteredEvents = computed(() => {
  return visibleEvents.value.filter((event) => {
    if (event.type === 'todo') {
      return showTodos.value
    } else {
      return showEvents.value
    }
  })
})

// Methods
const formatCurrentPeriod = () => {
  const date = currentDate.value
  const options = {
    month: 'long',
    year: 'numeric',
    ...(currentView.value === 'day' && { day: 'numeric' })
  }

  if (currentView.value === 'week') {
    const startOfWeek = new Date(date)
    const dayOfWeek = startOfWeek.getDay()
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(endOfWeek.getDate() + 6)

    return `${startOfWeek.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}`
  }

  return date.toLocaleDateString('it-IT', options)
}

const openEventModal = (eventOrData) => {
  // Se è un todo, apri il modal specifico per todo
  if (eventOrData && (eventOrData.type === 'todo' || eventOrData.type === 'simple')) {
    selectedTodo.value = eventOrData
    showTodoModal.value = true
    return
  }

  if (eventOrData && eventOrData._id) {
    // Modifica evento esistente
    selectedEvent.value = eventOrData
    eventModalInitialData.value = {}
  } else {
    // Nuovo evento con dati iniziali
    selectedEvent.value = null
    eventModalInitialData.value = eventOrData || {}
  }
  showEventModal.value = true
}

const closeEventModal = () => {
  showEventModal.value = false
  selectedEvent.value = null
  eventModalInitialData.value = {}
}

const openQuickTodoModal = (initialDate = null) => {
  todoModalInitialDate.value = initialDate || new Date()
  showQuickTodoModal.value = true
}

const closeQuickTodoModal = () => {
  showQuickTodoModal.value = false
  todoModalInitialDate.value = null
}

const closeTodoModal = () => {
  showTodoModal.value = false
  selectedTodo.value = null
}

const onEventSaved = async () => {
  // L'evento è già stato salvato nel modal, aggiorniamo solo la vista
  await calendarStore.fetchCalendarItems()
  closeEventModal()
}

const onEventDeleted = async () => {
  // L'evento è già stato eliminato nel modal, aggiorniamo solo la vista
  await calendarStore.fetchCalendarItems()
  closeEventModal()
}

const onTodoCreated = async (todo) => {
  // Il todo è già stato salvato nel modal, aggiorniamo solo la vista
  await calendarStore.fetchCalendarItems()
  closeQuickTodoModal()

  // Feedback positivo
  console.log('Todo creato con successo!', todo)
}

const onTodoSaved = async (todo) => {
  await calendarStore.fetchCalendarItems()
  closeTodoModal()
  console.log('Todo aggiornato con successo!', todo)
}

const onTodoDeleted = async (todoId) => {
  await calendarStore.fetchCalendarItems()
  closeTodoModal()
  console.log('Todo eliminato con successo!', todoId)
}

const goToDay = (day) => {
  calendarStore.setCurrentDate(day)
  calendarStore.changeView('day')
}

// Lifecycle
onMounted(() => {
  calendarStore.fetchCalendarItems()
})
</script>

<style scoped>
.calendar-container {
  height: calc(100vh - 8rem);
}

.calendar-content {
  min-height: 500px;
}
</style>
