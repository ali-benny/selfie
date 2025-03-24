import { useAsyncState } from '@vueuse/core'
import { defineStore } from 'pinia'
import { API_URL } from '~/const'
import { useUserStore } from './account'
export const useNotificationStore = defineStore('notification', () => {
  const userId = useUserStore().loggedUser._id

  const { state: notifications, isReady } = useAsyncState(loadUserNotifications(), [], {
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

      return await response.json()
    } catch (e) {
      console.error(e)
    }
  }
  return {
    notifications,
    isReady
  }
})
