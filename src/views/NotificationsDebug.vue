<template>
  <div class="flex flex-col">
    <div class="w-full flex justify-end py-2">
      <NotificationTray />
    </div>
    <div class="w-full flex gap-5 mt-5 flex-wrap" v-if="isReady">
      <div class="card bg-base-200 w-96 shadow-xl" v-for="user in users" :key="user._id">
        <!-- TODO: ripristina -->
        <!-- <figure class="px-10 pt-10"> -->
        <!--   <img :src="user.image" class="rounded-xl" /> -->
        <!-- </figure> -->
        <div class="card-body">
          <h2 class="card-title">{{ user.name }} {{ user.surname }}</h2>
          <p>Username: {{ user.username }}</p>
          <p># of subscriptions: {{ subscriptions.get(user._id)?.length }}</p>
          <div class="card-actions">
            <button class="btn btn-primary" @click="() => sendAlertNotification(user._id)">
              Send notification
            </button>

            <button class="btn btn-primary" @click="() => sendPomodoroInvitation(user._id)">
              Send pomo invitation
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import NotificationTray from '@/components/notification/NotificationTray.vue'
import { getUsers } from '@/router/user/user'
import { useAsyncState, whenever } from '@vueuse/core'
import { ref } from 'vue'
import { API_URL } from '@/const.js'

const { state: users, isReady } = useAsyncState(async () => {
  return await getUsers()
}, {})

const subscriptions = ref(new Map())

whenever(isReady, async () => {
  users.value.forEach(async (user) => {
    const response = await fetch(`${API_URL}/webpush/${user._id}/subscriptions`)
    if (!response.ok) throw Error(response)
    subscriptions.value.set(user._id, await response.json())
  })
})

async function sendAlertNotification(user) {
  try {
    const response = await fetch(`${API_URL}/${user}/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'alert',
        content:
          'Test test, this is options.body.\nPossiamo mettere parecchio testo qui dentro!!!!',
        created: Date.now()
      })
    })
    if (!response.ok) throw new Error()
  } catch (err) {
    console.error(err)
  }
}

async function sendPomodoroInvitation(user) {
  try {
    const response = await fetch(`${API_URL}/${user}/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'invitation',
        created: Date.now(),
        sender: '676ebff38d5532e8b482b472',
        invitation: {
          kind: 'pomodoro',
          pomodoro: {
            name: 'Prova invito',
            pomodoroTime: 15,
            shortBreakTime: 4,
            longBreak: {
              time: 7,
              interval: 5
            },
            color: {
              name: 'Maroon',
              hex: '#ee99a0'
            }
          }
        }
      })
    })
    if (!response.ok) throw new Error()
  } catch (err) {
    console.error(err)
  }
}
</script>
