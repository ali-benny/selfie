import mongoose from 'mongoose'

// ===============================
// COLLECTION: projects
// ===============================
const projectSchema = {
  _id: "ObjectId",
  title: "String", // Nome del progetto
  description: "String", // Descrizione del progetto
  
  // Gestione utenti e permessi
  ownerId: "ObjectId", // ID del capo-progetto
  members: [
    {
      userId: "ObjectId",
      username: "String",
      role: "String", // "owner", "member"
      joinedAt: "Date"
    }
  ],
  
  // Metadati progetto
  status: "String", // "planning", "active", "completed", "paused", "cancelled"
  priority: "String", // "low", "normal", "medium", "high"
  
  // Date principali
  startDate: "Date",
  endDate: "Date",
  createdAt: "Date",
  updatedAt: "Date",
  
  // Configurazioni progetto
  settings: {
    autoScheduling: "Boolean", // Attiva auto-scheduling dipendenze
    allowMemberTaskCreation: "Boolean", // I membri possono creare task
    notificationsEnabled: "Boolean",
    workingDays: ["Number"], // [1,2,3,4,5] per lun-ven
    workingHours: {
      start: "String", // "09:00"
      end: "String"    // "18:00"
    }
  },
  
  // Statistiche progetto (calcolate)
  stats: {
    totalTasks: "Number",
    completedTasks: "Number", 
    delayedTasks: "Number",
    completionPercentage: "Number",
    estimatedEndDate: "Date"
  }
};

// ===============================
// COLLECTION: tasks
// ===============================
const taskSchema = {
  _id: "ObjectId",
  
  // Riferimenti
  projectId: "ObjectId", // Riferimento al progetto
  parentId: "ObjectId", // Per sotto-task (null se task principale)
  
  // Informazioni base
  title: "String",
  description: "String",
  
  // Tipologia e classificazione
  type: "String", // "task", "milestone", "phase"
  phase: "String", // Nome della fase (es: "Analisi", "Sviluppo", "Test")
  subPhase: "String", // Sottofase opzionale
  
  // Scheduling
  startDate: "Date",
  endDate: "Date", 
  duration: "Number", // Durata in giorni
  estimatedHours: "Number", // Ore stimate per completare
  actualHours: "Number", // Ore effettivamente impiegate
    // Stato e progresso
  state: "String", // "not_activatable", "activatable", "active", "completed", "delayed", "abandoned", "reactivated"
  progress: "Number", // 0-1 (0% - 100%)
  priority: "String", // "low", "medium", "high", "urgent"
  
  // Assegnazione e responsabilità
  assignedUsers: ["ObjectId"], // Array di user ID
  createdBy: "ObjectId", // Chi ha creato il task
  
  // Input/Output per workflow
  input: {
    type: "String", // "note", "file", "none"
    noteId: "ObjectId", // Riferimento a collection notes
    fileUrl: "String",
    fileName: "String",
    required: "Boolean"
  },
  
  output: {
    type: "String", // "note", "file", "boolean", "milestone"
    noteId: "ObjectId", 
    fileUrl: "String",
    fileName: "String",
    completed: "Boolean",
    isMilestone: "Boolean",
    milestoneFixed: "Boolean" // Se true, la milestone non può essere traslata
  },
  
  // Dipendenze tra task
  dependencies: [
    {
      taskId: "ObjectId", // Task da cui dipende
      type: "String", // "finish_to_start", "start_to_start", "finish_to_finish", "start_to_finish"
      lag: "Number" // Giorni di ritardo/anticipo (-N = anticipo, +N = ritardo)
    }
  ],
  
  // Integrazione con Pomodoro Timer
  pomodoro: {
    estimatedPomodoros: "Number", // Quanti pomodori servono
    completedPomodoros: "Number", // Quanti completati
    pomodoroSessions: [
      {
        startTime: "Date",
        endTime: "Date", 
        duration: "Number", // minuti
        completed: "Boolean",
        notes: "String"
      }
    ]
  },
  
  // Collegamenti con altri sistemi
  linkedNotes: ["ObjectId"], // Note associate
  calendarEventId: "ObjectId", // Evento calendario corrispondente
  
  // Gestione ritardi e riprogrammazione
  delayHandling: {
    originalEndDate: "Date", // Data fine originale
    delayReason: "String",
    propagationDecision: "String", // "translate", "compress", "manual"
    notifiedUsers: ["ObjectId"], // Utenti già notificati del ritardo
    lastNotificationDate: "Date"
  },
  
  // Metadati
  createdAt: "Date",
  updatedAt: "Date",
  
  // Posizione nella vista Gantt (per UI)
  position: {
    order: "Number", // Ordine di visualizzazione
    level: "Number", // Livello di indentazione (per gerarchia)
    expanded: "Boolean" // Se i sotto-task sono espansi
  }
};

// ===============================
// COLLECTION: task_dependencies
// ===============================
const taskDependencySchema = {
  _id: "ObjectId",
  projectId: "ObjectId",
  
  sourceTaskId: "ObjectId", // Task predecessore  
  targetTaskId: "ObjectId", // Task successore
  
  // Tipo di dipendenza
  type: "String", // "finish_to_start", "start_to_start", "finish_to_finish", "start_to_finish"
  lag: "Number", // Giorni di lag (+) o lead (-)
  
  // Configurazione propagazione ritardi
  propagateDelays: "Boolean",
  propagationType: "String", // "translate", "compress"
  
  createdAt: "Date",
  createdBy: "ObjectId"
};

// ===============================
// COLLECTION: project_notifications
// ===============================
const notificationSchema = {
  _id: "ObjectId",
  projectId: "ObjectId",
  taskId: "ObjectId", // Opzionale, se relativa a un task specifico
  
  type: "String", // "task_delayed", "milestone_approaching", "task_completed", "dependency_blocking", "project_status_change"
  
  // Destinatari
  recipients: ["ObjectId"], // Array di user ID
  sentTo: ["ObjectId"], // Chi ha già ricevuto la notifica
  
  // Contenuto
  title: "String",
  message: "String",
  priority: "String", // "low", "normal", "high", "urgent"
  
  // Azioni possibili
  actions: [
    {
      type: "String", // "approve_delay", "reject_delay", "reschedule", "reassign"
      label: "String",
      data: "Object" // Dati specifici per l'azione
    }
  ],
  
  // Stato
  status: "String", // "pending", "sent", "read", "acted"
  
  createdAt: "Date",
  expiresAt: "Date" // Per notifiche temporizzate
};

// ===============================
// INDICI SUGGERITI
// ===============================
const suggestedIndexes = {
  // Collection projects
  projects: [
    { ownerId: 1 },
    { "members.userId": 1 },
    { status: 1, updatedAt: -1 },
    { createdAt: -1 }
  ],
  
  // Collection tasks  
  tasks: [
    { projectId: 1, createdAt: -1 },
    { projectId: 1, state: 1 },
    { projectId: 1, startDate: 1, endDate: 1 },
    { assignedUsers: 1, state: 1 },
    { parentId: 1 },
    { endDate: 1, state: 1 }, // Per trovare task in scadenza
    { "dependencies.taskId": 1 }, // Per query dipendenze
    { state: 1, updatedAt: -1 } // Per dashboard globali
  ],
  
  // Collection task_dependencies
  task_dependencies: [
    { projectId: 1 },
    { sourceTaskId: 1 },
    { targetTaskId: 1 },
    { sourceTaskId: 1, targetTaskId: 1 } // Indice composto per unicità
  ],
  
  // Collection project_notifications
  project_notifications: [
    { recipients: 1, status: 1, createdAt: -1 },
    { projectId: 1, createdAt: -1 },
    { taskId: 1 },
    { expiresAt: 1 }, // Per cleanup automatico
    { status: 1, type: 1 }
  ]
};

// ===============================
// QUERY UTILI DI ESEMPIO
// ===============================
const usefulQueries = {
  
  // Ottenere tutti i task di un progetto per il Gantt
  getProjectTasks: `
    db.tasks.find({
      projectId: ObjectId("PROJECT_ID")
    }).sort({ 
      "position.order": 1 
    })
  `,
  
  // Task attivabili per un utente
  getActivatableTasks: `
    db.tasks.find({
      assignedUsers: ObjectId("USER_ID"),
      state: "activatable",
      startDate: { $lte: new Date() }
    })
  `,
  
  // Task in ritardo che richiedono decisioni
  getDelayedTasks: `
    db.tasks.find({
      state: "delayed",
      endDate: { $lt: new Date() },
      "delayHandling.notifiedUsers": { 
        $ne: ObjectId("PROJECT_OWNER_ID") 
      }
    })
  `,
  
  // Calcolare statistiche progetto
  getProjectStats: `
    db.tasks.aggregate([
      { $match: { projectId: ObjectId("PROJECT_ID") } },
      {
        $group: {
          _id: "$projectId",
          totalTasks: { $sum: 1 },
          completedTasks: { 
            $sum: { $cond: [{ $eq: ["$state", "completed"] }, 1, 0] }
          },
          delayedTasks: { 
            $sum: { $cond: [{ $eq: ["$state", "delayed"] }, 1, 0] }
          },
          avgProgress: { $avg: "$progress" }
        }
      }
    ])
  `,
  
  // Task con dipendenze bloccanti
  getBlockedTasks: `
    db.tasks.aggregate([
      {
        $lookup: {
          from: "tasks",
          let: { deps: "$dependencies.taskId" },
          pipeline: [
            { $match: { 
              $expr: { $in: ["$_id", "$$deps"] },
              state: { $ne: "completed" }
            }}
          ],
          as: "blockingTasks"
        }
      },
      {
        $match: {
          state: "not_activatable",
          "blockingTasks.0": { $exists: true }
        }
      }
    ])
  `
};

// ===============================
// EXPORT PER MONGOOSE (se usi Mongoose)
// ===============================

// Creiamo gli schemi Mongoose reali
const mongooseSchemas = {
  projectSchema: new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      username: String,
      role: { type: String, enum: ['owner', 'member'], default: 'member' },
      joinedAt: { type: Date, default: Date.now }    }],
    status: { type: String, enum: ['planning', 'active', 'completed', 'paused', 'cancelled'], default: 'planning' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    startDate: Date,
    endDate: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    settings: {
      autoScheduling: { type: Boolean, default: true },
      allowMemberTaskCreation: { type: Boolean, default: false },
      notificationsEnabled: { type: Boolean, default: true },
      workingDays: { type: [Number], default: [1,2,3,4,5] },
      workingHours: {
        start: { type: String, default: "09:00" },
        end: { type: String, default: "18:00" }
      }
    }
  }),

  taskSchema: new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    title: { type: String, required: true },
    description: String,
    type: { type: String, enum: ['task', 'milestone', 'phase'], default: 'task' },
    phase: String,
    subPhase: String,
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    duration: { type: Number, required: true },
    estimatedHours: Number,
    actualHours: { type: Number, default: 0 },
    state: { 
      type: String, 
      enum: ['not_activatable', 'activatable', 'active', 'completed', 'delayed', 'abandoned', 'reactivated'], 
      default: 'not_activatable'    },
    progress: { type: Number, min: 0, max: 1, default: 0 },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    assignedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }),

  taskDependencySchema: new mongoose.Schema({
    sourceTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    targetTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    type: { type: String, enum: ['finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish'], default: 'finish_to_start' },
    lag: { type: Number, default: 0 },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true }
  }),

  notificationSchema: new mongoose.Schema({
    type: { type: String, enum: ['task_delay', 'project_update', 'deadline_reminder'], required: true },
    title: { type: String, required: true },
    message: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  })
};

export {
  projectSchema,
  taskSchema, 
  taskDependencySchema,
  notificationSchema,
  suggestedIndexes,
  usefulQueries,
  mongooseSchemas
};