<template>
  <div class="project-gantt-page min-h-screen bg-base-100">    <!-- Selezione progetto se non specificato -->
    <div v-if="!projectId" class="container mx-auto py-10">
      <div class="card bg-base-200 shadow-lg">
        <div class="card-body">          <div class="flex justify-between items-center mb-6">
            <h2 class="card-title">Select a Project</h2>
            <Popper arrow>
              <button class="btn btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Create New Project
              </button>
              <template #content="{ close }">
                <div class="w-screen sm:w-80 p-3 rounded-box flex flex-col items-stretch gap-2">
                  <h3 class="font-bold text-lg">Create New Project</h3>
                  <form @submit.prevent="createProject(close)" class="space-y-4 py-4">
                    <div class="form-control">
                      <label class="label">
                        <span class="label-text">Project Title *</span>
                      </label>
                      <input 
                        v-model="newProject.title" 
                        type="text" 
                        placeholder="Enter project title" 
                        class="input input-bordered w-full" 
                        required 
                      />
                    </div>
                    
                    <div class="form-control">
                      <label class="label">
                        <span class="label-text">Description</span>
                      </label>
                      <textarea 
                        v-model="newProject.description" 
                        class="textarea textarea-bordered" 
                        placeholder="Enter project description"
                        rows="3"
                      ></textarea>
                    </div>
                    
                    <div class="form-control">
                      <label class="label">
                        <span class="label-text">Status</span>
                      </label>
                      <select v-model="newProject.status" class="select select-bordered w-full">
                        <option value="planning">Planning</option>
                        <option value="active">Active</option>
                        <option value="on_hold">On Hold</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    
                    <div class="form-control">
                      <label class="label">
                        <span class="label-text">Start Date</span>
                      </label>
                      <input 
                        v-model="newProject.startDate" 
                        type="date" 
                        class="input input-bordered w-full" 
                      />
                    </div>
                    
                    <div class="form-control">
                      <label class="label">
                        <span class="label-text">End Date</span>
                      </label>
                      <input 
                        v-model="newProject.endDate" 
                        type="date" 
                        class="input input-bordered w-full" 
                      />
                    </div>
                    
                    <div class="modal-action">
                      <button type="button" @click="close(); resetNewProject()" class="btn">Cancel</button>
                      <button type="submit" class="btn btn-primary" :disabled="!newProject.title">
                        Create Project
                      </button>
                    </div>
                  </form>
                </div>
              </template>
            </Popper>
          </div>
          <div v-if="availableProjects.length === 0" class="text-center py-8">
            <div class="loading loading-spinner loading-lg mb-4"></div>
            <p class="text-gray-500">Loading projects...</p>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div 
              v-for="project in availableProjects" 
              :key="project._id"
              class="card bg-base-100 shadow cursor-pointer hover:shadow-lg transition-shadow"
              @click="selectProject(project._id)"
            >
              <div class="card-body">
                <h3 class="card-title text-lg">{{ project.title }}</h3>
                <p class="text-sm opacity-70">{{ project.description }}</p>
                <div class="flex justify-between items-center mt-4">
                  <div class="badge badge-outline">{{ project.status }}</div>
                  <div class="text-xs opacity-50">
                    {{ formatDate(project.createdAt) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Contenuto progetto esistente -->
    <template v-else>
    <!-- Header del progetto -->
    <div class="navbar bg-base-200 shadow-sm">
      <div class="flex-1">
        <h1 class="text-xl font-bold">{{ project?.title || 'Caricamento...' }}</h1>
        <div class="badge badge-outline ml-3">{{ project?.status }}</div>
      </div>
      <div class="flex-none gap-2">
        <!-- Controlli per il capo progetto -->
        <div v-if="isProjectOwner" class="dropdown dropdown-end z-3">
			<Popper>
				<button class="btn btn-primary btn-sm">
					Azioni Progetto
				</button>
				<template #content>
					<ul class=" menu p-2 shadow bg-base-100 rounded-box w-52">
						<li><a @click="openTaskModal">Aggiungi Task</a></li>
						<li><a @click="openMilestoneModal">Aggiungi Milestone</a></li>
						<li><a @click="exportProject">Esporta Progetto</a></li>
						<li><a @click="openProjectSettings">Impostazioni</a></li>
					</ul>
				</template>
		  </Popper>
        </div>
        
        <!-- Vista corrente -->
        <div class="tabs tabs-boxed">
          <a class="tab" :class="{ 'tab-active': currentView === 'gantt' }" 
             @click="currentView = 'gantt'">Gantt</a>
          <a class="tab" :class="{ 'tab-active': currentView === 'list' }" 
             @click="currentView = 'list'">Lista</a>
        </div>
      </div>
    </div>

    <!-- Statistiche progetto -->
    <div class="stats shadow w-full mb-4">
      <div class="stat">
        <div class="stat-title">Task Totali</div>
        <div class="stat-value">{{ projectStats.totalTasks }}</div>
      </div>
      <div class="stat">
        <div class="stat-title">Completate</div>
        <div class="stat-value !text-success">{{ projectStats.completedTasks }}</div>
      </div>
      <div class="stat">
        <div class="stat-title">In Ritardo</div>
        <div class="stat-value !text-error">{{ projectStats.delayedTasks }}</div>
      </div>
      <div class="stat">
        <div class="stat-title">Progresso</div>
        <div class="stat-value">{{ Math.round(projectStats.completionPercentage) }}%</div>
        <progress class="progress progress-primary w-20" 
                  :value="projectStats.completionPercentage" max="100"></progress>
      </div>
    </div>

    <!-- Filtri e controlli -->
    <div class="card bg-base-200 shadow-sm mb-4">
      <div class="card-body p-4">
        <div class="flex flex-wrap gap-4 items-center">
          <!-- Filtro per utente -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Filtra per utente</span>
            </label>
            <select v-model="selectedUser" class="select select-sm select-bordered">
              <option value="">Tutti gli utenti</option>
              <option v-for="member in project?.members" :key="member.userId" :value="member.userId">
                {{ member.username }}
              </option>
            </select>
          </div>

          <!-- Filtro per stato -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Stato</span>
            </label>
            <select v-model="selectedState" class="select select-sm select-bordered">
              <option value="">Tutti gli stati</option>
              <option value="not_activatable">Non attivabile</option>
              <option value="activatable">Attivabile</option>
              <option value="active">Attiva</option>
              <option value="completed">Completata</option>
              <option value="delayed">In ritardo</option>
            </select>
          </div>

          <!-- Filtro per fase -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Fase</span>
            </label>
            <select v-model="selectedPhase" class="select select-sm select-bordered">
              <option value="">Tutte le fasi</option>
              <option v-for="phase in availablePhases" :key="phase" :value="phase">
                {{ phase }}
              </option>
            </select>
          </div>

          <!-- Toggle per mostrare task completate -->
          <div class="form-control">
            <label class="cursor-pointer label">
              <span class="label-text">Mostra completate</span>
              <input v-model="showCompleted" type="checkbox" class="toggle toggle-sm ml-2" />
            </label>
          </div>
        </div>
      </div>
    </div>    <!-- Vista Gantt -->
    <div v-show="currentView === 'gantt'" class="card bg-base-100 shadow-lg">
      <div class="card-body p-0">
        <GanttChart
          :key="`gantt-${projectId}`"
          :tasks="filteredGanttData"
          :project-id="projectId" 
          :current-user-id="currentUserId"
          :is-project-owner="isProjectOwner"
          @task-created="handleTaskCreated"
          @task-updated="handleTaskUpdated"
          @task-deleted="handleTaskDeleted"
          @link-created="handleLinkCreated"
          @link-deleted="handleLinkDeleted"
        />
      </div>
    </div>

    <!-- Vista Lista -->
    <div v-show="currentView === 'list'" class="card bg-base-100 shadow-lg h-1/3">
      <div class="card-body h-full">
        <div class="overflow-x-auto h-full">
          <table class="table table-zebra h-full">
            <thead>
              <tr>
                <th>Task</th>
                <th>Stato</th>
                <th>Assegnato</th>
                <th>Inizio</th>
                <th>Fine</th>
                <th>Progresso</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody v-if="filteredTasks && filteredTasks.length > 0">
              <tr v-for="task in filteredTasks" :key="`task-${task._id}`" 
                  :class="getTaskRowClass(task)">
                <td>
                  <div class="flex items-center gap-2">
                    <div class="text-lg">
                      <Icon :icon="getTaskTypeIcon(task.type)" />
                    </div>
                    <div>
                      <div class="font-bold">{{ task.title || 'Untitled' }}</div>
                      <div class="text-sm opacity-50">{{ task.phase || '-' }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="badge" :class="getStateBadgeClass(task.state)">
                    {{ getStateLabel(task.state) }}
                  </div>
                </td>
                <td>
                  <div class="avatar-group -space-x-2" v-if="task.assignedUsers && task.assignedUsers.length > 0">
                    <div v-for="(userId, index) in task.assignedUsers.slice(0, 3)" 
                         :key="`${task._id}-user-${index}-${userId}`" class="avatar placeholder">
                      <div class="w-8 bg-neutral-focus text-neutral-content rounded-full">
                        <span class="text-xs">{{ getUserInitials(userId) }}</span>
                      </div>
                    </div>
                    <div v-if="task.assignedUsers.length > 3" class="avatar placeholder">
                      <div class="w-8 bg-neutral-focus text-neutral-content rounded-full">
                        <span class="text-xs">+{{ task.assignedUsers.length - 3 }}</span>
                      </div>
                    </div>
                  </div>
                  <span v-else class="text-gray-500">-</span>
                </td>
                <td>{{ task.startDate ? formatDate(task.startDate) : '-' }}</td>
                <td>{{ task.endDate ? formatDate(task.endDate) : '-' }}</td>
                <td>
                  <div class="flex items-center gap-2">
                    <progress class="progress !progress-primary w-16" 
                              :value="(task.progress || 0) * 100" max="100"></progress>
                    <span class="text-sm">{{ Math.round((task.progress || 0) * 100) }}%</span>
                  </div>
                </td>
                <td>
                  <Popper>
                    <button class="btn btn-ghost btn-xs">⋮</button>
                    <template #content>
                      <ul class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-40">
                        <li v-if="canEditTask(task)">
                          <a @click="editTask(task)">Modifica</a>
                        </li>
                        <li v-if="canUpdateProgress(task)">
                          <a @click="updateProgress(task)">Aggiorna Progresso</a>
                        </li>
                        <li v-if="task.pomodoro && task.pomodoro.estimatedPomodoros > 0">
                          <a @click="startPomodoro(task)">Avvia Pomodoro</a>
                        </li>
                        <li v-if="isProjectOwner">
                          <a @click="deleteTask(task)" class="text-error">Elimina</a>
                        </li>
                      </ul>
                    </template>
                  </Popper>
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr>
                <td colspan="7" class="text-center py-8">
                  <div class="text-gray-500">
                    {{ tasks.length === 0 ? 'Nessun task trovato' : 'Nessun task corrisponde ai filtri' }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div><!-- Modal per nuovo task con Popper -->
    <TaskModal 
      :visible="showTaskModal"
      :project-id="projectId"
      :task="editingTask"
      :project-members="project?.members || []"
      :available-phases="availablePhases"
      @close="closeTaskModal"
      @save="handleTaskSaved"
    />

    <!-- Modal per aggiornamento progresso -->
    <ProgressModal
      v-if="showProgressModal"
      :task="progressTask"
      @close="closeProgressModal"
      @save="handleProgressUpdated"
    />    </template>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/account';
import { API_URL } from '@/const.js';
import GanttChart from '@/components/project/GanttChart.vue';
import TaskModal from '@/components/project/TaskModal.vue';
import ProgressModal from '@/components/project/ProgressModal.vue';

export default {
  name: 'ProjectGantt',
  components: {
    GanttChart,
    TaskModal,
    ProgressModal
  },
  props: {
    projectId: {
      type: String,
      required: false // Cambiato da true a false
    }
  },
  setup(props) {
    const router = useRouter();
    const userStore = useUserStore();
      // State reattivo
    const project = ref(null);
    const tasks = ref([]);
    const ganttLinks = ref([]);
    const availableProjects = ref([]);
    
    // Ottieni currentUserId dal store
    const currentUserId = ref(userStore.loggedUser?._id);
    const currentView = ref('gantt');    
    // Filtri
    const selectedUser = ref('');
    const selectedState = ref('');
    const selectedPhase = ref('');
    const showCompleted = ref(true);    
    // Modals
    const showTaskModal = ref(false);
    const showProgressModal = ref(false);
    const editingTask = ref(null);
    const progressTask = ref(null);      // Nuovo progetto
    const newProject = ref({
      title: '',
      description: '',
      status: 'planning',
      startDate: '',
      endDate: ''
    });
    
    // Computed
    const isProjectOwner = computed(() => {
      const result = {
        project: project.value,
        projectOwnerId: project.value?.ownerId,
        projectOwnerIdType: typeof project.value?.ownerId,
        currentUserId: currentUserId.value,
        currentUserIdType: typeof currentUserId.value,
        isEqual: project.value?.ownerId === currentUserId.value,
        stringComparison: String(project.value?.ownerId) === String(currentUserId.value)
      };
      
      console.log('🔧 isProjectOwner check:', result);
      
      // Usa sia confronto diretto che string per sicurezza
      const isOwner = project.value?.ownerId === currentUserId.value || 
                     String(project.value?.ownerId) === String(currentUserId.value);
      
      console.log('🔧 Final owner result:', isOwner);
      return isOwner;
    });

    const filteredTasks = computed(() => {
      return tasks.value.filter(task => {
        if (selectedUser.value && !task.assignedUsers.includes(selectedUser.value)) return false;
        if (selectedState.value && task.state !== selectedState.value) return false;
        if (selectedPhase.value && task.phase !== selectedPhase.value) return false;
        if (!showCompleted.value && task.state === 'completed') return false;
        return true;
      });
    });

    const filteredGanttData = computed(() => {
      return {
        data: filteredTasks.value,
        links: ganttLinks.value
      };
    });

    const projectStats = computed(() => {
      const total = tasks.value.length;
      const completed = tasks.value.filter(t => t.state === 'completed').length;
      const delayed = tasks.value.filter(t => t.state === 'delayed').length;
      
      return {
        totalTasks: total,
        completedTasks: completed,
        delayedTasks: delayed,
        completionPercentage: total > 0 ? (completed / total) * 100 : 0
      };    });    // Nuovi metodi per gestire progetti multipli
    const loadAvailableProjects = async () => {
      try {
        console.log('🔧 loadAvailableProjects - Loading projects for user:', currentUserId.value);
        
        const response = await fetch(`${API_URL}/users/${currentUserId.value}/projects`, {
          headers: {
            'user-id': currentUserId.value
          }
        });
        
        if (response.ok) {
          const projects = await response.json();
          console.log('✅ loadAvailableProjects - Projects loaded:', projects.length);
          availableProjects.value = projects;
        } else {
          console.error('❌ loadAvailableProjects - Failed to load projects:', response.status);
        }
      } catch (error) {
        console.error('❌ loadAvailableProjects - Error:', error);
      }
    };

    const selectProject = (projectId) => {
      router.push(`/projects/${projectId}`);
    };    // Methods
    const loadProject = async () => {
      if (!props.projectId) return;
      
      try {
        console.log('🔧 loadProject - Loading project:', props.projectId);
        console.log('🔧 loadProject - Current user:', currentUserId.value);
        
        // Chiamata API per caricare il progetto con header user-id
        const response = await fetch(`${API_URL}/projects/${props.projectId}`, {
          headers: {
            'user-id': currentUserId.value
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const projectData = await response.json();
        console.log('🔧 loadProject - Project data received:', {
          id: projectData._id,
          title: projectData.title,
          status: projectData.status,
          ownerId: projectData.ownerId,
          ownerIdType: typeof projectData.ownerId,
          currentUserId: currentUserId.value,
          currentUserIdType: typeof currentUserId.value,
          members: projectData.members?.length || 0
        });
        
        project.value = projectData;
        
        console.log('🔧 loadProject - Project loaded successfully. Owner check:', {
          projectOwnerId: projectData.ownerId,
          currentUserId: currentUserId.value,
          isOwner: projectData.ownerId === currentUserId.value,
          stringMatch: String(projectData.ownerId) === String(currentUserId.value)
        });
        
      } catch (error) {
        console.error('❌ loadProject - Error loading project:', error);
        alert(`Failed to load project: ${error.message}`);
      }    };const availablePhases = computed(() => {
      const phases = [...new Set(tasks.value.map(t => t.phase).filter(Boolean))];
      return phases.sort();
    });    const loadTasks = async () => {
      if (!props.projectId) return;
      
      try {
        console.log('🔧 Frontend: Loading tasks for project:', props.projectId);
        
        // Chiamata API per caricare i task con header user-id
        const response = await fetch(`${API_URL}/projects/${props.projectId}/tasks`, {
          headers: {
            'user-id': currentUserId.value
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Frontend: Tasks loaded:', {
            tasksCount: data.tasks?.length || 0,
            linksCount: data.links?.length || 0
          });
          tasks.value = data.tasks || [];
          ganttLinks.value = data.links || [];
        } else {
          const errorText = await response.text();
          console.error('❌ Failed to load tasks:', response.status, response.statusText, errorText);
        }
      } catch (error) {
        console.error('Errore nel caricamento task:', error);
      }
    };

    // Task handlers
    const handleTaskCreated = async (taskData) => {
      try {
        const response = await fetch(`${API_URL}/projects/${props.projectId}/tasks`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'user-id': currentUserId.value
          },
          body: JSON.stringify(taskData)
        });
        
        if (response.ok) {
          await loadTasks(); // Ricarica i task
        } else {
          const errorText = await response.text();
          console.error('❌ Failed to create task:', response.status, response.statusText, errorText);
          alert('Failed to create task. Check console for details.');
        }
      } catch (error) {
        console.error('Errore nella creazione task:', error);
      }
    };    const handleTaskUpdated = async (taskData) => {
      try {
        console.log('🔧 Frontend: Updating task:', taskData._id, 'with data:', taskData);
        
        const response = await fetch(`${API_URL}/projects/${props.projectId}/tasks/${taskData._id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'user-id': currentUserId.value
          },
          body: JSON.stringify(taskData)
        });
        
        if (response.ok) {
          console.log('✅ Frontend: Task updated successfully');
          await loadTasks(); // Ricarica i task per aggiornare la vista
        } else {
          const errorText = await response.text();
          console.error('❌ Failed to update task:', response.status, response.statusText, errorText);
          alert('Failed to update task. Check console for details.');
        }
      } catch (error) {
        console.error('Errore nell\'aggiornamento task:', error);
      }
    };    const handleTaskDeleted = async (taskId) => {
      try {
        console.log('🔧 Frontend: Deleting task:', taskId);
        
        const response = await fetch(`${API_URL}/projects/${props.projectId}/tasks/${taskId}`, {
          method: 'DELETE',
          headers: { 
            'user-id': currentUserId.value
          }
        });
        
        if (response.ok) {
          console.log('✅ Frontend: Task deleted successfully');
          await loadTasks(); // Ricarica i task per aggiornare la vista
        } else if (response.status === 404) {
          // Task già eliminata o non esistente, non è un errore critico
          console.warn('⚠️ Task not found (already deleted):', taskId);
          await loadTasks(); // Ricarica per sincronizzare lo stato
        } else {
          const errorText = await response.text();
          console.error('❌ Failed to delete task:', response.status, response.statusText, errorText);
          alert('Failed to delete task. Check console for details.');
        }
      } catch (error) {
        console.error('Errore nell\'eliminazione task:', error);
      }
    };

    const handleLinkCreated = async (linkData) => {
      try {
        const response = await fetch(`${API_URL}/projects/${props.projectId}/dependencies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceTaskId: linkData.source,
            targetTaskId: linkData.target,
            type: linkData.type || 'finish_to_start'
          })
        });
        
        if (response.ok) {
          await loadTasks(); // Ricarica per aggiornare le dipendenze
        }
      } catch (error) {
        console.error('Errore nella creazione dipendenza:', error);
      }
    };    const handleLinkDeleted = async (linkId) => {
      try {
        const response = await fetch(`${API_URL}/dependencies/${linkId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          ganttLinks.value = ganttLinks.value.filter(l => l.id !== linkId);
        }
      } catch (error) {
        console.error('Errore nell\'eliminazione dipendenza:', error);
      }
    };

    // Modal handlers
    const openTaskModal = () => {
      editingTask.value = null;
      showTaskModal.value = true;
    };

    const openMilestoneModal = () => {
      editingTask.value = { type: 'milestone' };
      showTaskModal.value = true;
    };

    const closeTaskModal = () => {
      showTaskModal.value = false;
      editingTask.value = null;
    };

    const handleTaskSaved = async (taskData) => {
      if (editingTask.value?._id) {
        await handleTaskUpdated(taskData);
      } else {
        await handleTaskCreated(taskData);
      }
      closeTaskModal();
    };

    const editTask = (task) => {
      editingTask.value = { ...task };
      showTaskModal.value = true;
    };

    const updateProgress = (task) => {
      progressTask.value = task;
      showProgressModal.value = true;
    };

    const closeProgressModal = () => {
      showProgressModal.value = false;
      progressTask.value = null;
    };

    const handleProgressUpdated = async (progressData) => {
      await handleTaskUpdated({
        _id: progressTask.value._id,
        progress: progressData.progress,
        actualHours: progressData.actualHours,
        state: progressData.progress === 1 ? 'completed' : 'active'
      });
      closeProgressModal();
    };    const resetNewProject = () => {
      newProject.value = {
        title: '',
        description: '',
        status: 'planning',
        startDate: '',
        endDate: ''
      };
    };    const createProject = async (closeCallback) => {
      try {
        console.log('🔧 Creating project with data:', {
          projectData: newProject.value,
          currentUserId: currentUserId.value,
          fullData: {
            ...newProject.value,
            ownerId: currentUserId.value
          }
        });
        
        const response = await fetch(`${API_URL}/projects`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'user-id': currentUserId.value // Aggiungi header per il backend
          },
          body: JSON.stringify({
            ...newProject.value,
            ownerId: currentUserId.value
          })
        });
        
        if (response.ok) {
          const projectData = await response.json();
          console.log('✅ Project created successfully:', {
            id: projectData._id,
            title: projectData.title,
            status: projectData.status,
            ownerId: projectData.ownerId,
            sentOwnerId: currentUserId.value,
            ownerMatch: projectData.ownerId === currentUserId.value
          });
          
          availableProjects.value.push(projectData);
          resetNewProject();
          closeCallback();
          
          // Naviga automaticamente al nuovo progetto
          router.push(`/projects/${projectData._id}`);
        } else {
          const errorText = await response.text();
          console.error('❌ Failed to create project:', response.status, response.statusText, errorText);
          alert('Errore nella creazione del progetto. Controlla la console per dettagli.');
        }
      } catch (error) {
        console.error('❌ Errore nella creazione del progetto:', error);
        alert('Errore di rete nella creazione del progetto.');
      }    };

    // Utility methods
    const canEditTask = (task) => {
      if (!task || !task.assignedUsers) return isProjectOwner.value;
      return isProjectOwner.value || task.assignedUsers.includes(currentUserId.value);
    };

    const canUpdateProgress = (task) => {
      if (!task || !task.assignedUsers) return false;
      return task.assignedUsers.includes(currentUserId.value);
    };

    const getTaskRowClass = (task) => {
      if (!task || !task.state) return '';
      const classes = {
        'delayed': '!bg-error/30 bg-opacity-10',
        'completed': '!bg-success/30 bg-opacity-10',
        'active': '!bg-primary/30 bg-opacity-10'
      };
      return classes[task.state] || '';
    };

    const getStateBadgeClass = (state) => {
      const classes = {
        'not_activatable': 'badge-ghost',
        'activatable': 'badge-info',
        'active': 'badge-primary',
        'completed': 'badge-success',
        'delayed': 'badge-error',
        'abandoned': 'badge-warning'
      };
      return classes[state] || 'badge-ghost';
    };

    const getStateLabel = (state) => {
      const labels = {
        'not_activatable': 'Non attivabile',
        'activatable': 'Attivabile',
        'active': 'Attiva',
        'completed': 'Completata',
        'delayed': 'In ritardo',
        'abandoned': 'Abbandonata'
      };
      return labels[state] || state;
    };

    const getTaskTypeIcon = (type) => {
      const icons = {
        'task': "fluent:clipboard-task-24-filled",
        'milestone': 'mingcute:target-fill',
        'phase': 'mingcute:flag-4-fill'
      };
      return icons[type] || "fluent:clipboard-task-24-filled";
    };    const formatDate = (date) => {
      if (!date) return '-';
      try {
        return new Date(date).toLocaleDateString('it-IT');
      } catch (error) {
        console.warn('Invalid date:', date);
        return '-';
      }
    };

    const getUserInitials = (userId) => {
      if (!userId) return '??';
      if (!project.value?.members) {
        return '??';
      }
      try {
        const member = project.value.members.find(m => m.userId === userId);
        return member?.username ? member.username.slice(0, 2).toUpperCase() : '??';
      } catch (error) {
        console.warn('Error getting user initials for:', userId);
        return '??';
      }
    };const startPomodoro = (task) => {
      // Integrazione con il sistema Pomodoro esistente
      console.log('Starting pomodoro for task:', task.title);
      // Per ora loggiamo, in futuro integrare con il sistema Pomodoro
    };

    // Metodi mancanti per eliminazione e gestione progetto
    const deleteTask = async (task) => {
      if (confirm(`Sei sicuro di voler eliminare la task "${task.title}"?`)) {
        await handleTaskDeleted(task._id);
      }
    };

    const exportProject = () => {
      // TODO: Implementare esportazione progetto
      console.log('Esportazione progetto non ancora implementata');
    };

    const openProjectSettings = () => {
      // TODO: Implementare impostazioni progetto
      console.log('Impostazioni progetto non ancora implementate');
    };// Lifecycle
    onMounted(async () => {
      // Assicurati che currentUserId sia disponibile
      if (!currentUserId.value) {
        console.error('User not logged in');
        return;
      }      if (props.projectId) {
        await loadProject();
        await loadTasks();
      } else {
        await loadAvailableProjects();
      }
    });    // Watch per aggiornamenti automatici
    watch(() => props.projectId, async (newId, oldId) => {
      console.log('ProjectDash: projectId changed from', oldId, 'to', newId);
      if (newId && newId !== oldId) {
        // Reset dello stato quando cambia progetto
        tasks.value = [];
        ganttLinks.value = [];
        
        await loadProject();
        await loadTasks();
      }
    });return {
      // State
      project,
      tasks,
      availableProjects,
      currentUserId,
      currentView,
      selectedUser,
      selectedState,      selectedPhase,
      showCompleted,
      showTaskModal,
      showProgressModal,      editingTask,
      progressTask,
      newProject,
      
      // Computed
      isProjectOwner,
      availablePhases,
      filteredTasks,
      filteredGanttData,
      projectStats,
      
      // Methods
      loadAvailableProjects,
      selectProject,
      handleTaskCreated,
      handleTaskUpdated,
      handleTaskDeleted,
      handleLinkCreated,
      handleLinkDeleted,
      openTaskModal,
      openMilestoneModal,
      closeTaskModal,
      handleTaskSaved,
      editTask,      updateProgress,
      closeProgressModal,
      handleProgressUpdated,
      resetNewProject,
      createProject,
      canEditTask,
      canUpdateProgress,
      getTaskRowClass,
      getStateBadgeClass,
      getStateLabel,
      getTaskTypeIcon,      formatDate,
      getUserInitials,
      startPomodoro,
      deleteTask,
      openProjectSettings,
      exportProject
    };}
};
</script>

<style scoped>
.project-gantt-page {
  padding: 1rem;
}

.toast {
  z-index: 1000;
}

@media (max-width: 768px) {
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .navbar {
    flex-direction: column;
    gap: 1rem;
  }
}

</style>