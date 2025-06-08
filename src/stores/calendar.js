import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useUserStore } from './account'
import { now, today } from './timeMachine'
import {
  getCalendarItems,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventById
} from '@/router/calendar/calendar.js'

export const useCalendarStore = defineStore('calendar', () => {
  const userStore = useUserStore()
    // State
  const events = ref([])
  const todos = ref([])
  const currentView = ref('month') // 'day', 'week', 'month'
  const currentDate = ref(today()) // Use virtual time
  const selectedEvent = ref(null)
  const isLoading = ref(false)

  // Categorie eventi con colori DaisyUI
  const eventCategories = ref([
    { 
      value: 'work', 
      label: 'Lavoro', 
      icon: '💼',
      colors: {
        bg: 'bg-primary/20',
        border: 'border-primary/30',
        text: 'text-primary-content',
        accent: 'bg-primary/10'
      }
    },
    { 
      value: 'personal', 
      label: 'Personale', 
      icon: '🏠',
      colors: {
        bg: 'bg-secondary/20',
        border: 'border-secondary/30', 
        text: 'text-secondary-content',
        accent: 'bg-secondary/10'
      }
    },
    { 
      value: 'health', 
      label: 'Salute', 
      icon: '🏥',
      colors: {
        bg: 'bg-success/20',
        border: 'border-success/30',
        text: 'text-success-content', 
        accent: 'bg-success/10'
      }
    },
    { 
      value: 'study', 
      label: 'Studio', 
      icon: '📚',
      colors: {
        bg: 'bg-info/20',
        border: 'border-info/30',
        text: 'text-info-content',
        accent: 'bg-info/10'
      }
    },
    { 
      value: 'family', 
      label: 'Famiglia', 
      icon: '👨‍👩‍👧‍👦',
      colors: {
        bg: 'bg-warning/20',
        border: 'border-warning/30',
        text: 'text-warning-content',
        accent: 'bg-warning/10'
      }
    },
    { 
      value: 'social', 
      label: 'Sociale', 
      icon: '🎉',
      colors: {
        bg: 'bg-accent/20',
        border: 'border-accent/30',
        text: 'text-accent-content',
        accent: 'bg-accent/10'
      }
    },
    { 
      value: 'travel', 
      label: 'Viaggio', 
      icon: '✈️',
      colors: {
        bg: 'bg-neutral/20',
        border: 'border-neutral/30',
        text: 'text-neutral-content',
        accent: 'bg-neutral/10'
      }
    },
    { 
      value: 'other', 
      label: 'Altro', 
      icon: '📌',
      colors: {
        bg: 'bg-base-300/50',
        border: 'border-base-300',
        text: 'text-base-content',
        accent: 'bg-base-300/20'
      }
    }
  ])

  // Filtri categoria attivi
  const activeCategories = ref(eventCategories.value.map(cat => cat.value))

  // Funzione per ottenere categoria per valore
  const getCategoryByValue = (value) => {
    return eventCategories.value.find(cat => cat.value === value) || eventCategories.value[eventCategories.value.length - 1]  }
  
  // Funzione per filtrare eventi per categoria
  const toggleCategoryFilter = (categoryValue) => {
    const index = activeCategories.value.indexOf(categoryValue)
    if (index > -1) {
      activeCategories.value.splice(index, 1)
    } else {
      activeCategories.value.push(categoryValue)
    }
  }
  
  const calendarItems = computed(() => {
    return [...events.value, ...todos.value]
  })
  
  const visibleEvents = computed(() => {
    const range = viewRange.value
    const filtered = calendarItems.value.filter(item => {
      // Gli eventi da getCalendarItems hanno start/end, i todos hanno dueDate
      const itemDate = new Date(item.start || item.dueDate)
      const isInRange = itemDate >= range.start && itemDate <= range.end
      
      // Apply category filter for events (todos don't have categories)
      if (item.type !== 'todo') {
        const eventCategory = item.category || 'other'
        const isCategoryActive = activeCategories.value.includes(eventCategory)
        if (!isCategoryActive) {
          return false
        }
      }
      
      return isInRange
    })
    
    return filtered
  })

  const currentWeekDays = computed(() => {
    const date = new Date(currentDate.value)
    const dayOfWeek = date.getDay()
    const monday = new Date(date)
    monday.setDate(date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    
    const weekDays = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday)
      day.setDate(monday.getDate() + i)
      weekDays.push(day)
    }
    return weekDays
  })
  
  const currentMonth = computed(() => {
    return currentDate.value.getMonth()
  })
    const currentYear = computed(() => {
    return currentDate.value.getFullYear()
  })
    const viewRange = computed(() => {
    const date = new Date(currentDate.value)
    let start, end
    
    switch (currentView.value) {
      case 'day':
        start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
        end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
        break
        
      case 'week':
        // Calcola il lunedì della settimana corrente
        const dayOfWeek = date.getDay()
        const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Domenica = 6 giorni indietro
        start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - mondayOffset)
        end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7)
        break
        
      case 'month':
      default:
        start = new Date(date.getFullYear(), date.getMonth(), 1)
        end = new Date(date.getFullYear(), date.getMonth() + 1, 1) // Primo giorno del mese successivo
        break
    }
    
    return { start, end }
  })
  
  // Actions
  const fetchEvents = async () => {
    if (!userStore.loggedUser?._id) return
    
    isLoading.value = true
    try {
      const range = viewRange.value
      const eventsData = await getEvents(
        userStore.loggedUser._id,
        range.start,
        range.end
      )
      
      // Converti il formato backend al formato frontend per compatibilità
      events.value = eventsData.map(event => ({
        ...event,
        id: event._id,
        date: event.startDate,
        start: event.startDate,
        end: event.endDate
      }))
        } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      isLoading.value = false
    }
  }

  const fetchTodos = async () => {
    if (!userStore.loggedUser?._id) return
    
    try {
      const range = viewRange.value
      const items = await getCalendarItems(
        userStore.loggedUser._id,
        range.start,
        range.end
      )
      
      // Filtra solo i todos
      todos.value = items.filter(item => item.extendedProps?.type === 'todo')
      
    } catch (error) {
      console.error('Error fetching todos:', error)
    }  }
  
  const setCurrentDate = (date) => {
    currentDate.value = new Date(date)
  }
  
  const fetchCalendarItems = async (startDate = null, endDate = null) => {
    if (!userStore.loggedUser?._id) return
    
    isLoading.value = true
    try {
      const range = startDate && endDate ? { start: startDate, end: endDate } : viewRange.value
      
      const items = await getCalendarItems(
        userStore.loggedUser._id,
        range.start,
        range.end
      )
      
      // Separa eventi e todos
      const eventsData = items.filter(item => !item.extendedProps?.type)
      const todosData = items.filter(item => item.extendedProps?.type === 'todo')
      
      // Gli eventi da getCalendarItems sono già formattati correttamente con start/end
      events.value = eventsData
      todos.value = todosData
      
    } catch (error) {
      console.error('Error fetching calendar items:', error)    } finally {
      isLoading.value = false
    }
  }
  
  const createNewEvent = async (eventData) => {
    try {
      const newEvent = await createEvent({
        ...eventData,
        author: userStore.loggedUser._id
      })
      
      // Ricarica gli elementi del calendario      await fetchCalendarItems()
      
      return newEvent
    } catch (error) {
      console.error('Error creating event:', error)
      throw error
    }
  }
  
  const updateExistingEvent = async (eventId, eventData) => {
    try {
      const updatedEvent = await updateEvent(eventId, eventData)
      
      // Ricarica gli elementi del calendario      await fetchCalendarItems()
      
      return updatedEvent
    } catch (error) {
      console.error('Error updating event:', error)
      throw error
    }
  }
  
  const deleteExistingEvent = async (eventId) => {
    try {
      await deleteEvent(eventId)
      
      // Rimuovi l'evento dal state locale immediatamente
      events.value = events.value.filter(event => event._id !== eventId)
      
      // Ricarica gli elementi del calendario per sicurezza
      await fetchCalendarItems()
      
    } catch (error) {
      console.error('Error deleting event:', error)
      throw error
    }
  }
  
  const selectEvent = async (eventId) => {
    try {
      if (eventId.startsWith('todo_')) {
        // È un todo, gestisci diversamente se necessario
        selectedEvent.value = todos.value.find(todo => todo.id === eventId)
      } else {
        const event = await getEventById(eventId)
        selectedEvent.value = event
      }
    } catch (error) {
      console.error('Error selecting event:', error)
      selectedEvent.value = null
    }
  }
  
  const clearSelectedEvent = () => {
    selectedEvent.value = null
  }
  
  const changeView = (view) => {
    if (['day', 'week', 'month'].includes(view)) {
      currentView.value = view
      fetchCalendarItems()
    }
  }
  
  const navigateToDate = (date) => {
    currentDate.value = new Date(date)
    fetchCalendarItems()
  }
  
  const navigatePrevious = () => {
    const date = new Date(currentDate.value)
    
    switch (currentView.value) {
      case 'day':
        date.setDate(date.getDate() - 1)
        break
      case 'week':
        date.setDate(date.getDate() - 7)
        break
      case 'month':
        date.setMonth(date.getMonth() - 1)
        break
    }
    
    navigateToDate(date)
  }
  
  const navigateNext = () => {
    const date = new Date(currentDate.value)
    
    switch (currentView.value) {
      case 'day':
        date.setDate(date.getDate() + 1)
        break
      case 'week':
        date.setDate(date.getDate() + 7)
        break
      case 'month':
        date.setMonth(date.getMonth() + 1)
        break
    }
    
    navigateToDate(date)
  }
    const navigateToday = () => {
    navigateToDate(today()) // Use virtual time
  }
  
  const getEventsForDate = (date) => {
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)
    
    return calendarItems.value.filter(item => {
      const itemDate = new Date(item.start)
      itemDate.setHours(0, 0, 0, 0)
        if (item.allDay) {
        return itemDate.getTime() === targetDate.getTime()
      } else {        
        // Per eventi con orario, controlla se la data è nel range
        const itemEndDate = new Date(item.end || item.start)
        itemEndDate.setHours(0, 0, 0, 0)
        return targetDate.getTime() >= itemDate.getTime() && 
               targetDate.getTime() <= itemEndDate.getTime()
      }
    })
  }
  
  // Watchers per ricarica automatica
  watch([currentView, currentDate], () => {
    fetchEvents()
    fetchTodos()
  }, { immediate: true })
  
  return {
    // State
    events,
    todos,
    currentView,
    currentDate,
    selectedEvent,    isLoading,
    
    // Computed
    calendarItems,
    visibleEvents,
    currentWeekDays,
    currentMonth,
    currentYear,    viewRange,
    
    // Actions
    fetchEvents,
    fetchTodos,
    setCurrentDate,
    fetchCalendarItems,
    createNewEvent,
    updateExistingEvent,
    deleteExistingEvent,
    selectEvent,
    clearSelectedEvent,
    changeView,
    navigateToDate,
    navigatePrevious,
    navigateNext,
    navigateToday,
    getEventsForDate,

    // Categorie eventi
    eventCategories,
    activeCategories,
    getCategoryByValue,
    toggleCategoryFilter
  }
})
