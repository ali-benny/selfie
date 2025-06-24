<template>
  <NotificationBase
    :item="props.item"
    :notification="notification"
    class="cursor-pointer"
    @click="
      () => {
        switch (notification.alertKind) {
          case 'pomodoro':
            router.push('pomodoro')
            props.item.destroy()
            break
          default:
            throw new Error(
              'Alert notification click: yet to be implemented for kind: ' + notification.alertKind
            )
        }
      }
    "
  >
    <template #icon>
      <Icon icon="fluent:alert-urgent-24-filled" class="!text-primary" />
    </template>

    <template #title>
      {{ notification.title }}
    </template>
    <template #message>
      {{ notification.message }}
    </template>

    <template #actions="{ dismiss }" v-if="viewMode === 'tray'">
      <div class="flex justify-end">
        <button class="btn btn-sm btn-outline" @click.stop="dismiss">Mark as read</button>
      </div>
    </template>
  </NotificationBase>
</template>

<script setup>
import { computed, inject } from 'vue'
import NotificationBase from './NotificationBase.vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  item: Object,
  notification: Object
})

const notification = computed(() => props.notification || props.item.props.notification)

const viewMode = inject('notification.viewMode')

const router = useRouter()
</script>
