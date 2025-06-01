import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useUserStore } from './account'
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
  const currentDate = ref(new Date())
  const selectedEvent = ref(null)
  const isLoading = ref(false)  // Computed
  const calendarItems = computed(() => {
    return [...events.value, ...todos.value]
  })
  
  const visibleEvents = computed(() => {
    const range = viewRange.value
    console.log('VisibleEvents calculation - Current view:', currentView.value)
    console.log('VisibleEvents calculation - Range:', { start: range.start, end: range.end })
    console.log('VisibleEvents calculation - All items:', calendarItems.value)
    
    const filtered = calendarItems.value.filter(item => {
      // Gestisce sia il formato backend (startDate/endDate) che quello frontend (date/start)
      const itemDate = new Date(item.startDate || item.date || item.dueDate || item.start)
      const isInRange = itemDate >= range.start && itemDate <= range.end
      
      console.log('Event:', item.title, 'Date:', itemDate, 'In range:', isInRange)
      
      return isInRange
    })
    
    console.log('VisibleEvents filtered result:', filtered)
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
    
    console.log('ViewRange calculation for view:', currentView.value, 'date:', date)
    
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
    
    console.log('ViewRange result:', { start, end })
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
    }
  }

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
      
      events.value = eventsData
      todos.value = todosData
    } catch (error) {
      console.error('Error fetching calendar items:', error)
    } finally {
      isLoading.value = false
    }
  }
    const createNewEvent = async (eventData) => {
    try {
      console.log('Creating event with data:', eventData)
      
      const newEvent = await createEvent({
        ...eventData,
        author: userStore.loggedUser._id
      })
      
      console.log('Event created successfully:', newEvent)
      
      // Ricarica gli elementi del calendario
      await fetchCalendarItems()
      
      return newEvent
    } catch (error) {
      console.error('Error creating event:', error)
      throw error
    }
  }
  
  const updateExistingEvent = async (eventId, eventData) => {
    try {
      const updatedEvent = await updateEvent(eventId, eventData)
      
      // Ricarica gli elementi del calendario
      await fetchCalendarItems()
      
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
      
      console.log('Event deleted successfully, remaining events:', events.value.length)
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
    navigateToDate(new Date())
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
      }    })
  }
  
  // Watchers per ricarica automatica
  watch([currentView, currentDate], () => {
    console.log('View or date changed, reloading events...')
    fetchEvents()
    fetchTodos()
  }, { immediate: true })
  
  return {
    // State
    events,
    todos,
    currentView,
    currentDate,
    selectedEvent,
    isLoading,
      // Computed
    calendarItems,
    visibleEvents,
    currentWeekDays,
    currentMonth,
    currentYear,
    viewRange,
    
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
    getEventsForDate
  }
})
