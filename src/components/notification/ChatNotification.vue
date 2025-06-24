<template>
  <NotificationBase
    :item="props.item"
    :notification="notification"
    class="cursor-pointer"
    @click="
      () => {
        // TODO: aprire la chat del messaggio
        throw new Error('Chat notification click: yet to be implemented')
      }
    "
  >
    <template #icon>
      <Icon icon="fluent:chat-48-filled" class="!text-primary" />
    </template>

    <template #title>
      {{ notification.sender.username }}
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

const props = defineProps({
  item: Object,
  notification: Object
})

const notification = computed(() => props.notification || props.item.props.notification)

const viewMode = inject('notification.viewMode')
</script>
