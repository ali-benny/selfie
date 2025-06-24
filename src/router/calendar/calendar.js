import { SERVER_URL } from '@/const.js'

// URL base per le API del calendario
const CALENDAR_API_URL = `${SERVER_URL}/api`

// ==================== EVENTI ====================

/**
 * Crea un nuovo evento
 */
export async function createEvent(eventData) {
  try {
    const response = await fetch(`${CALENDAR_API_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    })

    if (response.ok) {
      return await response.json()
    } else {
      throw new Error('Failed to create event')
    }
  } catch (error) {
    console.error('Error creating event:', error)
    throw error
  }
}

/**
 * Ottieni eventi di un utente in un range di date
 */
export async function getEvents(userId, startDate = null, endDate = null) {
  try {
    let url = `${CALENDAR_API_URL}/${userId}/events`

    if (startDate && endDate) {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })
      url += `?${params.toString()}`
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      return await response.json()
    } else {
      console.error('Failed to fetch events')
      return []
    }
  } catch (error) {
    console.error('Error fetching events:', error)
    return []
  }
}

/**
 * Ottieni un evento per ID
 */
export async function getEventById(eventId) {
  try {
    const response = await fetch(`${CALENDAR_API_URL}/events/${eventId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      return await response.json()
    } else {
      throw new Error('Failed to fetch event')
    }
  } catch (error) {
    console.error('Error fetching event:', error)
    throw error
  }
}

/**
 * Aggiorna un evento esistente
 */
export async function updateEvent(eventId, eventData) {
  try {
    const response = await fetch(`${CALENDAR_API_URL}/events/${eventId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    })

    if (response.ok) {
      return await response.json()
    } else {
      throw new Error('Failed to update event')
    }
  } catch (error) {
    console.error('Error updating event:', error)
    throw error
  }
}

/**
 * Elimina un evento
 */
export async function deleteEvent(eventId) {
  try {
    const response = await fetch(`${CALENDAR_API_URL}/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      return await response.json()
    } else {
      throw new Error('Failed to delete event')
    }
  } catch (error) {
    console.error('Error deleting event:', error)
    throw error
  }
}

// ==================== TODO CON SCADENZE ====================

/**
 * Ottieni todos con scadenze per il calendario
 */
export async function getCalendarTodos(userId, startDate = null, endDate = null) {
  try {
    let url = `${CALENDAR_API_URL}/${userId}/calendar-todos`

    if (startDate && endDate) {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })
      url += `?${params.toString()}`
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      return await response.json()
    } else {
      console.error('Failed to fetch calendar todos')
      return []
    }
  } catch (error) {
    console.error('Error fetching calendar todos:', error)
    return []
  }
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Crea un evento ricorrente
 */
export async function createRecurringEvent(eventData, recurrenceRule) {
  const recurringEventData = {
    ...eventData,
    isRecurring: true,
    recurrenceRule
  }

  return await createEvent(recurringEventData)
}

/**
 * Valida i dati di un evento
 */
export function validateEventData(eventData) {
  const errors = []

  if (!eventData.title || eventData.title.trim() === '') {
    errors.push('Il titolo è obbligatorio')
  }

  if (!eventData.startDate) {
    errors.push('La data di inizio è obbligatoria')
  }

  if (!eventData.endDate) {
    errors.push('La data di fine è obbligatoria')
  }

  if (eventData.startDate && eventData.endDate) {
    if (new Date(eventData.startDate) >= new Date(eventData.endDate)) {
      errors.push('La data di fine deve essere successiva alla data di inizio')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Formatta un evento per la visualizzazione nel calendario
 */
export function formatEventForCalendar(event) {
  const formatted = {
    id: event._id,
    _id: event._id, // Mantieni anche _id per compatibilità
    title: event.title,
    start: event.startDate,
    end: event.endDate,
    allDay: event.allDay,
    description: event.description,
    location: event.location,
    category: event.category || 'other', // Include category per il color coding
    startTime: event.startTime, // Include startTime per la vista settimanale
    endTime: event.endTime, // Include endTime per la vista settimanale
    duration: event.duration, // Include duration
    author: event.author,
    invitees: event.invitees,
    backgroundColor: event.isRecurring ? '#3b82f6' : '#10b981', // Blu per ricorrenti, verde per singoli
    borderColor: event.isRecurring ? '#1d4ed8' : '#059669',
    textColor: '#ffffff',
    extendedProps: {
      isRecurring: event.isRecurring,
      isRecurrenceInstance: event.isRecurrenceInstance,
      originalEventId: event.originalEventId
    }
  }

  return formatted
}

/**
 * Formatta un todo per la visualizzazione nel calendario
 */
export function formatTodoForCalendar(todo) {
  return {
    id: `todo_${todo._id}`,
    title: `${todo.text}`,
    start: todo.date,
    allDay: true,
    backgroundColor: todo.checked ? '#6b7280' : '#ef4444', // Grigio se completato, rosso se in scadenza
    borderColor: todo.checked ? '#4b5563' : '#dc2626',
    textColor: '#ffffff',
    extendedProps: {
      type: 'todo',
      checked: todo.checked,
      author: todo.author,
      from: todo.from
    }
  }
}

/**
 * Ottieni tutti gli elementi del calendario (eventi + todos)
 */
export async function getCalendarItems(userId, startDate = null, endDate = null) {
  try {
    const [events, todos] = await Promise.all([
      getEvents(userId, startDate, endDate),
      getCalendarTodos(userId, startDate, endDate)
    ])

    const formattedEvents = events.map(formatEventForCalendar)
    const formattedTodos = todos.map(formatTodoForCalendar)

    return [...formattedEvents, ...formattedTodos]
  } catch (error) {
    console.error('Error fetching calendar items:', error)
    return []
  }
}
