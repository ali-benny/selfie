<template>
  <NotificationBase :item="props.item" :notification="notification">
    <template #icon>
      <IconPomodoro />
    </template>

    <template #title>New Invite</template>
    <template #message>
      <span class="font-semibold">{{ notification.sender.username }}</span> wants to share a
      Pomodoro with you.
    </template>

    <template #actions="{ dismiss }">
      <div class="flex justify-end gap-1">
        <button class="btn btn-sm btn-outline" @click.stop="dismiss()">Decline</button>
        <button class="btn btn-sm btn-primary" @click.stop="acceptPomodoroInvitation(dismiss)">
          Accept
        </button>
      </div>
    </template>
  </NotificationBase>
</template>

<script setup>
import { computed } from 'vue'
import IconPomodoro from '../icons/IconPomodoro.vue'
import NotificationBase from './NotificationBase.vue'
import { API_URL } from '@/const'
import { usePomodoroStore } from '@/stores/pomodoro'

const props = defineProps({
  item: Object,
  notification: Object
})

const notification = computed(() => props.notification || props.item.props.notification)

async function acceptPomodoroInvitation(dismiss) {
  try {
    const response = await fetch(`${API_URL}/${notification.value.user}/pomodoros/configs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...notification.value.invitation.pomodoro
      })
    })
    if (!response.ok)
      throw new Error(`ERROR when creating new Pomodoro Config, response status ${response.status}`)
    response.json().then((p) => usePomodoroStore().userConfigs.set(p._id, p))

    dismiss()

    push.success('Accepted! See your new Pomodoro config in Pomodoro view.')
  } catch (err) {
    console.error(err)
  }
}
</script>
