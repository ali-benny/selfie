<template>
  <div class="h-full flex flex-col bg-base-100">
    <!-- Header della giornata -->
    <div class="bg-base-200 rounded-lg p-4 mb-4">
      <div class="flex justify-between items-center">
        <div class="flex flex-col">
          <h2 class="text-xl font-bold text-base-content">
            {{ formatDayTitle(currentDay) }}
          </h2>
          <div class="flex items-center gap-4 mt-1">
            <span class="text-sm text-subtext-0">{{ formatDayDate(currentDay) }}</span>
            <span class="text-sm text-subtext-1">{{ dayEvents.length }} eventi</span>
          </div>
        </div>
        <button 
          @click="createEventAtTime('09:00')"
          class="btn btn-sm btn-primary"
        >
          <Icon icon="fluent:add-24-filled" />
          Nuovo evento
        </button>
      </div>
    </div>

    <!-- Griglia oraria -->
    <div class="flex-1 flex min-h-0">      <!-- Colonna degli orari -->
      <div class="flex flex-col w-20 border-r border-base-300">
        <div class="h-12 border-b border-base-300 flex items-center justify-center">
          <span class="text-xs text-subtext-1 font-medium">Ora</span>
        </div>        <div class="flex-1 min-h-0 overflow-y-auto overflow-visible" ref="timeColumn">
          <div 
            v-for="hour in hours" 
            :key="hour"
            class="h-16 border-b border-base-300/50 flex items-start justify-center pt-1 overflow-visible"
          >
            <span class="text-xs text-subtext-1 font-mono">{{ formatHour(hour) }}</span>
          </div>
        </div>
      </div>

      <!-- Colonna eventi -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Header eventi -->
        <div class="h-12 border-b border-base-300 flex items-center justify-center px-4">
          <span class="text-sm font-medium text-base-content">Eventi</span>
        </div>        <!-- Griglia eventi per ora -->
        <div class="flex-1 min-h-0 overflow-y-auto overflow-x-visible" ref="eventsColumn" @scroll="syncScroll">          <div 
            v-for="hour in hours" 
            :key="hour"
            class="h-16 border-b border-base-300/30 hover:bg-base-200/50 cursor-pointer transition-colors duration-200 relative px-2 overflow-visible"
            @click="createEventAtTime(formatHour(hour))"
          ><!-- Eventi in questa ora -->
            <div 
              v-for="(event, index) in getEventsForHour(hour)"
              :key="event._id || event.id"
              :class="[
                'absolute rounded text-xs p-2 cursor-pointer transition-all duration-200',
                'hover:shadow-md hover:z-10 space-y-1',
                getEventClasses(event),
                { 'ring-2 ring-secondary ring-offset-1': selectedEventId === event._id }
              ]"
              :style="getCollisionAwareStyle(event, hour, index)"
              @click.stop="selectEvent(event)"
            >
              <div class="text-xs opacity-75">
                {{ formatEventTime(event) }}
              </div>
              <div class="font-medium truncate">
                {{ event.title }}
              </div>
              <div v-if="event.location" class="text-xs opacity-75 flex items-center gap-1">
                <Icon icon="fluent:location-24-filled" class="w-3 h-3" />
                <span class="truncate">{{ event.location }}</span>
              </div>
              <div v-if="event.type === 'todo'" class="text-xs opacity-75 flex items-center gap-1">
                <Icon icon="fluent:task-list-square-24-filled" class="w-3 h-3" />
                Todo
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Eventi tutto il giorno -->
    <div v-if="allDayEvents.length > 0" class="mt-4 bg-base-200 rounded-lg p-4">
      <h3 class="text-lg font-semibold text-base-content mb-3">Eventi tutto il giorno</h3>
      <div class="space-y-2">
        <div 
          v-for="event in allDayEvents"
          :key="event._id || event.id"
          :class="[
            'card bg-base-100 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md',
            getEventClasses(event, 'full')
          ]"
          @click="selectEvent(event)"
        >
          <div class="card-body p-3">            <div class="flex justify-between items-start">
              <h4 class="card-title text-sm">{{ event.title }}</h4>
              <span v-if="event.type === 'todo'" class="badge badge-warning badge-xs">Todo</span>
            </div>
            <div v-if="event.description" class="text-xs text-subtext-0 mt-1">
              {{ event.description }}
            </div>
            <div v-if="event.location" class="text-xs text-subtext-0 mt-1 flex items-center gap-1">
              <Icon icon="fluent:location-24-filled" class="w-3 h-3" />
              {{ event.location }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue'
import { useCalendarStore } from '@/stores/calendar'
import { Icon } from '@iconify/vue'

export default {
  name: 'CalendarDayView',
  components: {
    Icon
  },
  emits: ['create-event', 'select-event'],  setup(props, { emit }) {
    const calendarStore = useCalendarStore()
    const selectedEventId = ref(null)
    const timeColumn = ref(null)
    const eventsColumn = ref(null)

    // Ore della giornata (6-23)
    const hours = Array.from({ length: 18 }, (_, i) => i + 6)

    // Eventi del giorno corrente
    const currentDay = computed(() => calendarStore.currentDate)
      const dayEvents = computed(() => {
      console.log('Calculating dayEvents for currentDay:', currentDay.value)
      console.log('Available events:', calendarStore.visibleEvents)
      
      const events = calendarStore.visibleEvents.filter(event => {
        // Gestisce diversi formati di data per compatibilità backend/frontend
        const eventDate = new Date(event.date || event.startDate || event.dueDate || event.start)
        const dayString = currentDay.value.toDateString()
        const eventString = eventDate.toDateString()
        
        console.log('Comparing event date:', eventString, 'with current day:', dayString)
        
        return eventString === dayString
      })
      
      console.log('Filtered dayEvents:', events)
      return events
    })    // Eventi con orario specifico
    const timedEvents = computed(() => {
      const events = dayEvents.value.filter(event => {
        console.log('Filtering event:', event.title, 'Full event:', event)
        
        // REGOLA PRINCIPALE: Se allDay è esplicitamente true, l'evento è tutto il giorno
        if (event.allDay === true) {
          return false; // Non è un evento con orario specifico
        }
        
        // Se allDay è false, significa che l'utente vuole un evento con orario specifico
        // Cerchiamo un orario di inizio (in ordine di priorità)
        
        // 1. Controllo esplicito per startTime come stringa
        if (event.startTime) {
          console.log('Event:', event.title, 'has explicit startTime:', event.startTime)
          return true;
        }
        
        // 2. Controllo basato su startDate
        if (event.startDate) {
          const date = new Date(event.startDate)
          const hours = date.getHours()
          const minutes = date.getMinutes()
          
          // Se l'ora non è 00:00, consideriamo che abbia un orario specifico
          if (hours !== 0 || minutes !== 0) {
            console.log('Event:', event.title, 'has time in startDate:', hours + ':' + minutes)
            return true;
          }
        }
        
        console.log('Event:', event.title, 'has allDay:', event.allDay, 'but no valid time found')
        
        // Se siamo qui, l'evento non ha un orario valido ma allDay è false
        // Lo trattiamo come timed event per rispettare la volontà dell'utente
        return event.allDay === false;
      })
      
      console.log('TimedEvents:', events)
      return events
    })    // Eventi tutto il giorno
    const allDayEvents = computed(() => {
      return dayEvents.value.filter(event => {
        // REGOLA SEMPLIFICATA:
        // 1. Se allDay è esplicitamente true, è un evento tutto il giorno
        if (event.allDay === true) {
          return true;
        }
        
        // 2. Se allDay è esplicitamente false, NON è un evento tutto il giorno
        if (event.allDay === false) {
          return false;
        }
        
        // 3. Se allDay non è specificato, controlliamo startTime e startDate
        
        // Se ha startTime, NON è un evento tutto il giorno
        if (event.startTime) {
          return false;
        }
        
        // Se startDate ha un'ora specifica, NON è un evento tutto il giorno
        if (event.startDate) {
          const date = new Date(event.startDate);
          const hours = date.getHours();
          const minutes = date.getMinutes();
          
          if (hours !== 0 || minutes !== 0) {
            return false;
          }
        }
        
        // Default: se non abbiamo abbastanza info, consideriamolo tutto il giorno
        return true;
      })
    })

    // Formattazione
    const formatDayTitle = (date) => {
      return date.toLocaleDateString('it-IT', { 
        weekday: 'long'
      }).replace(/^\w/, c => c.toUpperCase())
    }

    const formatDayDate = (date) => {
      return date.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    }

    const formatHour = (hour) => {
      return `${hour.toString().padStart(2, '0')}:00`
    }

    const formatEventTime = (event) => {
      if (event.type === 'todo' && event.dueDate) {
        const time = new Date(event.dueDate).toLocaleTimeString('it-IT', {
          hour: '2-digit',
          minute: '2-digit'
        })
        return `⏰ ${time}`
      }
      
      if (event.startTime) {
        let timeStr = event.startTime
        if (event.endTime) {
          timeStr += ` - ${event.endTime}`
        } else if (event.duration) {
          const start = new Date(`2000-01-01T${event.startTime}`)
          const end = new Date(start.getTime() + event.duration * 60000)
          timeStr += ` - ${end.toTimeString().substring(0, 5)}`
        }
        return timeStr
      }
      
      return ''
    }    // Eventi per ora specifica (include eventi multi-ora)
    const getEventsForHour = (hour) => {
      const events = timedEvents.value.filter(event => {
        let startHour = null
        
        // Prova diversi modi per ottenere l'ora dell'evento
        if (event.type === 'todo' && event.dueDate) {
          startHour = new Date(event.dueDate).getHours()
        } else if (event.startTime) {
          // Se ha startTime come stringa "HH:MM"
          startHour = parseInt(event.startTime.split(':')[0])
        } else if (event.startDate) {
          // Se ha startDate come ISO string
          startHour = new Date(event.startDate).getHours()
        } else if (event.start) {
          // Formato alternativo
          startHour = new Date(event.start).getHours()
        }
        
        console.log('Event:', event.title, 'calculated hour:', startHour, 'target hour:', hour)
        
        // L'evento viene mostrato solo nell'ora di inizio per evitare duplicati
        return startHour === hour
      })
      
      console.log('Events for hour', hour, ':', events)
      return events
    }    // Calcola le ore che un evento occupa - versione completa per eventi multi-ora
    const getEventDurationInHours = (event) => {
      console.log('🕐 CalendarDayView - Calculating duration for event:', event.title)
      console.log('🔍 Event data:', {
        startTime: event.startTime,
        endTime: event.endTime,
        duration: event.duration,
        startDate: event.startDate,
        endDate: event.endDate,
        type: event.type
      })
      
      // 1. Todo eventi sono sempre di 1 ora nella vista giornaliera
      if (event.type === 'todo') {
        console.log('📋 Todo event - returning 1 hour')
        return 1
      }
      
      // 2. Calcolo basato su startTime/endTime
      if (event.endTime && event.startTime) {
        try {
          const startHour = parseInt(event.startTime.split(':')[0])
          const startMinute = parseInt(event.startTime.split(':')[1] || '0')
          const endHour = parseInt(event.endTime.split(':')[0])
          const endMinute = parseInt(event.endTime.split(':')[1] || '0')
          
          const startTotalMinutes = startHour * 60 + startMinute
          const endTotalMinutes = endHour * 60 + endMinute
          
          const duration = Math.max(1, (endTotalMinutes - startTotalMinutes) / 60)
          console.log('⏰ Calculated from startTime/endTime:', duration, 'hours')
          return duration
        } catch (error) {
          console.error('❌ Error parsing startTime/endTime:', error)
        }
      }
      
      // 3. Calcolo basato su proprietà duration (in minuti)
      if (event.duration && typeof event.duration === 'number') {
        const duration = Math.max(1, event.duration / 60)
        console.log('⌛ Calculated from duration property:', duration, 'hours')
        return duration
      }
      
      // 4. Calcolo basato su startDate/endDate
      if (event.startDate && event.endDate) {
        try {
          const startDate = new Date(event.startDate)
          const endDate = new Date(event.endDate)
          const diffMs = endDate.getTime() - startDate.getTime()
          const diffHours = Math.max(1, diffMs / (1000 * 60 * 60))
          console.log('📅 Calculated from startDate/endDate:', diffHours, 'hours')
          return diffHours
        } catch (error) {
          console.error('❌ Error parsing startDate/endDate:', error)
        }
      }
      
      // 5. Durata hardcoded per eventi specifici
      if (event.title && event.title.toUpperCase().includes('WEBINAR')) {
        console.log('🎓 WEBINAR event - returning 2.25 hours')
        return 2.25
      }
      
      // 6. Default: 1 ora
      console.log('🔄 Using default 1 hour duration')
      return 1
    }// Stile evento con durata corretta (utilizzato come base)
    const getEventStyle = (event) => {
      // La durata viene gestita nel getCollisionAwareStyle
      // Questa funzione fornisce solo le proprietà base
      return {
        minHeight: '30px',
        position: 'absolute'
      }
    }// Classe CSS per tipo evento
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
          baseClasses.push('border-l-4 border-l-warning !bg-warning/10')
        } else {
          baseClasses.push('!bg-warning/20 border-warning/30')
        }
      } else {
        if (variant === 'full') {
          baseClasses.push('border-l-4 border-l-primary !bg-primary/10')
        } else {
          baseClasses.push('!bg-primary/30 !border-primary/30')
        }
      }
      
      return baseClasses.join(' ')
    }    // Gestione eventi sovrapposti e durata multi-ora - versione completa
    const getCollisionAwareStyle = (event, hour, index) => {
      console.log('🎨 CalendarDayView - Calculating style for event:', event.title, 'at hour:', hour)
      
      const eventsInHour = getEventsForHour(hour)
      const totalEvents = eventsInHour.length
      
      // Calcola la durata dell'evento in ore
      const durationHours = getEventDurationInHours(event)
      console.log('📏 Event duration:', durationHours, 'hours')
      
      // Calcola l'altezza effettiva basata sulla durata multi-ora
      // Ogni slot è 64px (h-16) + 1px border = 65px per slot
      const slotHeight = 65 // 64px + 1px border
      const totalHeight = Math.max(slotHeight * durationHours - 4, 30)
      
      console.log('📐 Calculated height:', totalHeight, 'px for', durationHours, 'hours')
      
      if (totalEvents === 1) {
        // Evento singolo: occupa tutta la larghezza
        const style = {
          height: `${totalHeight}px`,
          left: '0px',
          right: '0px',
          top: '2px',
          zIndex: 10, // Z-index più alto per eventi multi-ora
          overflow: 'visible', // Permette estensione visiva oltre il contenitore
          position: 'absolute'
        }
        console.log('✅ Single event style:', style)
        return style
      }
      
      // Eventi multipli: dividere orizzontalmente
      const eventWidth = Math.floor(100 / totalEvents)
      const leftOffset = index * eventWidth
      
      const style = {
        height: `${totalHeight}px`,
        left: `${leftOffset}%`,
        width: `${eventWidth - 1}%`, // -1% per gap tra eventi
        top: '2px',
        zIndex: 10, // Z-index più alto per eventi multi-ora
        overflow: 'visible', // Permette estensione visiva oltre il contenitore
        position: 'absolute'
      }
      
      console.log('✅ Multi-event style:', style)
      return style
    }

    // Azioni
    const createEventAtTime = (time) => {
      // Assicurati che la data sia quella corretta
      const eventDate = new Date(currentDay.value)
      console.log('Creating event for date:', eventDate, 'time:', time)
        emit('create-event', {
        date: eventDate,
        startTime: time
      })
    }

    const selectEvent = (event) => {
      selectedEventId.value = event._id || event.id
      emit('select-event', event)
    }    // Sincronizzazione scroll
    const syncScroll = () => {
      if (timeColumn.value && eventsColumn.value) {
        timeColumn.value.scrollTop = eventsColumn.value.scrollTop
      }
    }

    return {
      // Refs
      timeColumn,
      eventsColumn,
      // Data
      hours,
      currentDay,
      dayEvents,
      allDayEvents,
      selectedEventId,
      formatDayTitle,
      formatDayDate,
      formatHour,
      formatEventTime,
      getEventsForHour,
      getEventDurationInHours,
      getEventStyle,
      getEventTypeClass,
      getEventClasses,
      getCollisionAwareStyle,
      createEventAtTime,
      selectEvent,
      syncScroll
    }
  }
}
</script>

<style scoped>
/* Stili minimal per override specifici se necessari */
</style>
