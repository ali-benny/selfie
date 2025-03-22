<template>
  <Suspense>
    <div class="w-full flex gap-5 mt-5" v-if="isReady">
      <div class="card bg-base-200 w-96 shadow-xl" v-for="user in users" :key="user._id">
        <figure class="px-10 pt-10">
          <img :src="user.image" class="rounded-xl" />
        </figure>
        <div class="card-body">
          <h2 class="card-title">{{ user.name }} {{ user.surname }}</h2>
          <p>Username: {{ user.username }}</p>
          <p># of subscriptions: {{ subscriptions.get(user._id)?.length }}</p>
          <div class="card-actions">
            <button class="btn btn-primary" @click="() => sendNotification(user._id)">
              Send notification
            </button>
          </div>
        </div>
      </div>
    </div>
  </Suspense>
</template>
<script setup>
import { getUsers } from '@/router/user/user'
import { useAsyncState, whenever } from '@vueuse/core'
import { ref } from 'vue'
import { API_URL } from '~/const'

const { state: users, isReady } = useAsyncState(async () => {
  return await getUsers()
}, {})

const subscriptions = ref(new Map())

whenever(isReady, async () => {
  users.value.forEach(async (user) => {
    const response = await fetch(API_URL + `/webpush/${user._id}/subscriptions`)
    const s = await response.json()
    console.log(s)
    subscriptions.value.set(user._id, s)
  })
  console.log(subscriptions.value)
})

async function sendNotification(user) {
  const options = {
    body: 'Test test, this is options.body.\nPossiamo mettere parecchio testo qui dentro'
  }
  try {
    const response = await fetch(API_URL + `/webpush/${user}/notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ options: { ...options } })
    })
    if (!response.ok) throw new Error()
    console.log('ok')
  } catch (err) {
    console.error(err)
  }
}
</script>
