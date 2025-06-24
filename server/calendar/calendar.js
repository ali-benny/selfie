import express from 'express'
import mongoose from 'mongoose'
import { connect, connected } from '../app.js'

const app = express()
app.use(express.json())

// Schema per gli Eventi del calendario
const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  allDay: {
    type: Boolean,
    default: false
  },
  author: {
    type: String,
    required: true,
    ref: 'User'
  },  invitees: [{
    type: String,
    ref: 'User'
  }],
  // Categoria evento per color coding
  category: {
    type: String,
    enum: ['work', 'personal', 'health', 'study', 'family', 'social', 'travel', 'other'],
    default: 'other'
  },
  // Campi per eventi ricorrenti
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrenceRule: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      default: 'daily'
    },
    interval: {
      type: Number,
      default: 1 // ogni X giorni/settimane/mesi/anni
    },
    endType: {
      type: String,
      enum: ['never', 'count', 'date'],
      default: 'never'
    },
    endCount: {
      type: Number // numero di ripetizioni
    },
    endDate: {
      type: Date // data di fine ricorrenza
    },
    daysOfWeek: [{
      type: Number, // 0 = domenica, 1 = lunedì, ecc.
      min: 0,
      max: 6
    }],
    dayOfMonth: {
      type: Number, // per ricorrenze mensili
      min: 1,
      max: 31
    }
  },
  masterEventId: {
    type: String, // Per eventi ricorrenti, riferimento all'evento master
    default: null
  },
  exceptionDates: [{
    type: Date // Date in cui l'evento ricorrente è cancellato
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

const Event = mongoose.model('Event', EventSchema)

app.on('mount', async () => {
  await connect('calendar')
})

// ==================== EVENTI ====================

/**
 * Crea un nuovo evento
 */
app.post('/events', async (req, res) => {
  try {
    if (!connected['calendar']) await connect('calendar')
    
    const event = new Event({
      ...req.body,
      updatedAt: Date.now()
    })
    
    await event.save()
    res.status(201).json(event)
  } catch (err) {
    console.error('Error creating event:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * Ottieni tutti gli eventi di un utente in un range di date
 */
app.get('/:userId/events', async (req, res) => {
  try {
    if (!connected['calendar']) await connect('calendar')
    
    const { userId } = req.params
    const { startDate, endDate } = req.query
    
    let query = {
      $or: [
        { author: userId },
        { invitees: userId }
      ]
    }
    
    // Se sono specificate le date, filtra per range
    if (startDate && endDate) {
      query.$and = [
        {
          $or: [
            { startDate: { $gte: new Date(startDate), $lte: new Date(endDate) } },
            { endDate: { $gte: new Date(startDate), $lte: new Date(endDate) } },
            { 
              $and: [
                { startDate: { $lte: new Date(startDate) } },
                { endDate: { $gte: new Date(endDate) } }
              ]
            }
          ]
        }
      ]
    }
    
    const events = await Event.find(query).sort({ startDate: 1 })
    
    // Espandi eventi ricorrenti se necessario
    const expandedEvents = await expandRecurringEvents(events, startDate, endDate)
    
    res.status(200).json(expandedEvents)
  } catch (err) {
    console.error('Error fetching events:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * Ottieni un evento specifico
 */
app.get('/events/:id', async (req, res) => {
  try {
    if (!connected['calendar']) await connect('calendar')
    
    const event = await Event.findById(req.params.id)
    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }
    
    res.status(200).json(event)
  } catch (err) {
    console.error('Error fetching event:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * Aggiorna un evento
 */
app.patch('/events/:id', async (req, res) => {
  try {
    if (!connected['calendar']) await connect('calendar')
    
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id, 
      { ...req.body, updatedAt: Date.now() }, 
      { new: true }
    )
    
    if (!updatedEvent) {
      return res.status(404).json({ error: 'Event not found' })
    }
    
    res.status(200).json(updatedEvent)
  } catch (err) {
    console.error('Error updating event:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * Elimina un evento
 */
app.delete('/events/:id', async (req, res) => {
  try {
    if (!connected['calendar']) await connect('calendar')
    
    const deletedEvent = await Event.findByIdAndDelete(req.params.id)
    if (!deletedEvent) {
      return res.status(404).json({ error: 'Event not found' })
    }
    
    res.status(200).json({ message: 'Event deleted successfully' })
  } catch (err) {
    console.error('Error deleting event:', err)
    res.status(500).json({ error: err.message })
  }
})

// ==================== TODO CON SCADENZE ====================

/**
 * Ottieni tutti i todo con scadenze per il calendario
 */
app.get('/:userId/calendar-todos', async (req, res) => {
  try {
    // Importa il modello Todo dal modulo esistente
    const Todo = mongoose.model('Todo')
    
    const { userId } = req.params
    const { startDate, endDate } = req.query
    
    let query = {
      $or: [
        { author: userId },
        { readers: userId }
      ],
      // Filtra solo i todo che hanno una data (dalle note)
      'from.type': 'note'
    }
    
    // Se sono specificate le date, filtra per range
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }
    
    const todos = await Todo.find(query).sort({ date: 1 })
    
    res.status(200).json(todos)
  } catch (err) {
    console.error('Error fetching calendar todos:', err)
    res.status(500).json({ error: err.message })
  }
})

// ==================== UTILITY FUNCTIONS ====================

/**
 * Espande eventi ricorrenti per un range di date
 */
async function expandRecurringEvents(events, startDate, endDate) {
  const expandedEvents = []
  
  for (const event of events) {
    if (!event.isRecurring) {
      expandedEvents.push(event)
      continue
    }
    
    // Se non ci sono date limite, aggiungi solo l'evento originale
    if (!startDate || !endDate) {
      expandedEvents.push(event)
      continue
    }
    
    const occurrences = generateEventOccurrences(
      event,
      new Date(startDate),
      new Date(endDate)
    )
    
    expandedEvents.push(...occurrences)
  }
  
  return expandedEvents
}

/**
 * Genera le occorrenze di un evento ricorrente
 */
function generateEventOccurrences(event, rangeStart, rangeEnd) {
  const occurrences = []
  const rule = event.recurrenceRule
  
  if (!rule || !event.startDate) return [event]
  
  let currentDate = new Date(event.startDate)
  const eventDuration = event.endDate - event.startDate
  let count = 0
  
  // Continua fino a quando non superi il range o i limiti di ricorrenza
  while (currentDate <= rangeEnd && count < 100) { // limite di sicurezza
    
    // Controlla se questa data è esclusa
    const isException = event.exceptionDates?.some(exDate => 
      new Date(exDate).toDateString() === currentDate.toDateString()
    )
    
    if (!isException && currentDate >= rangeStart) {
      const occurrence = {
        ...event.toObject(),
        _id: `${event._id}_${currentDate.getTime()}`,
        startDate: new Date(currentDate),
        endDate: new Date(currentDate.getTime() + eventDuration),
        isRecurrenceInstance: true,
        originalEventId: event._id
      }
      occurrences.push(occurrence)
    }
    
    // Calcola la prossima occorrenza
    currentDate = getNextOccurrence(currentDate, rule)
    count++
    
    // Controlla i limiti di fine ricorrenza
    if (rule.endType === 'count' && count >= rule.endCount) break
    if (rule.endType === 'date' && currentDate > new Date(rule.endDate)) break
  }
  
  return occurrences
}

/**
 * Calcola la prossima occorrenza basata sulla regola di ricorrenza
 */
function getNextOccurrence(currentDate, rule) {
  const nextDate = new Date(currentDate)
  
  switch (rule.frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + rule.interval)
      break
      
    case 'weekly':
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        // Trova il prossimo giorno della settimana
        const currentDay = nextDate.getDay()
        const sortedDays = rule.daysOfWeek.sort((a, b) => a - b)
        
        let nextDay = sortedDays.find(day => day > currentDay)
        if (!nextDay) {
          // Se non c'è un giorno successivo questa settimana, vai alla prossima
          nextDay = sortedDays[0]
          nextDate.setDate(nextDate.getDate() + (7 - currentDay + nextDay))
        } else {
          nextDate.setDate(nextDate.getDate() + (nextDay - currentDay))
        }
      } else {
        nextDate.setDate(nextDate.getDate() + (7 * rule.interval))
      }
      break
      
    case 'monthly':
      if (rule.dayOfMonth) {
        nextDate.setMonth(nextDate.getMonth() + rule.interval)
        nextDate.setDate(rule.dayOfMonth)
      } else {
        nextDate.setMonth(nextDate.getMonth() + rule.interval)
      }
      break
      
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + rule.interval)
      break
  }
  
  return nextDate
}

export default app
