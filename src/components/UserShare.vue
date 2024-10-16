<template>
  <div
    class="d-flex rounded-lg shadow bg-light p-3 z-3"
    style="position: fixed; right: 15%; top: 12%"
  >
    <div v-for="user in users" :key="user._id" class="bg-body-secondary rounded-4 p-2">
      {{ user.name }}
    </div>
  </div>
</template>

<script setup>
import { API_URL } from '../../const'
const users = await fetch(`${API_URL}/users`).json()
</script>
