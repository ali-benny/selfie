import express from 'express'
import mongoose from 'mongoose'
import { ObjectId } from 'mongodb'
import { connect, connected } from '../app.js'

// Import usando ES modules
import {
  projectSchema,
  taskSchema,
  taskDependencySchema,
  notificationSchema,
  suggestedIndexes,
  usefulQueries,
  mongooseSchemas
} from './schema.js'

const router = express.Router()
router.use(express.json())

// Definisci i modelli mongoose seguendo il pattern degli altri moduli
const Project = mongoose.model('Project', mongooseSchemas.projectSchema)
const Task = mongoose.model('Task', mongooseSchemas.taskSchema)
const TaskDependency = mongoose.model('TaskDependency', mongooseSchemas.taskDependencySchema)
const Notification = mongoose.model('Notification', mongooseSchemas.notificationSchema)

// Inizializza la connessione al mount del modulo
router.on = router.on || function() {}
router.on('mount', async () => {
  await connect('project')
})

// Middleware per verificare l'autenticazione - temporaneamente disabilitato per test
const requireAuth = (req, res, next) => {
  // Per ora, accetta qualsiasi richiesta per test
  // In futuro implementare la logica di autenticazione corretta
  req.userId = req.headers['user-id'] || req.params.userId || 'test-user'
  next()
}

// Middleware per verificare i permessi del progetto
const checkProjectPermissions = async (req, res, next) => {
  try {
    if (!connected['project']) await connect('project')
    const projectId = req.params.projectId

    const project = await Project.findById(projectId)

    if (!project) {
      return res.status(404).json({ error: 'Progetto non trovato' })
    }

    // Verifica se l'utente è membro del progetto
    const isOwner = project.ownerId.toString() === req.userId
    const isMemberOfArray = project.members && project.members.some((m) => m.userId && m.userId.toString() === req.userId)
    const isMember = isOwner || isMemberOfArray


    if (!isMember) {
      return res.status(403).json({ error: 'Accesso negato al progetto' })
    }

    req.project = project
    req.isOwner = isOwner
    next()
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// =====================
// ROUTES PROGETTI
// =====================

// GET /api/users/:userId/projects - Ottieni progetti dell'utente
router.get('/users/:userId/projects', requireAuth, async (req, res) => {
  try {
    if (!connected['project']) await connect('project')
    
    const userId = req.params.userId

    // Cerca progetti reali nel database
    const projects = await Project.find({
      $or: [
        { ownerId: userId },
        { 'members.userId': userId }
      ]    }).sort({ updatedAt: -1 })

    
    if (projects.length === 0) {
      return res.json([])
    }

    res.json(projects)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/projects/:projectId - Ottieni dettagli progetto
router.get('/projects/:projectId', requireAuth, async (req, res) => {
  try {
    if (!connected['project']) await connect('project')
    
    const projectId = req.params.projectId

    // Cerca il progetto nel database
    const project = await Project.findById(projectId)
      if (!project) {
      return res.status(404).json({ error: 'Progetto non trovato' })
    }

    res.json(project)
  } catch (error) {
    console.error('Error loading project:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET /api/projects/:projectId/tasks - Ottieni task del progetto per Gantt
router.get('/projects/:projectId/tasks', requireAuth, checkProjectPermissions, async (req, res) => {
  try {
    if (!connected['project']) await connect('project')
    const projectId = req.params.projectId
    
    // Try different search patterns
    const tasksWithObjectId = await Task.find({ projectId: new mongoose.Types.ObjectId(projectId) })
    const tasksWithString = await Task.find({ projectId: projectId })
    const tasksWithAnyProjectId = await Task.find({ projectId: { $exists: true } })


    // Use the search that found results, or default to ObjectId search
    let tasks = tasksWithObjectId.length > 0 ? tasksWithObjectId : tasksWithString
    
    // Se non ci sono task reali, ritorna array vuoto
    if (tasks.length === 0) {
      return res.json({
        tasks: [],
        links: []
      })
    }    // Carica anche le dipendenze tra task - SOLO per questo progetto
    const links = await TaskDependency.find({ 
      projectId: mongoose.Types.ObjectId.isValid(projectId) ? new mongoose.Types.ObjectId(projectId) : projectId,
      $or: [
        { sourceTaskId: { $in: tasks.map(t => t._id) } },
        { targetTaskId: { $in: tasks.map(t => t._id) } }
      ]
    })


    const formattedLinks = links.map((link, index) => ({
      id: index + 1,
      source: link.sourceTaskId.toString(),
      target: link.targetTaskId.toString(),
      type: link.type === 'finish_to_start' ? '0' : 
            link.type === 'start_to_start' ? '1' : 
            link.type === 'finish_to_finish' ? '2' : '3'
    }))

    res.json({
      tasks: tasks,
      links: formattedLinks
    })
  } catch (error) {
    console.error('Error loading tasks:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST /api/projects/:projectId/tasks - Crea nuovo task
router.post('/projects/:projectId/tasks', requireAuth, checkProjectPermissions, async (req, res) => {
  try {
    // Solo il proprietario può creare task (o membri se consentito)
    if (!req.isOwner && !req.project.settings.allowMemberTaskCreation) {
      return res.status(403).json({ error: 'Non autorizzato a creare task' })
    }

    // Calcola durata se non specificata
    let duration = req.body.duration
    if (!duration && req.body.startDate && req.body.endDate) {
      const start = new Date(req.body.startDate)
      const end = new Date(req.body.endDate)
      duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    }    // Calcola la posizione per il nuovo task
    const lastTask = await Task.findOne(
      { projectId: req.params.projectId },
      {},
      { sort: { 'position.order': -1 } }
    )
    
    const taskData = {
      title: req.body.title,
      description: req.body.description || '',
      type: req.body.type || 'task',
      phase: req.body.phase || '',
      startDate: req.body.startDate ? new Date(req.body.startDate) : new Date(),
      endDate: req.body.endDate ? new Date(req.body.endDate) : new Date(),
      duration: duration || 1,
      progress: req.body.progress || 0,
      priority: req.body.priority || 'medium',
      state: req.body.state || 'not_activatable',
      assignedUsers: req.body.assignedUsers || [],
      estimatedHours: req.body.estimatedHours || 0,
      pomodoro: {
        estimatedPomodoros: req.body.pomodoro?.estimatedPomodoros || 0,
        completedPomodoros: 0,
        pomodoroSessions: []
      },
      projectId: req.params.projectId, // Assicurati che questo sia il valore corretto
      parentId: req.body.parentId || null,
      createdBy: req.userId,
      position: { 
        order: (lastTask?.position?.order || 0) + 1, 
        level: 0, 
        expanded: true 
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const newTask = new Task(taskData)
    const result = await newTask.save()

    // Crea evento nel calendario se necessario
    if (taskData.type !== 'phase') {
      console.log('📅 Creating calendar event for task')
      await createCalendarEvent(taskData, req.project)
    }

    const responseData = { _id: result._id, ...result.toObject() }
    
    res.status(201).json(responseData)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/projects/:projectId/tasks/:taskId - Aggiorna task esistente
router.put('/projects/:projectId/tasks/:taskId', requireAuth, checkProjectPermissions, async (req, res) => {
  try {
    // Solo il proprietario può modificare task (o membri se consentito)
    if (!req.isOwner && !req.project.settings.allowMemberTaskCreation) {
      return res.status(403).json({ error: 'Non autorizzato a modificare task' })
    }

    // Trova il task esistente
    const existingTask = await Task.findOne({
      _id: req.params.taskId,
      projectId: req.params.projectId
    })

    if (!existingTask) {
      return res.status(404).json({ error: 'Task non trovato' })
    }

    // Calcola durata se startDate o endDate sono cambiati
    let duration = req.body.duration
    if (!duration && req.body.startDate && req.body.endDate) {
      const start = new Date(req.body.startDate)
      const end = new Date(req.body.endDate)
      duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    }

    // Prepara i dati di aggiornamento
    const updateData = {
      title: req.body.title || existingTask.title,
      description: req.body.description || existingTask.description,
      type: req.body.type || existingTask.type,
      phase: req.body.phase || existingTask.phase,
      startDate: req.body.startDate ? new Date(req.body.startDate) : existingTask.startDate,
      endDate: req.body.endDate ? new Date(req.body.endDate) : existingTask.endDate,
      duration: duration || existingTask.duration,
      progress: req.body.progress !== undefined ? req.body.progress : existingTask.progress,
      priority: req.body.priority || existingTask.priority,
      state: req.body.state || existingTask.state,
      assignedUsers: req.body.assignedUsers || existingTask.assignedUsers,
      estimatedHours: req.body.estimatedHours !== undefined ? req.body.estimatedHours : existingTask.estimatedHours,
      notes: req.body.notes || existingTask.notes,
      updatedAt: new Date()
    }

    // Aggiorna pomodoro se fornito
    if (req.body.pomodoro) {
      updateData.pomodoro = {
        ...existingTask.pomodoro,
        ...req.body.pomodoro
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.taskId,
      updateData,
      { new: true, runValidators: true }
    )

    res.json(updatedTask)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE /api/projects/:projectId/tasks/:taskId - Elimina task
router.delete('/projects/:projectId/tasks/:taskId', requireAuth, checkProjectPermissions, async (req, res) => {
  try {
    // Solo il proprietario può eliminare task (o membri se consentito)
    if (!req.isOwner && !req.project.settings.allowMemberTaskCreation) {
      return res.status(403).json({ error: 'Non autorizzato a eliminare task' })
    }

    // Trova il task
    const task = await Task.findOne({
      _id: req.params.taskId,
      projectId: req.params.projectId
    })

    if (!task) {
      return res.status(404).json({ error: 'Task non trovato' })
    }

    // Elimina anche le dipendenze collegate a questo task
    await TaskDependency.deleteMany({
      $or: [
        { sourceTaskId: req.params.taskId },
        { targetTaskId: req.params.taskId }
      ]
    })

    // Elimina il task
    await Task.findByIdAndDelete(req.params.taskId)

    res.json({ message: 'Task eliminato con successo' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/projects - Crea nuovo progetto
router.post('/projects', requireAuth, async (req, res) => {
  try {
    if (!connected['project']) await connect('project')
    
    const projectData = {
      title: req.body.title,
      description: req.body.description || '',
      status: req.body.status || 'planning',
      ownerId: req.body.ownerId || req.userId, // Use ownerId from body if available
      startDate: req.body.startDate ? new Date(req.body.startDate) : new Date(),
      endDate: req.body.endDate ? new Date(req.body.endDate) : null,
      members: [],
      settings: {
        allowMemberTaskCreation: false,
        requireOwnerApproval: true,
        autoScheduling: true,
        notificationsEnabled: true,
        workingDays: [1, 2, 3, 4, 5],
        workingHours: {
          start: "09:00",
          end: "18:00"
        }
      },
      stats: {
        totalTasks: 0,
        completedTasks: 0,
        delayedTasks: 0,
        completionPercentage: 0,
        estimatedEndDate: null
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await Project.create(projectData)
    
    res.status(201).json({
      _id: result._id,
      ...projectData
    })
  } catch (error) {
    console.error('Error creating project:', error)
    res.status(500).json({ error: error.message })
  }
})

// =====================
// DEBUG ROUTE - DA RIMUOVERE IN PRODUZIONE
// =====================

// GET /api/debug/database - Mostra contenuto database per debugging
router.get('/debug/database', requireAuth, async (req, res) => {
  try {
    if (!connected['project']) await connect('project')
    
    // Ottieni tutte le collezioni
    const collections = await mongoose.connection.db.listCollections().toArray()
    
    // Controlla ogni collezione
    const result = {}
    for (const collection of collections) {
      const collectionName = collection.name
      const count = await mongoose.connection.db.collection(collectionName).countDocuments()
      const sample = await mongoose.connection.db.collection(collectionName).find({}).limit(3).toArray()
      
      result[collectionName] = {
        count: count,
        sample: sample.map(doc => ({
          _id: doc._id,
          ...Object.keys(doc).reduce((acc, key) => {
            if (key !== '_id') {
              acc[key] = typeof doc[key] === 'object' ? '[Object]' : doc[key]
            }
            return acc
          }, {})
        }))
      }
    }
    
    res.json({
      collections: result,
      mongooseConnectionState: mongoose.connection.readyState,
      databaseName: mongoose.connection.name
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// =====================

// Funzione helper per creare eventi del calendario (da implementare)
async function createCalendarEvent(taskData, project) {
  // TODO: implementare la creazione di eventi nel calendario
  console.log('Creating calendar event for task:', taskData.title)
}

export default router
