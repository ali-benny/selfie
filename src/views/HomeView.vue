<template>
  <div class="grid grid-cols-3 m-10 gap-5 place-content-center">
    <div class="col-md-6 p-3 rounded-xl shadow-sm bg-base-200">Calendar</div>
    <div class="col-span-2 p-3 rounded-xl shadow-sm bg-base-200">
      <h4>Last Notes</h4>
      <NoteView viewMode="list" :lastModified="2" :edit="false" :extended="false"></NoteView>
    </div>
    <div class="h-100 p-3 rounded-xl shadow-sm bg-base-200">Pomodoro Timer</div>
    <div class="col-span-2">
      <div class="h-100 p-3 rounded-xl shadow-sm bg-base-200">Projects' Gantt View</div>
    </div>
  </div>
</template>

<script setup>
import NoteView from '@/components/NoteView.vue'
</script>
