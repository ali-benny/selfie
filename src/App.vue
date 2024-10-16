<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { Icon } from '@iconify/vue'
</script>

<template>
  <div class="d-flex flex-column">
    <nav class="navbar bg-body-secondary">
      <div class="container-fluid d-flex justify-content-around fs-4">
        <RouterLink to="/">
          <Icon icon="ic:round-dashboard" />
        </RouterLink>
        <RouterLink to="/note">
          <Icon icon="fluent:notebook-32-filled" />
        </RouterLink>
        <RouterLink to="/user">
          <Icon icon="fluent:settings-48-filled" />
        </RouterLink>
        <RouterLink to="/pomodoro">Pomodoro</RouterLink>
      </div>
    </nav>
    <div id="app">
      <RouterView />
    </div>
  </div>
</template>
