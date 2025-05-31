<template>
  <div class="gantt-container w-full h-full">
    <div ref="ganttContainer" class="gantt-chart w-full h-96"></div>
  </div>
</template>

<script>
import { gantt } from "dhtmlx-gantt";
import "dhtmlx-gantt/codebase/dhtmlxgantt.css";

export default {
  name: "GanttChart",
  props: {
    tasks: {
      type: Object,
      default: () => ({ data: [], links: [] })
    },
    projectId: {
      type: String,
      required: true
    },
    currentUserId: {
      type: String,
      required: true
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
  ],
  mounted() {
    this.initGantt();
    this.loadData();
  },
  beforeUnmount() {
    if (gantt.isGanttReady) {
      gantt.clearData();
    }
  },
  watch: {
    tasks: {
      handler() {
        this.loadData();
      },
      deep: true
    }
  },
  methods: {
    initGantt() {
      // Configurazione base
      gantt.config.date_format = "%Y-%m-%d %H:%i:%s";
      gantt.config.xml_date = "%Y-%m-%d %H:%i:%s";
      
      // Configurazione colonne
      gantt.config.columns = [
        { name: "text", label: "Attività", width: 200, tree: true },
        { name: "start_date", label: "Inizio", width: 100, align: "center" },
        { name: "duration", label: "Durata", width: 80, align: "center" },
        { name: "progress", label: "Progresso", width: 80, align: "center", template: this.progressTemplate },
        { name: "assignee", label: "Assegnato", width: 120, template: this.assigneeTemplate },
        { name: "priority", label: "Priorità", width: 80, template: this.priorityTemplate }
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
    },

    loadData() {
      if (this.tasks && this.tasks.data) {
        // Prepara i dati per DHTMLX Gantt
        const ganttData = {
          data: this.tasks.data.map(task => this.formatTaskForGantt(task)),
          links: this.tasks.links || []
        };
        
        gantt.clearData();
        gantt.parse(ganttData);
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

    progressTemplate(task) {
      return `<div class="progress-bar">
        <div class="progress-fill" style="width: ${task.progress * 100}%"></div>
        <span>${Math.round(task.progress * 100)}%</span>
      </div>`;
    },

    assigneeTemplate(task) {
      if (!task.assignee || task.assignee.length === 0) return '-';
      return task.assignee.slice(0, 2).join(', ') + 
             (task.assignee.length > 2 ? ` +${task.assignee.length - 2}` : '');
    },

    priorityTemplate(task) {
      const priorityIcons = {
        'high': '🔴',
        'medium': '🟡', 
        'low': '🟢',
        'normal': '⚪'
      };
      return priorityIcons[task.priority] || '⚪';
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