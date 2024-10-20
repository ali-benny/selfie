<script setup>
import { RouterLink, RouterView } from 'vue-router'
import IconPomodoro from './components/icons/IconPomodoro.vue'
</script>

<template>
  <div class="navbar bg-base-300 justify-around rounded-b-xl text-2xl !text-primary">
    <RouterLink class="hover:!text-accent" to="/"><Icon icon="ic:round-dashboard" /></RouterLink>
    <RouterLink class="hover:!text-accent" to="/note"
      ><Icon icon="fluent:notebook-32-filled"
    /></RouterLink>
    <RouterLink class="hover:!text-accent" to="/pomodoro">
      <Icon icon="fluent-emoji-high-contrast:tomato" />
    </RouterLink>
    <RouterLink class="hover:!text-accent" to="/user"
      ><Icon icon="fluent:settings-48-filled"
    /></RouterLink>
  </div>
  <div id="app"><RouterView /></div>
</template>
