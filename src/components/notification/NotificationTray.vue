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
        <div class="w-full overflow-y-auto" v-if="sortedNotifications.size > 0">
          <div class="flex flex-col grow gap-3">
            <div
              class="w-full relative flex items-stretch gap-2 rounded-lg bg-base-200 py-1 px-2"
              v-for="[key, notification] in sortedNotifications.entries()"
              :key="key"
            >
              <div class="flex flex-col justify-center">
                <Icon :icon="notificationIcon(notification)" width="28" />
              </div>

              <div class="flex flex-col gap-1 grow">
                <!-- Notification time -->
                <div class="flex justify-end text-xs text-neutral">
                  {{ printNotificationTime(notification.created) }}
                </div>

                <!-- Icon, title and content -->
                <div class="text-pretty text-sm flex flex-col items-stretch">
                  <div class="font-semibold capitalize">
                    {{ notificationTitle(notification) }}
                  </div>
                  <div
                    class="min-h-[1rem] max-h-[2rem] leading-[1rem] text-ellipsis overflow-hidden text-wrap font-light"
                  >
                    {{ notificationBody(notification) }}
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex justify-end text-sm text-neutral">
                  <div v-if="notification.kind === 'invitation'" class="flex gap-1">
                    <button
                      class="cursor-pointer px-2 py-1"
                      @click="deleteNotification(notification._id)"
                    >
                      Decline
                    </button>

                    <button
                      class="!text-primary cursor-pointer px-2 py-1"
                      @click="acceptInvitation(notification)"
                    >
                      Accept
                    </button>
                  </div>
                  <button
                    v-else
                    class="cursor-pointer px-2 py-1"
                    @click="deleteNotification(notification._id)"
                  >
                    Mark as read
                  </button>
                </div>
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
import { computed } from 'vue'
import { usePomodoroStore } from '@/stores/pomodoro'

const { notifications } = storeToRefs(useNotificationStore())

const sortedNotifications = computed(() => {
  return new Map(
    [...notifications.value.entries()].sort(
      (a, b) => new Date(b[1].created) - new Date(a[1].created)
    )
  )
})

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

async function acceptInvitation(notification) {
  if (notification.kind !== 'invitation') {
    console.error('Notification in not an invitation')
    return
  }

  switch (notification.invitation.kind) {
    case 'note':
    case 'groups':
      throw new Error('yer to be implemented')
    case 'pomodoro':
      try {
        const response = await fetch(`${API_URL}/${notification.user}/pomodoros/configs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...notification.invitation.pomodoro
          })
        })
        if (!response.ok)
          throw new Error(
            `ERROR when creating new Pomodoro Config, response status ${response.status}`
          )
        response.json().then((p) => usePomodoroStore().userConfigs.set(p._id, p))

        await deleteNotification(notification._id)
      } catch (err) {
        console.error(err)
      }
      break
    default:
      throw Error('Invalid entity type: ' + notification.entityType)
  }
}

// TODO: come posso usare roba dichiarata in backend??? metto in const.h???
function notificationIcon(notification) {
  switch (notification.kind) {
    case 'chat':
      return 'fluent:chat-48-regular'
    case 'alert':
      return 'fluent:alert-48-regular'
    case 'invitation':
      switch (notification.invitation.kind) {
        case 'note':
        case 'groups':
          throw Error('Yet to be implemented')
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

function notificationTitle(notification) {
  switch (notification.kind) {
    case 'alert':
      return 'Alert'
    case 'chat':
      return `Message from ${notification.sender.username}`
    case 'invitation': {
      switch (notification.invitation.kind) {
        case 'pomodoro':
          return 'A Pomodoro invitation for you!'
        default:
          throw new Error('invalid invitation kind')
      }
    }
  }
}

function notificationBody(notification) {
  switch (notification.kind) {
    case 'alert':
      return notification.content
    case 'chat':
      return notification.message
    case 'invitation': {
      switch (notification.invitation.kind) {
        case 'pomodoro':
          return `${notification.sender.username} shared their pomodoro with you!`
        default:
          throw new Error('invalid invitation kind')
      }
    }
  }
}
</script>
