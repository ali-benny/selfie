<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="navbar bg-base-300 justify-around rounded-b-xl text-2xl !text-primary">
    <RouterLink class="hover:!text-accent" to="/"><Icon icon="ic:round-dashboard" /></RouterLink>
    <RouterLink class="hover:!text-accent" to="/note"><Icon icon="fluent:notebook-32-filled" /></RouterLink>
    <RouterLink class="hover:!text-accent" to="/user"><Icon icon="fluent:settings-48-filled" /></RouterLink>
  </div>
  <div id="app"><RouterView /></div>
</template>
