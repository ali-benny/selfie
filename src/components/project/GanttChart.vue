<template>
  <div class="gantt-container w-full h-full">
    <div ref="ganttContainer" class="gantt-chart w-full h-96"></div>
  </div>
</template>

<script>
import { gantt } from "dhtmlx-gantt";
import "dhtmlx-gantt/codebase/dhtmlxgantt.css";

export default {
  name: "GanttChart",  props: {
    tasks: {
      type: Object,
      default: () => ({ data: [], links: [] })
    },
    projectId: {
      type: String,
      default: null
    },
    currentUserId: {
      type: String,
      default: null
    },
    isProjectOwner: {
      type: Boolean,
      default: false
    }
  },
  emits: [
    'task-created',
    'task-updated', 
    'task-deleted',
    'link-created',
    'link-deleted'
  ],  mounted() {
    this.initGantt();
    this.loadData();
  },
  beforeUnmount() {
    if (gantt.isGanttReady) {
      gantt.clearData();
    }
  },  watch: {    projectId: {
      handler(newProjectId, oldProjectId) {
        console.log('🔄 GanttChart: ProjectId changed from', oldProjectId, 'to', newProjectId);
        // Solo quando cambia REALMENTE progetto (non da undefined o quando viene nascosto/mostrato)
        if (newProjectId !== oldProjectId && 
            oldProjectId !== undefined && 
            oldProjectId !== null &&
            newProjectId !== undefined &&
            newProjectId !== null) {
          console.log('🧹 Real ProjectId change detected: performing gentle cleanup');
          this.gentleCleanupAndReload();
        } else if (newProjectId && !oldProjectId) {
          // Prima volta che viene caricato un progetto
          console.log('📊 Initial project load, just loading data');
          this.loadData();
        }
      },
      immediate: false
    },
    tasks: {
      handler(newTasks, oldTasks) {
        console.log('📊 Tasks watcher triggered');
        // Solo se non stiamo cambiando progetto
        if (this.projectId) {
          console.log('📊 Loading data for project:', this.projectId);
          this.loadData();
        }
      },
      deep: true
    }
  },  methods: {
    aggressiveCleanupAndReload() {
      console.log('🧹 Starting aggressive Gantt cleanup');
      
      try {
        // Step 1: Detach tutti gli event listeners
        gantt.detachAllEvents();
        
        // Step 2: Cancella tutti i task e link individualmente
        const allTasks = gantt.getTaskByTime();
        allTasks.forEach(task => {
          try {
            gantt.deleteTask(task.id);
          } catch (e) {
            console.warn('Could not delete task:', task.id, e);
          }
        });
        
        const allLinks = gantt.getLinks();
        allLinks.forEach(link => {
          try {
            gantt.deleteLink(link.id);
          } catch (e) {
            console.warn('Could not delete link:', link.id, e);
          }
        });
        
        // Step 3: Clear data multiple times with different methods
        if (gantt.clearData) {
          gantt.clearData();
        }
        if (gantt.clearAll) {
          gantt.clearAll();
        }
        
        // Step 4: Force refresh del rendering
        if (gantt.render) {
          gantt.render();
        }
        
        // Step 5: Re-setup event handlers
        this.setupEventHandlers();
        
        console.log('🧹 Aggressive cleanup completed');
        
        // Step 6: Aspetta un tick e ricarica i dati
        this.$nextTick(() => {
          console.log('📊 Loading new project data after cleanup');
          this.loadData();
        });
        
      } catch (e) {
        console.error('Error during aggressive cleanup:', e);
        // Fallback to full reinitialization
        this.reinitializeGantt();
      }
    },

    gentleCleanupAndReload() {
      console.log('🧽 Starting gentle Gantt cleanup');
      
      try {
        // Solo clear data senza distruggere tutto
        if (gantt.clearData) {
          gantt.clearData();
        }
        
        // Re-render senza reinizializzare
        if (gantt.render) {
          gantt.render();
        }
        
        console.log('🧽 Gentle cleanup completed');
        
        // Carica nuovi dati
        this.$nextTick(() => {
          console.log('📊 Loading new project data after gentle cleanup');
          this.loadData();
        });
        
      } catch (e) {
        console.error('Error during gentle cleanup:', e);
        // Fallback to aggressive cleanup solo se necessario
        this.aggressiveCleanupAndReload();
      }
    },

    reinitializeGantt() {
      console.log('🔄 Reinitializing Gantt completely');
      
      try {
        // Step 1: Distruggi completamente l'istanza corrente
        if (gantt && gantt.destructor) {
          gantt.destructor();
        }
        
        // Step 2: Pulisci il container DOM
        if (this.$refs.ganttContainer) {
          this.$refs.ganttContainer.innerHTML = '';
        }
        
        // Step 3: Aspetta il prossimo tick e reinizializza
        this.$nextTick(() => {
          console.log('🔄 Reinitializing Gantt after DOM clear');
          this.initGantt();
          this.loadData();
        });
        
      } catch (e) {
        console.error('Error during Gantt reinitialization:', e);
        // Fallback: prova comunque a reinizializzare
        this.$nextTick(() => {
          this.initGantt();
          this.loadData();
        });
      }
    },    initGantt() {
      console.log('🚀 Initializing Gantt for project:', this.projectId);
      
      // Se il gantt esiste già, distruggilo completamente
      if (gantt.isGanttReady) {
        console.log('🧹 Destroying existing Gantt instance');
        gantt.destructor();
      }
      
      // Pulisci il container DOM
      if (this.$refs.ganttContainer) {
        this.$refs.ganttContainer.innerHTML = '';
      }
        // Configurazione base
      gantt.config.date_format = "%Y-%m-%d %H:%i:%s";
      gantt.config.xml_date = "%Y-%m-%d %H:%i:%s";
      
      // Configurazione per layout ultra-compatto - Solo colonna attività
      gantt.config.grid_width = 150; // Solo la colonna attività
      gantt.config.row_height = 90; // Più spazio per le card
      gantt.config.bar_height = 16;
      gantt.config.task_height = 16;

      // Solo una colonna con template personalizzato per card
      gantt.config.columns = [
        { 
          name: "text", 
          label: "Attività", 
          width: 340, 
          tree: true,
          template: this.taskCardTemplate
        }
      ];

      // Configurazione milestone
      gantt.config.types = {
        task: "task",
        project: "project", 
        milestone: "milestone"
      };

      // Configurazione stati
      gantt.templates.task_class = (start, end, task) => {
        return this.getTaskStateClass(task);
      };

      // Template per il tooltip
      gantt.templates.tooltip_text = (start, end, task) => {
        return this.getTooltipContent(task);
      };

      // Eventi per la sincronizzazione
      this.setupEventHandlers();

      // Inizializza il Gantt
      gantt.init(this.$refs.ganttContainer);
    },

    setupEventHandlers() {
      // Creazione task
      gantt.attachEvent("onAfterTaskAdd", (id, task) => {
        if (!this.isProjectOwner) {
          gantt.deleteTask(id);
          this.showPermissionError();
          return false;
        }
        this.$emit('task-created', this.formatTaskForDB(task));
      });

      // Aggiornamento task
      gantt.attachEvent("onAfterTaskUpdate", (id, task) => {
        if (!this.canEditTask(task)) {
          this.revertTaskChanges(id);
          return false;
        }
        this.$emit('task-updated', this.formatTaskForDB(task));
      });

      // Eliminazione task
      gantt.attachEvent("onBeforeTaskDelete", (id, task) => {
        if (!this.isProjectOwner) {
          this.showPermissionError();
          return false;
        }
        this.$emit('task-deleted', id);
        return true;
      });

      // Creazione link (dipendenze)
      gantt.attachEvent("onAfterLinkAdd", (id, link) => {
        if (!this.isProjectOwner) {
          gantt.deleteLink(id);
          this.showPermissionError();
          return false;
        }
        this.$emit('link-created', link);
      });

      // Eliminazione link
      gantt.attachEvent("onBeforeLinkDelete", (id, link) => {
        if (!this.isProjectOwner) {
          this.showPermissionError();
          return false;
        }
        this.$emit('link-deleted', id);
        return true;
      });

      // Gestione auto-scheduling per dipendenze
      gantt.attachEvent("onAfterLinkAdd", () => {
        gantt.auto_scheduling = true;
      });
    },    loadData() {
      console.log('📊 GanttChart loadData called for project:', this.projectId);
      
      if (this.tasks && this.tasks.data && this.projectId) {
        // Prepara i dati per DHTMLX Gantt
        const ganttData = {
          data: this.tasks.data.map(task => this.formatTaskForGantt(task)),
          links: this.tasks.links || []
        };

        console.log('📊 GanttChart loading data:', {
          projectId: this.projectId,
          tasksCount: ganttData.data.length,
          linksCount: ganttData.links.length,
          taskIds: ganttData.data.map(t => t.id)
        });
        
        // Aggressive cleanup before loading new data
        try {
          // Remove all existing tasks manually
          const existingTasks = gantt.getTaskByTime();
          existingTasks.forEach(task => {
            try {
              gantt.deleteTask(task.id, true); // silent delete
            } catch (e) {
              console.warn('Could not delete existing task:', task.id);
            }
          });
          
          // Remove all existing links
          const existingLinks = gantt.getLinks();
          existingLinks.forEach(link => {
            try {
              gantt.deleteLink(link.id, true); // silent delete
            } catch (e) {
              console.warn('Could not delete existing link:', link.id);
            }
          });
        } catch (e) {
          console.warn('Error during manual cleanup:', e);
        }
        
        // Clear data with multiple methods
        if (gantt.clearData) {
          gantt.clearData();
        }
        
        // Parse new data
        gantt.parse(ganttData);
        
        // Force render
        if (gantt.render) {
          gantt.render();
        }
        
        console.log('📊 Data loaded successfully for project:', this.projectId);
        
      } else {
        console.log('📊 GanttChart: No data to load for project:', this.projectId);
        
        // Se non ci sono dati, aggressive cleanup
        try {
          const existingTasks = gantt.getTaskByTime();
          existingTasks.forEach(task => {
            try {
              gantt.deleteTask(task.id, true);
            } catch (e) {
              console.warn('Could not delete task during cleanup:', task.id);
            }
          });
        } catch (e) {
          console.warn('Error during no-data cleanup:', e);
        }
        
        if (gantt.clearData) {
          gantt.clearData();
        }
        
        if (gantt.render) {
          gantt.render();
        }
      }
    },

    formatTaskForGantt(task) {
      return {
        id: task._id || task.id,
        text: task.title,
        start_date: new Date(task.startDate),
        end_date: new Date(task.endDate),
        duration: task.duration,
        progress: task.progress || 0,
        type: task.type || 'task', // task, milestone, project
        parent: task.parentId || 0,
        priority: task.priority || 'normal',
        assignee: task.assignedUsers || [],
        state: task.state || 'not_activatable',
        notes: task.notes || '',
        pomodoroCount: task.pomodoroCount || 0,
        dependencies: task.dependencies || []
      };
    },

    formatTaskForDB(task) {
      return {
        _id: task.id,
        title: task.text,
        startDate: task.start_date,
        endDate: task.end_date,
        duration: task.duration,
        progress: task.progress,
        type: task.type,
        parentId: task.parent === 0 ? null : task.parent,
        priority: task.priority,
        assignedUsers: task.assignee,
        state: this.calculateTaskState(task),
        notes: task.notes,
        pomodoroCount: task.pomodoroCount,
        projectId: this.projectId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    },

    calculateTaskState(task) {
      const now = new Date();
      const startDate = new Date(task.start_date);
      const endDate = new Date(task.end_date);

      if (task.progress === 1) return 'completed';
      if (now > endDate && task.progress < 1) return 'delayed';
      if (now >= startDate && now <= endDate) return 'active';
      if (now < startDate) {
        // Controlla se le dipendenze sono completate
        const dependencies = gantt.getLinks().filter(link => link.target == task.id);
        const canStart = dependencies.every(dep => {
          const parentTask = gantt.getTask(dep.source);
          return parentTask.progress === 1;
        });
        return canStart ? 'activatable' : 'not_activatable';
      }
      
      return 'not_activatable';
    },

    getTaskStateClass(task) {
      const state = this.calculateTaskState(task);
      const stateClasses = {
        'not_activatable': 'gantt-task-not-activatable',
        'activatable': 'gantt-task-activatable', 
        'active': 'gantt-task-active',
        'completed': 'gantt-task-completed',
        'delayed': 'gantt-task-delayed',
        'abandoned': 'gantt-task-abandoned'
      };
      
      return stateClasses[state] || '';
    },

    // Template per card compatta che include tutti i dettagli
    taskCardTemplate(task) {
      const percentage = Math.round(task.progress * 100);
      const startDate = new Date(task.start_date).toLocaleDateString('it-IT');
      const endDate = new Date(task.end_date).toLocaleDateString('it-IT');
      
      const priorityIcon = {
        'high': '🔴',
        'medium': '🟡', 
        'low': '🟢',
        'normal': '⚪'
      }[task.priority] || '⚪';

      const assignees = task.assignee || [];
      const assigneeText = assignees.length > 0 ? 
        (assignees.length === 1 ? assignees[0].substring(0, 10) : `${assignees[0].substring(0, 6)}+${assignees.length - 1}`) : 
        'Non assegnato';

      return `
        <div style="padding: 4px; font-size: 11px; line-height: 1.2;">
          <div style="font-weight: bold; margin-bottom: 2px;">${task.text}</div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 1px;" class="flex-col gap-2">
            <span style="color: #6b7280;">${startDate} - ${endDate}</span>
            <span style="color: #6b7280;">${task.duration} days</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="background: #e5e7eb; padding: 1px 4px; border-radius: 3px; font-size: 10px;">${percentage}%</span>
            <span style="font-size: 10px;">${priorityIcon} ${assigneeText}</span>
          </div>
        </div>
      `;
    },    progressTemplate(task) {
      const percentage = Math.round(task.progress * 100);
      return `<div style="text-align: center; font-size: 11px; font-weight: 500;">${percentage}%</div>`;
    },

    assigneeTemplate(task) {
      if (!task.assignee || task.assignee.length === 0) return '<span style="color: #9ca3af;">-</span>';
      if (task.assignee.length === 1) {
        return `<span style="font-size: 11px;">${task.assignee[0].substring(0, 8)}</span>`;
      }
      return `<span style="font-size: 11px;">${task.assignee[0].substring(0, 5)}+${task.assignee.length - 1}</span>`;
    },

    priorityTemplate(task) {
      const priorityMap = {
        'high': '<span style="color: #dc2626; font-size: 14px;">●</span>',
        'medium': '<span style="color: #f59e0b; font-size: 14px;">●</span>', 
        'low': '<span style="color: #10b981; font-size: 14px;">●</span>',
        'normal': '<span style="color: #6b7280; font-size: 14px;">●</span>'
      };
      return priorityMap[task.priority] || priorityMap['normal'];
    },

    getTooltipContent(task) {
      return `
        <b>${task.text}</b><br/>
        <b>Stato:</b> ${this.getStateLabel(task.state)}<br/>
        <b>Durata:</b> ${task.duration} giorni<br/>
        <b>Progresso:</b> ${Math.round(task.progress * 100)}%<br/>
        <b>Assegnato a:</b> ${(task.assignee || []).join(', ')}<br/>
        ${task.notes ? `<b>Note:</b> ${task.notes}<br/>` : ''}
        ${task.pomodoroCount ? `<b>Pomodori:</b> ${task.pomodoroCount}` : ''}
      `;
    },

    getStateLabel(state) {
      const labels = {
        'not_activatable': 'Non attivabile',
        'activatable': 'Attivabile',
        'active': 'Attiva', 
        'completed': 'Conclusa',
        'delayed': 'In ritardo',
        'abandoned': 'Abbandonata'
      };
      return labels[state] || state;
    },

    canEditTask(task) {
      // Solo il capo progetto può modificare la struttura
      if (!this.isProjectOwner) {
        // Gli altri utenti possono solo aggiornare il progresso delle loro task
        return task.assignee && task.assignee.includes(this.currentUserId);
      }
      return true;
    },

    showPermissionError() {
      // Implementa la tua logica di notifica errori
      alert('Non hai i permessi per modificare questo progetto');
    },

    revertTaskChanges(taskId) {
      // Implementa la logica per ripristinare le modifiche
      gantt.refreshTask(taskId);
    },

    // Metodi pubblici per l'interazione esterna
    addTask(taskData) {
      if (!this.isProjectOwner) {
        this.showPermissionError();
        return;
      }
      
      const task = {
        id: gantt.uid(),
        text: taskData.title,
        start_date: new Date(taskData.startDate),
        duration: taskData.duration,
        progress: 0,
        type: taskData.type || 'task',
        parent: taskData.parentId || 0,
        assignee: taskData.assignedUsers || []
      };
      
      gantt.addTask(task);
    },

    deleteTask(taskId) {
      if (!this.isProjectOwner) {
        this.showPermissionError();
        return;
      }
      gantt.deleteTask(taskId);
    },

    updateTaskProgress(taskId, progress) {
      const task = gantt.getTask(taskId);
      if (this.canEditTask(task)) {
        task.progress = progress;
        gantt.updateTask(taskId);
      }
    }
  }
};
</script>

<style scoped>
.gantt-container {
  position: relative;
}

.gantt-chart {
  min-height: 400px;
}

/* Stili personalizzati per gli stati delle task */
:deep(.gantt-task-not-activatable) {
  background-color: #f3f4f6 !important;
  border-color: #9ca3af !important;
}

:deep(.gantt-task-activatable) {
  background-color: #dbeafe !important;
  border-color: #3b82f6 !important;
}

:deep(.gantt-task-active) {
  background-color: #dcfce7 !important;
  border-color: #16a34a !important;
}

:deep(.gantt-task-completed) {
  background-color: #f0fdf4 !important;
  border-color: #15803d !important;
}

:deep(.gantt-task-delayed) {
  background-color: #fef2f2 !important;
  border-color: #dc2626 !important;
}

:deep(.gantt-task-abandoned) {
  background-color: #f9fafb !important;
  border-color: #6b7280 !important;
  opacity: 0.6;
}

/* Stile per la barra di progresso */
.progress-bar {
  position: relative;
  width: 100%;
  height: 20px;
  background-color: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #10b981;
  transition: width 0.3s ease;
}

.progress-bar span {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  font-weight: 500;
  color: #374151;
}
</style>