<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="d-flex flex-column">
    <nav class="navbar bg-body-secondary">
      <div class="container-fluid d-flex justify-content-evenly">
        <RouterLink to="/pomodoro">Pomodoro</RouterLink>
      </div>
    </nav>
    <div id="app">
      <RouterView />
    </div>
  </div>
</template>
