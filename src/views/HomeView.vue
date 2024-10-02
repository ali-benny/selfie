<template>
  <div class="dashboard-container d-flex flex-column vh-100 p-5">
    <div class="flex-grow-1 d-flex flex-column overflow-hidden">
      <div class="row flex-grow-1 mb-3">
        <div class="col-md-6">
          <div class="h-100 p-3 bg-light rounded shadow-sm">Calendario</div>
        </div>
        <div class="col-md-6 p-3 bg-light rounded shadow-sm">
          <h4>Note Recenti</h4>
          <NoteView
            class="p-3"
            viewMode="list"
            :lastModified="2"
            :edit="false"
            :extended="false"
          ></NoteView>
        </div>
      </div>
      <div class="row flex-grow-1">
        <div class="col-md-3 mb-3 mb-md-0">
          <div class="h-100 p-3 bg-light rounded shadow-sm">Pomodoro Timer</div>
        </div>
        <div class="col-md-9">
          <div class="h-100 p-3 bg-light rounded shadow-sm">Gantt View dei Progetti</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import NoteView from '@/components/NoteView.vue'
</script>

<style scoped>
.dashboard-container {
  padding: 1rem;
}

@media (max-width: 767.98px) {
  .dashboard-container {
    height: auto !important;
    min-height: 100vh;
  }
}
</style>
