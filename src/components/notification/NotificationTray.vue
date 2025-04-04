<template>
  <Popper arrow>
    <div class="w-auto h-auto flex justify-center items-center">
      <button>
        <Icon icon="mingcute:notification-line" class="text-2xl" />
      </button>
    </div>
    <template #content>
      <div
        class="w-72 min-h-64 min-h-80 max-h-96 flex justify-stretch rounded-lg overflow-hidden m-1"
      >
        <div class="overflow-y-auto" v-if="notifications.size > 0">
          <div class="flex flex-col grow gap-3">
            <div
              class="w-full relative flex flex-col items-stretch rounded-lg bg-base-200 pt-4 pb-1 px-2"
              v-for="[key, notification] in notifications.entries()"
              :key="key"
            >
              <!-- Notification time -->
              <div class="absolute top-1 right-1 text-xs text-neutral">
                {{ printNotificationTime(notification.created) }}
              </div>

              <!-- Icon, title and content -->
              <div class="flex items-center gap-3">
                <Icon :icon="notificationIcon(notification)" class="min-w-6 sm:min-w-8 text-6xl" />
                <div class="text-pretty text-sm flex flex-col items-stretch">
                  <div class="font-bold capitalize">
                    {{ notification.type }}
                  </div>
                  <div
                    class="max-h-[2rem] leading-[1rem] text-ellipsis overflow-hidden text-wrap text-xs font-light"
                  >
                    {{ notification.content }}
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex justify-end gap-1">
                <button
                  class="text-xs text-neutral font-bold cursor-pointer px-2 py-1"
                  v-if="notification.type === 'system'"
                  @click="deleteNotification(notification)"
                >
                  Mark as read
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="flex justify-center items-center grow text-neutral" v-else>
          No notifications to show.
        </div>
      </div>
    </template>
  </Popper>
</template>

<script setup>
import { useNotificationStore } from '@/stores/notification'
import { storeToRefs } from 'pinia'
import dateFormat from 'dateformat'
import { API_URL } from '@/const'

const { notifications } = storeToRefs(useNotificationStore())

async function deleteNotification(notification) {
  try {
    const response = await fetch(`${API_URL}/notification/${notification._id}`, {
      method: 'DELETE'
    })
    if (!response.ok)
      throw new Error(`ERROR - deleteNotification, response status ${response.status}`)

    notifications.value.delete(notification._id)
  } catch (err) {
    console.error(err)
  }
}

// TODO: come posso usare roba dichiarata in backend???
function notificationIcon(notification) {
  switch (notification.type) {
    case 'system':
      return 'fluent:settings-48-regular'
    case 'chat':
      return 'fluent:chat-48-regular'
    case 'alert':
      return 'fluent:alert-urgent-24-regular'
    case 'invite':
      switch (notification.entityType) {
        case 'note':
          return ''
        case 'groups':
          return ''
        case 'pomodoro':
          return 'fluent-emoji-high-contrast:tomato'
        default:
          throw Error('Invalid entity type: ' + notification.entityType)
      }
    default:
      throw Error('Invalid notification type:' + notification.type)
  }
}

function printNotificationTime(created) {
  let diff = Date.now() - new Date(created)
  let seconds = Math.round(diff / 1000)
  let minutes = Math.round(diff / 1000 / 60)
  let hours = Math.round(diff / 1000 / 60 / 60)
  let days = Math.round(diff / 1000 / 60 / 60 / 24)

  if (days > 0) return dateFormat(new Date(created), 'dd mmm M:ss')

  if (hours > 0)
    if (hours > 3) return dateFormat(new Date(created), 'MM:ss')
    else return hours + (hours == 1 ? ' hour' : ' hours') + ' ago'

  if (minutes > 0) return minutes + (minutes == 1 ? ' minute' : ' minutes') + ' ago'

  if (seconds > 0) return seconds + (seconds == 1 ? ' second' : ' seconds') + ' ago'

  return 'now'
}
</script>
