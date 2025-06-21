<template>
  <div class="h-full flex flex-col bg-base-100">
    <!-- Header mese -->
    <div class="bg-base-200 rounded-lg p-4 mb-4">
      <div class="flex justify-between items-center">
        <div class="flex flex-col">
          <h2 class="text-xl font-bold text-base-content">
            {{ formatMonthTitle() }}
          </h2>
          <span class="text-sm text-subtext-0">{{ monthEvents.length }} eventi questo mese</span>
        </div>
        <button @click="createEvent()" class="btn btn-sm btn-primary">
          <Icon icon="fluent:add-24-filled" />
          Nuovo evento
        </button>
      </div>
    </div>

    <!-- Header giorni settimana -->
    <div class="grid grid-cols-7 gap-1 mb-2">
      <div
        v-for="day in weekdayNames"
        :key="day"
        class="text-center text-sm font-semibold text-subtext-1 py-2"
      >
        {{ day }}
      </div>
    </div>

    <!-- Griglia calendario -->
    <div class="flex-1 grid grid-rows-6 gap-1">
      <div
        v-for="(week, weekIndex) in monthWeeks"
        :key="weekIndex"        class="grid grid-cols-7 gap-1 min-h-32"
      >        <div
          v-for="day in week"
          :key="day ? day.toISOString() : `empty-${weekIndex}`"
          :data-day="day ? day.toISOString().split('T')[0] : null"
          :class="[
            'relative border rounded-lg p-2 cursor-pointer transition-all duration-200',
            'hover:bg-base-200 hover:shadow-sm',
            {
              'border-base-300 bg-base-100': day && isCurrentMonth(day),
              'border-base-300/30 bg-base-200/30 text-subtext-0': day && !isCurrentMonth(day),
              'border-primary !bg-primary/20 !text-primary font-semibold': day && isToday(day),
              'border-secondary bg-secondary/10': day && isSelected(day),
              'border-l-4 border-l-accent': day && getDayEvents(day).length > 0,
              'opacity-0 pointer-events-none': !day,
              'drop-zone-valid': day && isDragging && isValidDropZone(day.toISOString().split('T')[0]),
              'drop-zone-highlighted': day && isDropZoneHighlighted(day.toISOString().split('T')[0])
            }
          ]"          @click="selectDay(day)"
          @mouseenter="day && handleDayDragEnter(day)"
          @mouseleave="handleDayDragLeave"
        >
          <!-- Numero del giorno -->
          <div class="flex justify-between items-start mb-1">
            <span class="text-sm font-medium">
              {{ day ? day.getDate() : '' }}
            </span>
            <!-- Quick add button -->
            <button
              v-if="day && getDayEvents(day).length === 0"
              @click.stop="createEventAt(day)"
              class="opacity-0 hover:opacity-100 transition-opacity duration-200 btn btn-xs btn-ghost text-primary"
            >
              <Icon icon="fluent:add-12-filled" />
            </button>
          </div>

          <!-- Eventi del giorno -->
          <div v-if="day" class="space-y-1">
            <!-- Mostra primi eventi -->
            <div
              v-for="(event, index) in getDayEvents(day).slice(0, 3)"
              :key="event._id || event.id"
              :class="[
                'text-xs px-2 py-1 rounded truncate cursor-pointer transition-colors duration-200 flex items-center gap-1 event-draggable',
                getEventClasses(event),
                { dragging: isDragging && draggedEventData?._id === event._id }
              ]"
              @click.stop="selectEvent(event)"
              @mousedown="handleEventMouseDown($event, event, $event)"
              :title="event.title"
            >
              <span v-if="event.type !== 'todo'">{{
                calendarStore.getCategoryByValue(event.category || 'other').icon
              }}</span>
              <span v-else>⏰</span>
              <span class="truncate">{{ event.title }}</span>
            </div>

            <!-- Indicator per eventi aggiuntivi -->
            <div
              v-if="getDayEvents(day).length > 3"
              @click.stop="showMoreEvents(day)"
              class="text-xs text-subtext-1 hover:text-primary cursor-pointer font-medium"
            >
              +{{ getDayEvents(day).length - 3 }} altri
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal eventi giorno -->
    <div
      v-if="showDayEventsModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click="closeDayEventsModal"
    >
      <div
        class="bg-base-100 rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col"
        @click.stop
      >
        <!-- Header Modal -->
        <div class="flex justify-between items-center p-4 border-b border-base-300">
          <h3 class="text-lg font-semibold">{{ formatSelectedDayTitle() }}</h3>
          <button @click="closeDayEventsModal" class="btn btn-sm btn-ghost btn-circle">
            <Icon icon="fluent:dismiss-24-filled" />
          </button>
        </div>

        <!-- Content Modal -->
        <div class="flex-1 overflow-y-auto p-4">
          <div class="space-y-3">
            <div
              v-for="event in selectedDayEvents"
              :key="event._id || event.id"
              :class="[
                'card bg-base-200 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md',
                getEventClasses(event, 'full')
              ]"
              @click="selectEvent(event)"
            >
              <div class="card-body p-4">                <div class="flex justify-between items-start">
                  <div class="flex items-center gap-2">
                    <span v-if="event.type === 'todo'">⏰</span>
                    <span v-else-if="event.type === 'project_task'">📋</span>
                    <span v-else>{{
                      calendarStore.getCategoryByValue(event.category || 'other').icon
                    }}</span>
                    <h4 class="card-title text-base">{{ event.title }}</h4>
                  </div>
                  <span class="text-sm text-subtext-1">{{ formatEventTime(event) }}</span>
                </div>
                <div v-if="event.description" class="text-sm text-subtext-0 mt-2">
                  {{ event.description }}
                </div>
                <div
                  v-if="event.location"
                  class="text-sm text-subtext-0 mt-1 flex items-center gap-1"
                >
                  <Icon icon="fluent:location-24-filled" />
                  {{ event.location }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions Modal -->
        <div class="p-4 border-t border-base-300">
          <button @click="createEventAt(selectedDayForModal)" class="btn btn-primary btn-sm w-full">
            <Icon icon="fluent:add-24-filled" />
            Nuovo evento
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// TODO: refactor using Composition API
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useCalendarStore } from '@/stores/calendar'
import { useCalendarDragDrop } from '@/composables/useDragAndDrop'
import { now, today } from '@/stores/timeMachine'
import { Icon } from '@iconify/vue'

export default {
  name: 'CalendarMonthView',
  components: {
    Icon
  },
  emits: ['create-event', 'select-event', 'day-selected'],
  setup(props, { emit }) {
    const calendarStore = useCalendarStore()

    // Drag & Drop setup
    const dragDrop = useCalendarDragDrop(calendarStore)

    const selectedEventId = ref(null)
    const selectedDay = ref(null)
    const showDayEventsModal = ref(false)
    const selectedDayForModal = ref(null)

    // Nomi giorni settimana
    // TODO: creare costante e poi renderla reactive
    const weekdayNames = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']    // Mese corrente
    const currentMonth = computed(() => {
      return new Date(
        calendarStore.currentDate.getFullYear(),
        calendarStore.currentDate.getMonth(),
        1
      )
    })    // Settimane del mese (con giorni precedenti/successivi per riempire griglia)
    const monthWeeks = computed(() => {
      const weeks = []
      const year = currentMonth.value.getFullYear()
      const month = currentMonth.value.getMonth()
      
      // Crea primo giorno del mese in UTC per evitare problemi di fuso orario
      const firstDay = new Date(Date.UTC(year, month, 1))
      
      // Calcola primo lunedì della vista (potrebbe essere del mese precedente)
      const firstDayOfWeek = firstDay.getUTCDay() === 0 ? 6 : firstDay.getUTCDay() - 1 // Lunedì = 0
      const startDate = new Date(firstDay)
      startDate.setUTCDate(firstDay.getUTCDate() - firstDayOfWeek)

      // Genera 6 settimane
      let currentDate = new Date(startDate)
      for (let week = 0; week < 6; week++) {
        const weekDays = []
        for (let day = 0; day < 7; day++) {
          weekDays.push(new Date(currentDate))
          currentDate.setUTCDate(currentDate.getUTCDate() + 1)
        }
        weeks.push(weekDays)
      }      return weeks
    })
    
    // Eventi del mese
    const monthEvents = computed(() => {
      const startOfMonth = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth(), 1)
      const endOfMonth = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 0)

      return calendarStore.visibleEvents.filter(event => {
        // Use standardized property names: start for events, dueDate for todos
        const eventDate = new Date(event.start || event.dueDate)
        return eventDate >= startOfMonth && eventDate <= endOfMonth
      })
    })

    // Eventi del giorno selezionato per modal
    const selectedDayEvents = computed(() => {
      if (!selectedDayForModal.value) return []
      return getDayEvents(selectedDayForModal.value)
    })

    // Formattazione
    const formatMonthTitle = () => {
      return currentMonth.value
        .toLocaleDateString('it-IT', {
          month: 'long',
          year: 'numeric'
        })
        .replace(/^\w/, (c) => c.toUpperCase())
    }

    const formatSelectedDayTitle = () => {
      if (!selectedDayForModal.value) return ''
      return selectedDayForModal.value
        .toLocaleDateString('it-IT', {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        })
        .replace(/^\w/, (c) => c.toUpperCase())
    }

    const formatEventTime = (event) => {
      if (event.type === 'todo' && event.dueDate) {
        return new Date(event.dueDate).toLocaleTimeString('it-IT', {
          hour: '2-digit',
          minute: '2-digit'
        })
      }
        if (event.allDay) {
        return 'Tutto il giorno'
      }

      // Use standardized startTime property or extract from start date
      if (event.start && !event.allDay) {
        const startTime = new Date(event.start).toLocaleTimeString('it-IT', {
          hour: '2-digit',
          minute: '2-digit'
        })

        if (event.end) {
          const endTime = new Date(event.end).toLocaleTimeString('it-IT', {
            hour: '2-digit',
            minute: '2-digit'
          })
          return `${startTime} - ${endTime}`
        }
        return startTime
      }

      if (event.startTime) {
        if (event.endTime) {
          return `${event.startTime} - ${event.endTime}`
        }
        return event.startTime
      }      return ''
    }

    // Utility
    const isCurrentMonth = (date) => {
      return (
        date.getUTCMonth() === currentMonth.value.getMonth() &&
        date.getUTCFullYear() === currentMonth.value.getFullYear()
      )
    }    
      const isToday = (date) => {
      const todayDate = today() // Use virtual time
      // Usa UTC per confrontare solo le date, non gli orari
      const todayUTC = new Date(Date.UTC(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate()))
      const dateUTC = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
      return todayUTC.getTime() === dateUTC.getTime()
    }

    const isSelected = (date) => {
      if (!selectedDay.value) return false
      // Usa UTC per confrontare solo le date      const selectedUTC = new Date(Date.UTC(selectedDay.value.getFullYear(), selectedDay.value.getMonth(), selectedDay.value.getDate()))
      const dateUTC = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
      return selectedUTC.getTime() === dateUTC.getTime()
    }

    const truncateText = (text, maxLength) => {
      if (text.length <= maxLength) return text
      return text.substring(0, maxLength) + '...'
    }
    
    // Eventi per giorno
    const getDayEvents = (day) => {
      return calendarStore.visibleEvents.filter(event => {
        // Use standardized property names: start for events, dueDate for todos
        const eventDate = new Date(event.start || event.dueDate)
        
        // Usa UTC per confrontare solo le date, ignorando gli orari
        const eventDateUTC = new Date(Date.UTC(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()))
        const dayUTC = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()))
        
        return eventDateUTC.getTime() === dayUTC.getTime()
      }).sort((a, b) => {
        // Ordina per orario, eventi tutto il giorno prima
        if (a.allDay && !b.allDay) return -1
        if (!a.allDay && b.allDay) return 1

        const timeA = a.startTime || (a.dueDate ? new Date(a.dueDate).toTimeString() : '00:00')
        const timeB = b.startTime || (b.dueDate ? new Date(b.dueDate).toTimeString() : '00:00')
        return timeA.localeCompare(timeB)
      })
    }

    // Classe CSS per tipo evento
    const getEventTypeClass = (event) => {
      if (event.type === 'todo') {
        return 'event-todo'
      }
      return 'event-calendar'
    }

    // Classi DaisyUI per eventi
    const getEventClasses = (event, variant = 'small') => {
      const baseClasses = []

      if (event.type === 'todo') {
        if (variant === 'full') {
          baseClasses.push('border-l-4 border-l-warning bg-warning/10')
        } else {
          baseClasses.push('bg-warning/20 text-warning-content border-warning/30')
        }
      } else {
        // Get category color scheme
        const category = calendarStore.getCategoryByValue(event.category || 'other')

        if (variant === 'full') {
          baseClasses.push(`border-l-4 border-l-primary ${category.colors.accent}`)        } else {
          baseClasses.push(`${category.colors.bg} ${category.colors.border}`)
        }
      }
      
      return baseClasses.join(' ')
    }

    // Azioni
    const createEvent = () => {
      emit('create-event', {})
    }

    const createEventAt = (day) => {
      if (!day) return
      emit('create-event', {
        date: day
      })
    }

    const selectEvent = (event) => {
      selectedEventId.value = event._id || event.id
      emit('select-event', event)
      if (showDayEventsModal.value) {
        closeDayEventsModal()
      }
    }

    const selectDay = (day) => {
      if (!day) return
      selectedDay.value = day
      emit('day-selected', day)
    }

    const showMoreEvents = (day) => {
      selectedDayForModal.value = day
      showDayEventsModal.value = true
    }

    const closeDayEventsModal = () => {
      showDayEventsModal.value = false
      selectedDayForModal.value = null
    }    // Drag & Drop handlers
    const handleEventMouseDown = (event, eventData, mouseEvent) => {
      mouseEvent.preventDefault()
      dragDrop.startDrag(event.currentTarget, eventData, mouseEvent)
    }

    const handleMouseMove = (event) => {
      dragDrop.updateDragPosition(event)
      
      // Se stiamo draggando, trova la cella sotto il mouse
      if (dragDrop.isDragging.value) {
        const elementUnderMouse = document.elementFromPoint(event.clientX, event.clientY)
        if (elementUnderMouse) {
          // Trova la cella del calendario più vicina
          const dayCell = elementUnderMouse.closest('[data-day]')
          if (dayCell) {
            const dayString = dayCell.getAttribute('data-day')
            if (dayString && dayString !== dragDrop.dropZoneDate.value) {
              dragDrop.onDropZoneEnter(dayString)
            }
          }
        }
      }
    }

    const handleMouseUp = (event) => {
      if (dragDrop.isDragging.value) {
        // Trova la cella sotto il mouse al momento del rilascio
        const elementUnderMouse = document.elementFromPoint(event.clientX, event.clientY)
        if (elementUnderMouse) {
          const dayCell = elementUnderMouse.closest('[data-day]')
          if (dayCell) {
            const dayString = dayCell.getAttribute('data-day')
            if (dayString) {
              dragDrop.onDrop(dayString)
              return
            }
          }
        }
      }      dragDrop.endDrag()
    }

    const handleDayDragEnter = (day) => {
      if (!day) return
      const dateString = day.toISOString().split('T')[0]
      dragDrop.onDropZoneEnter(dateString)
    }

    const handleDayDragLeave = () => {
      dragDrop.onDropZoneLeave()
    }

    // Global mouse events for drag & drop
    onMounted(() => {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    })

    onUnmounted(() => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      dragDrop.cleanup()
    })

    return {
      // Store and state
      calendarStore,
      weekdayNames,
      monthWeeks,
      monthEvents,
      selectedEventId,
      showDayEventsModal,
      selectedDayEvents,
      selectedDayForModal,

      // Formatters
      formatMonthTitle,
      formatSelectedDayTitle,
      formatEventTime,

      // Utilities
      isCurrentMonth,
      isToday,
      isSelected,
      truncateText,
      getDayEvents,
      getEventTypeClass,
      getEventClasses,

      // Actions
      createEvent,
      createEventAt,
      selectEvent,
      selectDay,
      showMoreEvents,
      closeDayEventsModal,      // Drag & Drop
      ...dragDrop,
      handleEventMouseDown,
      handleDayDragEnter,
      handleDayDragLeave
    }
  }
}
</script>

<style scoped>
/* Drag & Drop styles */
.dragging {
  opacity: 0.5 !important;
  transform: scale(0.95) !important;
  z-index: 1000 !important;
  transition: all 0.2s ease !important;
  border: 2px dashed oklch(var(--p)) !important;
}

.drop-zone-valid {
  background-color: oklch(var(--p) / 0.1) !important;
  border-color: oklch(var(--p) / 0.4) !important;
  transform: scale(1.02) !important;
  transition: all 0.2s ease !important;
}

.drop-zone-highlighted {
  background-color: oklch(var(--p) / 0.2) !important;
  border-color: oklch(var(--p) / 0.6) !important;
  box-shadow: 0 0 0 2px oklch(var(--p) / 0.4) !important;
  transform: scale(1.05) !important;
}

.event-draggable {
  cursor: grab !important;
  transition: all 0.2s ease;
}

.event-draggable:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.event-draggable:active {
  cursor: grabbing !important;
}

/* Forza il cursore globalmente durante drag */
body.dragging-active {
  cursor: grabbing !important;
}

body.dragging-active * {
  cursor: grabbing !important;
}
</style>
