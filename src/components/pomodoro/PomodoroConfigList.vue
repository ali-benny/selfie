<template>
  <div class="w-full overflow-visible">
    <div v-if="userConfigs.size == 0">
      <p class="text-center">Such empty, create a new focus!</p>
    </div>
    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 auto-rows-fr items-stretch gap-4">
      <div v-for="configId in userConfigs.keys()" :key="configId">
        <PomodoroConfigCard :configId="configId" />
      </div>
    </div>
  </div>
</template>

<script setup>
import PomodoroConfigCard from './PomodoroConfigCard.vue'
import { usePomodoroStore } from '@/stores/pomodoro';
import { storeToRefs } from 'pinia';

const { userConfigs } = storeToRefs(usePomodoroStore())
</script>
