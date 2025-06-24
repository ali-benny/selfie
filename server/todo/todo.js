import express from 'express'
import mongoose from 'mongoose'
import { connect } from '../app.js'

const app = express()
app.use(express.json())

// Inizializza la connessione quando il modulo viene montato
app.on('mount', async () => {
  await connect('todo')
})

// ===============================
// SCHEMA UNIFICATO TODO/TASK
// ===============================
const TodoSchema = new mongoose.Schema(
  {
    // Campi base (compatibili con todos semplici)
    text: {
      type: String,
      required: true
    },
    title: {
      type: String,
      get: function () {
        return this.text
      }, // Alias per compatibilità
      set: function (value) {
        this.text = value
      }
    },

    // Stato completamento
    checked: {
      type: Boolean,
      default: false
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: function () {
        return this.checked ? 100 : 0
      }
    },

    // Date
    date: {
      type: Date,
      default: Date.now
    },
    dueDate: {
      type: Date,
      get: function () {
        return this.date
      }, // Alias
      set: function (value) {
        this.date = value
      }
    },
    startDate: Date,
    endDate: Date,

    // Authorship e condivisione
    author: {
      type: String,
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      get: function () {
        return this.author
      }
    },
    readers: {
      type: Array,
      default: []
    },
    assignedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
      }
    ],

    // Tipologia e origine
    type: {
      type: String,
      enum: ['simple', 'note_todo'],
      default: 'simple'
    },

    // Per compatibilità note todos
    from: {
      id: String,
      type: String
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Todo'
    },

    // Metadati avanzati
    description: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },

    // Categorizzazione
    category: {
      type: String,
      enum: ['work', 'personal', 'health', 'study', 'travel', 'other'],
      default: 'other'
    },

    // Fasi progetto
    phase: String,
    subPhase: String,

    // Tempo e stima
    estimatedHours: Number,
    actualHours: {
      type: Number,
      default: 0
    },
    duration: Number, // Durata in giorni

    // Pomodoro integration
    pomodoro: {
      estimatedPomodoros: Number,
      completedPomodoros: {
        type: Number,
        default: 0
      }
    },

    // Metadati
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    // Abilita virtual fields e toJSON transformation
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true }
  }
)

// Index per performance
TodoSchema.index({ author: 1, createdAt: -1 })
TodoSchema.index({ type: 1, checked: 1 })
TodoSchema.index({ 'from.id': 1, 'from.type': 1 })
TodoSchema.index({ assignedUsers: 1 })

// Middleware per auto-update
TodoSchema.pre('save', function (next) {
  this.updatedAt = new Date()

  // Auto-sync progress and checked
  if (this.progress >= 100 && !this.checked) {
    this.checked = true
    this.state = 'completed'
  } else if (this.checked && this.progress < 100) {
    this.progress = 100
    this.state = 'completed'
  } else if (!this.checked && this.progress > 0 && this.state === 'not_activatable') {
    this.state = 'active'
  }

  next()
})

const Todo = mongoose.model('Todo', TodoSchema)

// ===============================
// API ENDPOINTS UNIFICATI
// ===============================

// Create new Todo/Task
app.post('/todo', async (req, res) => {
  try {
    const {
      text,
      title, // Alias per text
      type = 'simple',
      author,
      userId, // Potrebbe arrivare come userId invece di author
      assignedUsers = [],
      dueDate,
      startDate,
      endDate,
      priority = 'medium',
      category = 'other',
      description,
      phase,
      estimatedHours,
      pomodoro,
      from,
      readers = [],
      checked = false
    } = req.body
    const todoData = {
      text: text || title,
      type,
      author: author || userId, // Usa userId se author non è presente
      readers,
      checked,
      progress: checked ? 100 : 0,
      priority,
      category,
      description,
      phase,
      estimatedHours,
      pomodoro
    }

    // Date handling
    if (dueDate) todoData.date = new Date(dueDate)
    if (startDate) todoData.startDate = new Date(startDate)
    if (endDate) todoData.endDate = new Date(endDate)

    // Note todo specifics
    if (type === 'note_todo' && from) {
      todoData.from = from
    }
    const todo = new Todo(todoData)
    const savedTodo = await todo.save()

    res.status(201).json(savedTodo)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// Get all Todos/Tasks with filtering
app.get('/todo', async (req, res) => {
  try {
    const userId = req.headers['user-id'] || req.query.userId
    const type = req.query.type // 'simple',  'note_todo', o undefined per tutti
    const includeCompleted = req.query.includeCompleted === 'true'

    let query = {}

    // Filtra per utente se specificato
    if (userId) {
      query = {
        $or: [{ author: userId }, { assignedUsers: userId }, { readers: userId }]
      }
    }

    if (type) {
      query.type = type
    }

    if (!includeCompleted) {
      query.checked = { $ne: true }
    }

    const todos = await Todo.find(query)
      .populate('assignedUsers', 'username email')
      .populate('title')
      .sort({ createdAt: -1 })

    res.status(200).json(todos)
  } catch (err) {
    console.error('Error fetching todos:', err)
    res.status(500).json({ message: err.message })
  }
})

// Get a Todo by _id
app.get('/todo/:id', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id)
      .populate('assignedUsers', 'username email')
      .populate('title')

    if (todo == null) {
      return res.status(404).json({ message: 'Todo not found' })
    }
    res.status(200).json(todo)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

app.put('/todo/:id', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id)
    const { category, checked, description, dueDate, pomodoro, priority, progress, title, type } =
      req.body
    todo.category = category
    todo.checked = checked
    todo.description = description
    todo.dueDate = dueDate
    todo.pomodoro = pomodoro
    todo.priority = priority
    todo.progress = progress
    todo.title = title
    todo.type = type

    await todo.save()

    res.status(200).json(todo)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Update Todo by _id
app.patch('/todo/:id', async (req, res) => {
  try {
    const updates = { ...req.body }

    // Gestione date
    if (updates.dueDate) updates.date = new Date(updates.dueDate)
    if (updates.startDate) updates.startDate = new Date(updates.startDate)
    if (updates.endDate) updates.endDate = new Date(updates.endDate)

    // Auto-update timestamp
    updates.updatedAt = new Date()

    const updatedTodo = await Todo.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    })
      .populate('assignedUsers', 'username email')
      .populate('title')

    if (updatedTodo == null) {
      return res.status(404).json({ message: 'Todo not found' })
    }
    res.status(200).json(updatedTodo)
  } catch (err) {
    console.error('Error updating todo:', err)
    res.status(400).json({ message: err.message })
  }
})

// Toggle checked status
app.patch('/todo/:id/toggle', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id)
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' })
    }

    todo.checked = !todo.checked
    todo.progress = todo.checked ? 100 : 0
    todo.state = todo.checked ? 'completed' : 'active'

    await todo.save()
    await todo.populate('assignedUsers', 'username email')
    await todo.populate('title')

    res.json(todo)
  } catch (error) {
    console.error('Error toggling todo:', error)
    res.status(500).json({ message: error.message })
  }
})

// Update progress
app.patch('/todo/:id/progress', async (req, res) => {
  try {
    const { progress } = req.body

    if (progress < 0 || progress > 100) {
      return res.status(400).json({ message: 'Progress must be between 0 and 100' })
    }

    const todo = await Todo.findByIdAndUpdate(
      req.params.id,
      {
        progress,
        checked: progress >= 100,
        state: progress >= 100 ? 'completed' : 'active',
        updatedAt: new Date()
      },
      { new: true }
    )
      .populate('assignedUsers', 'username email')
      .populate('title')

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' })
    }

    res.json(todo)
  } catch (error) {
    console.error('Error updating progress:', error)
    res.status(500).json({ message: error.message })
  }
})

// Remove Todo by _id
app.delete('/todo/:id', async (req, res) => {
  try {
    const deletedTodo = await Todo.findByIdAndDelete(req.params.id)
    if (deletedTodo == null) {
      return res.status(404).json({ message: 'Todo not found' })
    }
    res.status(200).json({ message: 'Todo deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Calendar endpoint - Todos per calendario
app.get('/todo/calendar/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const { start, end } = req.query

    // Assicurati che la connessione sia stabilita
    if (mongoose.connection.readyState !== 1) {
      await connect('todo')
    }

    // Verifica se il modello Todo esiste
    if (!mongoose.models.Todo) {
      return res.status(500).json({ error: 'Todo model not initialized' })
    }

    // Verifica se userId è un ObjectId valido
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' })
    }

    let query = {
      $or: [{ author: userId }, { assignedUsers: userId }, { readers: userId }]
    }

    // Aggiungi filtro date solo se specificate
    if (start && end) {
      query = {
        $and: [
          {
            $or: [{ author: userId }, { assignedUsers: userId }, { readers: userId }]
          },
          {
            $or: [
              { date: { $gte: new Date(start), $lte: new Date(end) } },
              { startDate: { $gte: new Date(start), $lte: new Date(end) } },
              { endDate: { $gte: new Date(start), $lte: new Date(end) } }
            ]
          }
        ]
      }
    }
    const todos = await Todo.find(query).sort({ date: 1, startDate: 1 })

    // Trasforma per compatibilità calendario
    const calendarEvents = todos.map((todo) => ({
      id: `todo_${todo._id}`,
      _id: todo._id,
      title: todo.text,
      description: todo.description,
      type: todo.type === 'todo',
      start: todo.startDate || todo.date,
      end: todo.endDate || todo.date,
      dueDate: todo.date,
      allDay: !todo.startDate, // Se non ha startDate, è tutto il giorno
      checked: todo.checked,
      progress: todo.progress,
      priority: todo.priority,
      category: todo.category,
      state: todo.state,
      assignedUsers: todo.assignedUsers, // Array di IDs
      from: todo.from
    }))

    res.json(calendarEvents)
  } catch (error) {
    console.error('❌ Error fetching calendar todos:', error)
    console.error('❌ Error stack:', error.stack)
    res.status(500).json({
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

export default app
export { Todo, TodoSchema }
