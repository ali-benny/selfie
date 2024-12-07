<script setup>
import PomodoroTimerWidget from './components/pomodoro/PomodoroTimerWidget.vue';
import { useRoute } from 'vue-router';
import { useUserStore } from './stores/account'

const userStore = useUserStore()
const currentRoute = useRoute()
</script>

<template>
  <div class="container min-h-screen mx-auto flex flex-col pb-16 sm:!pb-0">
    <div class="navbar relative bg-base-300 justify-around rounded-b-xl text-2xl !text-primary z-20">
      <RouterLink class="hover:!text-accent" to="/">
        <Icon icon="ic:round-dashboard" />
      </RouterLink>
      <RouterLink class="hover:!text-accent" to="/note">
        <Icon icon="fluent:notebook-32-filled" />
      </RouterLink>
      <RouterLink class="hover:!text-accent" to="/pomodoro">
        <Icon icon="fluent-emoji-high-contrast:tomato" />
      </RouterLink>
      <RouterLink class="hover:!text-accent" to="/user">
        <img v-if="userStore.loggedUser.image" :src="userStore.loggedUser.image" alt="User Image"
          class="mask mask-squircle !bg-primary h-9 m-0" />
        <Icon v-else icon="fluent:settings-48-filled" />
      </RouterLink>
    </div>
    <div id="app" class="relative w-full grow px-2">
      <RouterView />
    </div>
    <PomodoroTimerWidget v-if="currentRoute.name !== 'pomodoro'" />
  </div>
</template>
