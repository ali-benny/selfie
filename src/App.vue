<script setup>
import { useUserStore } from './stores/account'

const userStore = useUserStore()
</script>

<template>
  <div class="container min-h-screen mx-auto flex flex-col">
    <div class="navbar bg-base-300 justify-around rounded-b-xl text-2xl !text-primary">
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
    <div id="app" class="w-full grow">
      <RouterView class="px-2" />
    </div>
  </div>
</template>
