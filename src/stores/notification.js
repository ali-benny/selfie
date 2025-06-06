import { useAsyncState } from '@vueuse/core'
import { defineStore } from 'pinia'
import { API_URL } from '@/const.js'
import { useUserStore } from './account'

// TODO: keep notifications sorted
export const useNotificationStore = defineStore('notification', () => {
  const userId = useUserStore().loggedUser._id

  const { state: notifications, isReady } = useAsyncState(loadUserNotifications(), new Map(), {
    shallow: false
  })

  async function loadUserNotifications() {
    if (!userId) return []
    try {
      const response = await fetch(API_URL + `/${userId}/notifications`)
      if (!response.ok)
        throw new Error(`ERROR - loadUserNotifications, response status ${response.status}`, {
          method: 'GET'
        })

      return new Map((await response.json()).map((n) => [n._id, n]))
    } catch (e) {
      console.error(e)
    }
  }

  function appendNotification(notification) {
    notifications.value.set(notification._id, notification)
  }

  async function deleteNotification(id) {
    try {
      const response = await fetch(`${API_URL}/notifications/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok)
        throw new Error(`ERROR - deleteNotification, response status ${response.status}`)

      notifications.value.delete(id)
    } catch (err) {
      console.error(err)
    }
  }

  return {
    notifications,
    isReady,
    appendNotification,
    deleteNotification
  }
})
