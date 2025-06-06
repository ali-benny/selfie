<template>
  <div
    class="notification-container relative max-w-full flex flex-col gap-0.5 bg-[color:var(--global-bg)] rounded-lg text-[color:var(--global-fg) shadow px-2.5 py-3"
    :data-view-mode="viewMode"
  >
    <p class="absolute top-3 right-2.5 text-sm text-subtext-0">
      {{ printNotificationTime() }}
    </p>

    <div class="flex items-center gap-2">
      <div data-icon>
        <slot name="icon"></slot>
      </div>
      <div class="grow">
        <p class="font-bold">
          <slot name="title"></slot>
        </p>
        <p class="text-pretty line-clamp-3">
          <slot name="message"></slot>
        </p>
      </div>
    </div>

    <slot name="actions" :dismiss="dismissNotification"></slot>
  </div>
</template>

<script setup>
import { useNotificationStore } from '@/stores/notification'
import dateFormat from 'dateformat'
import { useNotifications } from 'notivue'
import { inject } from 'vue'

const { item, notification } = defineProps({
  item: Object,
  notification: {
    type: Object,
    required: true
  }
})

const viewMode = inject('notification.viewMode')

const { entries } = useNotifications()

async function dismissNotification() {
  await useNotificationStore().deleteNotification(notification._id)

  if (viewMode === 'notivue') item.clear()

  if (viewMode === 'tray') {
    entries.value
      .filter((i) => i.props.notification._id === notification._id)
      .forEach((i) => i.clear())
  }
}

function printNotificationTime() {
  const time = notification.created

  let diff = Date.now() - new Date(time)
  let seconds = Math.round(diff / 1000)
  let minutes = Math.round(diff / 1000 / 60)
  let hours = Math.round(diff / 1000 / 60 / 60)
  let days = Math.round(diff / 1000 / 60 / 60 / 24)

  if (days > 0) return dateFormat(new Date(time), 'dd mmm M:ss')

  if (hours > 0)
    if (hours > 3) return dateFormat(new Date(time), 'MM:ss')
    else return hours + (hours == 1 ? ' hour' : ' hours') + ' ago'

  if (minutes > 0) return minutes + (minutes == 1 ? ' minute' : ' minutes') + ' ago'

  if (seconds > 30) return seconds + (seconds == 1 ? ' second' : ' seconds') + ' ago'

  return 'Now'
}
</script>

<style>
.notification-container [data-icon] > svg {
  width: var(--icon-size);
  height: var(--icon-size);
}

.notification-container[data-view-mode='tray'] {
  --global-bg: oklch(var(--b2));
  --global-fg: oklch(var(--bc));
  --icon-size: 32px;
}

.notification-container[data-view-mode='notivue'] {
  --global-bg: var(--nv-global-bg);
  --global-fg: var(--nv-global-fg);
  --icon-size: 42px;
}
</style>
