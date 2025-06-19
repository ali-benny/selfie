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
            <div v-for="[key, notification] in sortedNotifications.entries()" :key="key">
              <AlertNotification
                v-if="notification.kind === 'alert'"
                :notification="notification"
              />
              <ChatNotification
                v-else-if="notification.kind === 'chat'"
                :notification="notification"
              />
              <PomodoroNotification
                v-else-if="notification.invitation.kind === 'pomodoro'"
                :notification="notification"
              />
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
import { computed, provide } from 'vue'
import AlertNotification from './AlertNotification.vue'
import PomodoroNotification from './PomodoroNotification.vue'
import ChatNotification from './ChatNotification.vue'

const { notifications } = storeToRefs(useNotificationStore())

const sortedNotifications = computed(() => {
  return new Map(
    [...notifications.value.entries()].sort(
      (a, b) => new Date(b[1].created) - new Date(a[1].created)
    )
  )
})

provide('notification.viewMode', 'tray')
</script>
