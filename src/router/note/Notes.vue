<script setup>
import { ref, onMounted } from 'vue'
import { getNotes } from './editor/note.js'
import NoteView from '@/components/NoteView.vue'
import { useUserStore } from '@/stores/account'

const userStore = useUserStore()
const notes = ref([])
const viewMode = ref('list')
const order = ref('title')

onMounted(async () => {
  try {
    notes.value = await getNotes(userStore.loggedUser._id)
  } catch (error) {
    console.error('Failed to fetch notes:', error)
  }
})

const orderBy = (criteria) => {
  order.value = criteria
}
</script>

<template>
  <div class="flex flex-col">
    <a href="/editor" class="btn btn-accent floating-btn btn-circle !text-base-100 shadow-xl text-2xl"
      title="Add new note">
      <Icon icon="fluent:note-add-24-filled" />
    </a>
    <div class="container mx-auto flex justify-between items-center px-2 md:px-5">
      <h1 class="text-2xl font-semibold">Notes</h1>
      <div class="flex justify-end items-center my-2">
        <div class="mx-2">
          <button class="btn btn-default rounded-box" v-if="order === 'title'" @click="orderBy('date')">
            Order by Title
          </button>
          <button class="btn btn-default rounded-box" v-else-if="order === 'date'" @click="orderBy('author')">
            Order by Date
          </button>
          <button class="btn btn-default rounded-box" v-else-if="order === 'author'" @click="orderBy('title')">
            Order by Author
          </button>
        </div>
        <div class="join rounded-box" aria-label="Note View Mode">
          <input type="radio" class="btn btn-sm join-item" id="list" name="options" value="list" v-model="viewMode"
            aria-label="List" />
          <!-- <label class="btn btn-outline btn-primary join-item" for="list">
          <Icon icon="fluent:apps-list-24-filled" />
        </label> -->
          <input type="radio" class="btn btn-sm join-item" id="grid" name="options" value="grid" v-model="viewMode"
            aria-label="Grid" />
          <!-- <label class="btn btn-outline btn-primary join-item" for="grid">
          <Icon icon="fluent:grid-16-filled" />
        </label> -->
        </div>
      </div>
    </div>
    <div class="flex justify-center">
      <NoteView :order="order" :viewMode="viewMode" :edit="true" :extended="true"></NoteView>
    </div>
  </div>
</template>

<style scoped>
.floating-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

#preview img {
  max-width: 100%;
  max-height: 150px;
  height: auto;
  display: block;
  margin: 0 auto;
}

#preview p {
  word-break: break-all;
}
</style>
