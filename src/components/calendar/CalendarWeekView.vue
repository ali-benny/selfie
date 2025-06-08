<template>
  <div class="h-full flex flex-col bg-base-100">
    <!-- Header settimana -->
    <div class="bg-base-200 rounded-lg p-4 mb-4">
      <div class="flex justify-between items-center">
        <div class="flex flex-col">
          <h2 class="text-xl font-bold text-base-content">
            {{ formatWeekTitle() }}
          </h2>
          <span class="text-sm text-subtext-0">{{ formatWeekRange() }}</span>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm text-subtext-1">{{ weekEvents.length }} eventi</span>
          <button @click="createEvent()" class="btn btn-sm btn-primary">
            <Icon icon="fluent:add-24-filled" />
            Nuovo evento
          </button>
        </div>
      </div>
    </div>

    <!-- Griglia settimana -->
    <div class="flex-1 flex min-h-0">
      <!-- Colonna degli orari -->
      <div class="flex flex-col w-20 border-r border-base-300">
        <div class="h-16 border-b border-base-300 flex items-center justify-center">
          <span class="text-xs text-subtext-1 font-medium">Ora</span>
        </div>
        <div class="flex-1 min-h-0 overflow-y-auto overflow-visible" ref="timeColumn">
          <div
            v-for="hour in hours"
            :key="hour"
            class="h-16 border-b border-base-300/50 flex items-start justify-center pt-1 overflow-visible"
          >
            <span class="text-xs text-subtext-1 font-mono">{{ formatHour(hour) }}</span>
          </div>
        </div>
      </div>

      <!-- Colonne giorni -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Header giorni -->
        <div class="grid grid-cols-7 border-b border-base-300">
          <div
            v-for="day in weekDays"
            :key="day.toISOString()"
            :class="[
              'h-16 border-r border-base-300/50 p-2 cursor-pointer transition-colors duration-200',
              'hover:bg-base-200 flex flex-col items-center justify-center',
              {
                'bg-primary/10 border-primary/30 !text-primary font-semibold': isToday(day),
                'bg-secondary/10 border-secondary': isSelected(day)
              }
            ]"
            @click="selectDay(day)"
          >
            <div class="text-xs font-medium text-center">{{ formatDayName(day) }}</div>
            <div class="text-lg font-bold">{{ day.getDate() }}</div>
            <div
              v-if="getDayEventsCount(day) > 0"
              class="text-xs bg-accent text-accent-content rounded-full px-1.5 py-0.5 min-w-5 text-center"
            >
              {{ getDayEventsCount(day) }}
            </div>
          </div>
        </div>

        <!-- Griglia eventi -->
        <div
          class="flex-1 grid grid-cols-7 min-h-0 overflow-y-auto overflow-x-visible"
          ref="eventsColumn"
          @scroll="syncScroll"
        >
          <div
            v-for="day in weekDays"
            :key="day.toISOString()"
            class="border-r border-base-300/50 relative overflow-visible"
          >
            <div
              v-for="hour in hours"
              :key="hour"
              class="h-16 border-b border-base-300/30 hover:bg-base-200/50 cursor-pointer transition-colors duration-200 relative overflow-visible"
              @click="createEventAt(day, hour)"
            >
              <!-- Eventi in questa ora e giorno -->
              <div
                v-for="(event, index) in getEventsForDayHour(day, hour)"
                :key="event._id || event.id"
                :class="[
                  'absolute rounded text-xs p-1 cursor-pointer transition-all duration-200',
                  'hover:shadow-md hover:z-10 overflow-hidden',
                  getEventClasses(event),
                  { 'ring-2 ring-secondary ring-offset-1': selectedEventId === event._id }
                ]"
                :style="getCollisionAwareStyle(event, day, hour, index)"
                @click.stop="selectEvent(event)"              >
                <div class="font-medium truncate flex items-center gap-1">
                  <span v-if="event.type !== 'todo'">{{ calendarStore.getCategoryByValue(event.category || 'other').icon }}</span>
                  <span v-else>⏰</span>
                  <span class="truncate">{{ event.title }}</span>
                </div>
                <div class="text-xs opacity-75 truncate">{{ formatEventTime(event) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Eventi tutto il giorno -->
    <div v-if="allDayEvents.length > 0" class="mt-4 bg-base-200 rounded-lg p-4">
      <h3 class="text-lg font-semibold text-base-content mb-3">Eventi tutto il giorno</h3>
      <div class="grid grid-cols-7 gap-1">
        <div v-for="day in weekDays" :key="day.toISOString()" class="space-y-1">
          <div class="text-xs font-medium text-center text-subtext-1 border-b border-base-300 pb-1">
            {{ formatDayName(day) }} {{ day.getDate() }}
          </div>
          <div class="space-y-1">
            <div
              v-for="event in getAllDayEventsForDay(day)"
              :key="event._id || event.id"
              :class="[
                'text-xs px-2 py-1 rounded cursor-pointer transition-all duration-200 hover:shadow-sm',
                getEventClasses(event)
              ]"              @click="selectEvent(event)"
            >
              <span v-if="event.type !== 'todo'">{{ calendarStore.getCategoryByValue(event.category || 'other').icon }}</span>
              <span v-else>⏰</span>
              <span class="truncate ml-1">{{ event.title }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// TODO: Refactor using Composition API
import { computed, ref } from 'vue'
import { useCalendarStore } from '@/stores/calendar'
import { now, today } from '@/stores/timeMachine'
import { Icon } from '@iconify/vue'

export default {
  name: 'CalendarWeekView',
  components: {
    Icon
  },
  emits: ['create-event', 'select-event', 'day-selected'],
  setup(props, { emit }) {
    const calendarStore = useCalendarStore()
    const selectedEventId = ref(null)
    const selectedDay = ref(null)
    const timeColumn = ref(null)
    const eventsColumn = ref(null)

    // Ora della giornata (6-23)
    const hours = Array.from({ length: 18 }, (_, i) => i + 6)

    // Giorni della settimana
    const weekDays = computed(() => {
      return calendarStore.currentWeekDays
    })    // Eventi della settimana
    const weekEvents = computed(() => {
      const events = calendarStore.visibleEvents.filter(event => {
        // Gli eventi da getCalendarItems hanno start, i todos hanno dueDate
        const eventDate = new Date(event.start || event.dueDate)
        const eventDateString = eventDate.toDateString()
        
        const isInWeek = weekDays.value.some(day => 
          eventDateString === day.toDateString()
        )
        
        return isInWeek
      })
      
      return events
    })

    // Eventi con orario specifico
    const timedEvents = computed(() => {
      
      const result = weekEvents.value.filter(event => {
        // REGOLA PRINCIPALE: Se allDay è esplicitamente true, l'evento è tutto il giorno
        if (event.allDay === true) {
          return false // Non è un evento con orario specifico
        }

        // Se allDay è false, significa che l'utente vuole un evento con orario specifico
        // Cerchiamo un orario di inizio (in ordine di priorità)

        // 1. Controllo esplicito per startTime come stringa
        if (event.startTime) {
          return true
        }
          // 2. Controllo basato su start (data ISO)
        if (event.start) {
          const date = new Date(event.start)
          const hours = date.getHours()
          const minutes = date.getMinutes()

          // Se l'ora non è 00:00, consideriamo che abbia un orario specifico
          if (hours !== 0 || minutes !== 0) {
            return true
          }
        }

        // Se siamo qui, l'evento non ha un orario valido ma allDay è false
        // Lo trattiamo come timed event per rispettare la volontà dell'utente
        return event.allDay === false
      })
        
      return result
    })

    // Eventi tutto il giorno
    const allDayEvents = computed(() => {
      return weekEvents.value.filter((event) => {
        // FIXME: questi if

        // REGOLA SEMPLIFICATA:
        // 1. Se allDay è esplicitamente true, è un evento tutto il giorno
        if (event.allDay === true) {
          return true
        }

        // 2. Se allDay è esplicitamente false, NON è un evento tutto il giorno
        if (event.allDay === false) {
          return false
        }
          // 3. Se allDay non è specificato, controlliamo startTime e start
        
        // Se ha startTime, NON è un evento tutto il giorno
        if (event.startTime) {
          return false
        }
        
        // Se start ha un'ora specifica, NON è un evento tutto il giorno
        if (event.start) {
          const date = new Date(event.start);
          const hours = date.getHours();
          const minutes = date.getMinutes();
          
          if (hours !== 0 || minutes !== 0) {
            return false
          }
        }

        // Default: se non abbiamo abbastanza info, consideriamolo tutto il giorno
        return true
      })
    })

    // Formattazione
    const formatWeekTitle = () => {
      const firstDay = weekDays.value[0]
      const year = firstDay.getFullYear()
      const weekNumber = getWeekNumber(firstDay)
      return `Settimana ${weekNumber}, ${year}`
    }

    const formatWeekRange = () => {
      const firstDay = weekDays.value[0]
      const lastDay = weekDays.value[6]

      const startMonth = firstDay.toLocaleDateString('it-IT', { month: 'long' })
      const endMonth = lastDay.toLocaleDateString('it-IT', { month: 'long' })

      if (startMonth === endMonth) {
        return `${firstDay.getDate()}-${lastDay.getDate()} ${startMonth}`
      } else {
        return `${firstDay.getDate()} ${startMonth} - ${lastDay.getDate()} ${endMonth}`
      }
    }

    // TODO: imparare API di date
    const formatDayName = (date) => {
      return date
        .toLocaleDateString('it-IT', {
          weekday: 'short'
        })
        .replace(/^\w/, (c) => c.toUpperCase())
    }

    const formatHour = (hour) => {
      return `${hour.toString().padStart(2, '0')}:00`
    }

    // TODO: imparare API di date
    const formatEventTime = (event) => {
      if (event.type === 'todo' && event.dueDate) {
        return new Date(event.dueDate).toLocaleTimeString('it-IT', {
          hour: '2-digit',
          minute: '2-digit'
        })
      }

      if (event.startTime) {
        if (event.endTime) {
          return `${event.startTime}-${event.endTime}`
        } else if (event.duration) {
          const start = new Date(`2000-01-01T${event.startTime}`)
          const end = new Date(start.getTime() + event.duration * 60000)
          return `${event.startTime}-${end.toTimeString().substring(0, 5)}`
        }
        return event.startTime
      }

      return ''
    }

    // Utility
    const getWeekNumber = (date) => {
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
      const pastDaysOfYear = (date - firstDayOfYear) / 86400000 // TODO: creare costante, perché che è sta roba?      return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
    }

    const isToday = (date) => {
      const todayDate = today() // Use virtual time
      return date.toDateString() === todayDate.toDateString()
    }

    const isSelected = (date) => {
      return selectedDay.value?.toDateString() === date.toDateString()
    }    // Conteggi eventi
    const getDayEventsCount = (day) => {
      return weekEvents.value.filter(event => {
        const eventDate = new Date(event.start || event.dueDate)
        return eventDate.toDateString() === day.toDateString()
      }).length
    }    // Eventi per giorno e ora (include eventi multi-ora)
    const getEventsForDayHour = (day, hour) => {
      return timedEvents.value.filter(event => {
        const eventDate = new Date(event.start || event.dueDate)
        if (eventDate.toDateString() !== day.toDateString()) {
          return false
        }

        // FIXME: unused endHour
        let startHour, endHour

        if (event.type === 'todo' && event.dueDate) {
          startHour = new Date(event.dueDate).getHours()
          endHour = startHour // Todo eventi sono sempre di 1 ora
        } else if (event.startTime) {
          startHour = parseInt(event.startTime.split(':')[0])

          if (event.endTime) {
            endHour = parseInt(event.endTime.split(':')[0])
          } else if (event.duration) {
            const durationHours = Math.ceil(event.duration / 60)
            endHour = startHour + durationHours
          } else {
            endHour = startHour + 1 // Default 1 ora
          }        } else if (event.start) {
          startHour = new Date(event.start).getHours()
          
          if (event.duration) {
            const durationHours = Math.ceil(event.duration / 60)
            endHour = startHour + durationHours
          } else {
            endHour = startHour + 1 // Default 1 ora
          }
        } else {
          return false
        }

        // L'evento viene mostrato solo nell'ora di inizio per evitare duplicati
        return startHour === hour
      })
    } // Calcola le or che un evento occupa
    const getEventDurationInHours = (event) => {
      if (event.type === 'todo') {
        return 1 // Todo eventi sono sempre di 1 ora nella vista settimanale
      }

      // 1. Controlla startTime/endTime (formato stringa)
      if (event.endTime && event.startTime) {
        const startHour = parseInt(event.startTime.split(':')[0])
        const startMinute = parseInt(event.startTime.split(':')[1] || '0')
        const endHour = parseInt(event.endTime.split(':')[0])
        const endMinute = parseInt(event.endTime.split(':')[1] || '0')

        const startTotalMinutes = startHour * 60 + startMinute
        const endTotalMinutes = endHour * 60 + endMinute
        const duration = (endTotalMinutes - startTotalMinutes) / 60

        return Math.max(1, duration)
      }

      // 2. Controlla proprietà duration in minuti
      if (event.duration) {
        const duration = event.duration / 60
        return Math.max(1, duration)
      }
        // 3. Controlla se l'evento ha start e end (date ISO)
      if (event.start && event.end) {
        const startDate = new Date(event.start)
        const endDate = new Date(event.end)
        const durationMs = endDate.getTime() - startDate.getTime()
        const durationHours = durationMs / (1000 * 60 * 60)
        
        // Se la durata è negativa o troppo lunga, usa default di 1 ora
        if (durationHours <= 0 || durationHours > 24) {
          return 1
        }
        
        return Math.max(1, durationHours)
      }
     
      return 1 // Default 1 ora
    }    // Eventi tutto il giorno per giorno
    const getAllDayEventsForDay = (day) => {
      return allDayEvents.value.filter(event => {
        const eventDate = new Date(event.start || event.dueDate)
        return eventDate.toDateString() === day.toDateString()
      })
    }

    // Stile evento con durata corretta (utilizzato come base)
    const getEventStyle = (event) => {
      // La durata viene gestita nel getCollisionAwareStyle
      // Questa funzione fornisce solo le proprietà base
      return {
        minHeight: '20px',
        position: 'absolute'
      }
    }    // Stile con gestione sovrapposizioni e durata multi-ora
    const getCollisionAwareStyle = (event, day, hour, index) => {
      const hourEvents = getEventsForDayHour(day, hour)
      const totalEvents = hourEvents.length

      // Calcola la durata dell'evento in or
      const durationHours = getEventDurationInHours(event)
      
      // Base styles from standard event style
      const baseStyle = getEventStyle(event)

      // Calcola l'altezza effettiva basata sulla durata multi-ora
      // Ogni slot è 64px (h-16) + 1px border = 65px per slot
      const slotHeight = 65 // 64px + 1px border
      const totalHeight = Math.max(slotHeight * durationHours - 4, 20)

      if (totalEvents <= 1) {
        // Se c'è un solo evento nell'ora, occupa tutto lo spazio orizzontale
        return {
          ...baseStyle,
          height: `${totalHeight}px`,
          left: '0.25rem',
          right: '0.25rem',
          top: '2px',
          zIndex: 10,
          overflow: 'visible'
        }
      }

      // Calcola la larghezza di ciascun evento per eventi multipli
      const eventWidth = Math.floor(100 / totalEvents)
      const leftOffset = index * eventWidth
      
      return {
        ...baseStyle,
        height: `${totalHeight}px`,
        left: `calc(${leftOffset}% + 0.125rem)`,
        width: `calc(${eventWidth - 1}% - 0.125rem)`, // -1% per gap tra eventi
        top: '2px',
        zIndex: 10,
        overflow: 'visible'
      }
    }

    // Classe CSS per tipo evento
    const getEventTypeClass = (event) => {
      if (event.type === 'todo') {
        return 'event-todo'
      }
      return 'event-calendar'
    }    // Classi DaisyUI per eventi
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
          baseClasses.push(`border-l-4 border-l-primary ${category.colors.accent}`)
        } else {
          baseClasses.push(`${category.colors.bg} ${category.colors.border}`)
        }
      }

      return baseClasses.join(' ')
    }

    // Azioni
    const createEvent = () => {
      emit('create-event', {})
    }

    const createEventAt = (day, hour) => {
      emit('create-event', {
        date: day,
        startTime: formatHour(hour)
      })
    }

    const selectEvent = (event) => {
      selectedEventId.value = event._id || event.id
      emit('select-event', event)
    }

    const selectDay = (day) => {
      selectedDay.value = day
      emit('day-selected', day)
    }    // Sincronizzazione scroll
    const syncScroll = () => {
      if (timeColumn.value && eventsColumn.value) {
        timeColumn.value.scrollTop = eventsColumn.value.scrollTop
      }
    }

    return {
      // Store
      calendarStore,
      // Refs
      timeColumn,
      eventsColumn,
      // Data
      hours,
      weekDays,
      weekEvents,
      allDayEvents,
      selectedEventId,
      // Formatting functions
      formatWeekTitle,
      formatWeekRange,
      formatDayName,
      formatHour,
      formatEventTime,
      // Utility functions
      isToday,
      isSelected,
      getDayEventsCount,
      getEventsForDayHour,
      getAllDayEventsForDay,
      getEventDurationInHours,
      getEventStyle,
      getCollisionAwareStyle,
      getEventTypeClass,
      getEventClasses,
      // Actions
      createEvent,
      createEventAt,
      selectEvent,
      selectDay,
      syncScroll
    }
  }
}
</script>

<style scoped>
/* Stili minimal per override specifici se necessari */
</style>
