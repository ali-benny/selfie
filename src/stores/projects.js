import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const useProjectsStore = defineStore('projects', () => {
  // State
  const projects = ref([])
  const currentProject = ref(null)
  const tasks = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Getters
  const availableProjects = computed(() => projects.value)
  const currentProjectTasks = computed(() => 
    tasks.value.filter(task => task.projectId === currentProject.value?._id)
  )
  const projectStats = computed(() => {
    if (!currentProject.value) return null
    
    const projectTasks = currentProjectTasks.value
    const total = projectTasks.length
    const completed = projectTasks.filter(task => task.state === 'completed').length
    const active = projectTasks.filter(task => task.state === 'active').length
    const delayed = projectTasks.filter(task => task.state === 'delayed').length
    
    return {
      total,
      completed,
      active,
      delayed,
      completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  })

  // Actions
  const loadProjects = async (userId) => {
    if (!userId) return
    
    isLoading.value = true
    error.value = null
    
    try {
      const response = await fetch(`${API_URL}/users/${userId}/projects`, {
        headers: {
          'user-id': userId
        }
      })
      
      if (response.ok) {
        projects.value = await response.json()
      } else {
        throw new Error(`Failed to load projects: ${response.status}`)
      }
    } catch (err) {
      error.value = err.message
      console.error('Error loading projects:', err)
    } finally {
      isLoading.value = false
    }
  }

  const loadProject = async (projectId, userId) => {
    if (!projectId || !userId) return
    
    isLoading.value = true
    error.value = null
    
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}`, {
        headers: {
          'user-id': userId
        }
      })
      
      if (response.ok) {
        currentProject.value = await response.json()
      } else {
        throw new Error(`Failed to load project: ${response.status}`)
      }
    } catch (err) {
      error.value = err.message
      console.error('Error loading project:', err)
    } finally {
      isLoading.value = false
    }
  }

  const loadTasks = async (projectId, userId) => {
    if (!projectId || !userId) return
    
    isLoading.value = true
    error.value = null
    
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/tasks`, {
        headers: {
          'user-id': userId
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        tasks.value = data.tasks || []
      } else {
        throw new Error(`Failed to load tasks: ${response.status}`)
      }
    } catch (err) {
      error.value = err.message
      console.error('Error loading tasks:', err)
    } finally {
      isLoading.value = false
    }
  }

  const createProject = async (projectData, userId) => {
    if (!userId) return null
    
    isLoading.value = true
    error.value = null
    
    try {
      const response = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId
        },
        body: JSON.stringify({
          ...projectData,
          ownerId: userId
        })
      })
      
      if (response.ok) {
        const newProject = await response.json()
        projects.value.push(newProject)
        return newProject
      } else {
        throw new Error(`Failed to create project: ${response.status}`)
      }
    } catch (err) {
      error.value = err.message
      console.error('Error creating project:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  const createTask = async (projectId, taskData, userId) => {
    if (!projectId || !userId) return null
    
    isLoading.value = true
    error.value = null
    
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId
        },
        body: JSON.stringify(taskData)
      })
      
      if (response.ok) {
        const newTask = await response.json()
        tasks.value.push(newTask)
        return newTask
      } else {
        throw new Error(`Failed to create task: ${response.status}`)
      }
    } catch (err) {
      error.value = err.message
      console.error('Error creating task:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  const updateTask = async (projectId, taskId, taskData, userId) => {
    if (!projectId || !taskId || !userId) return null
    
    isLoading.value = true
    error.value = null
    
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId
        },
        body: JSON.stringify(taskData)
      })
      
      if (response.ok) {
        const updatedTask = await response.json()
        const index = tasks.value.findIndex(task => task._id === taskId)
        if (index !== -1) {
          tasks.value[index] = updatedTask
        }
        return updatedTask
      } else {
        throw new Error(`Failed to update task: ${response.status}`)
      }
    } catch (err) {
      error.value = err.message
      console.error('Error updating task:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  const deleteTask = async (projectId, taskId, userId) => {
    if (!projectId || !taskId || !userId) return false
    
    isLoading.value = true
    error.value = null
    
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'user-id': userId
        }
      })
      
      if (response.ok) {
        tasks.value = tasks.value.filter(task => task._id !== taskId)
        return true
      } else {
        throw new Error(`Failed to delete task: ${response.status}`)
      }
    } catch (err) {
      error.value = err.message
      console.error('Error deleting task:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const clearProject = () => {
    currentProject.value = null
    tasks.value = []
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    projects,
    currentProject,
    tasks,
    isLoading,
    error,
    
    // Getters
    availableProjects,
    currentProjectTasks,
    projectStats,
    
    // Actions
    loadProjects,
    loadProject,
    loadTasks,
    createProject,
    createTask,
    updateTask,
    deleteTask,
    clearProject,
    clearError
  }
})
