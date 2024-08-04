<template>
  <div>
    <h1>Le tue note</h1>
    <a href="/editor" class="btn btn-success floating-btn rounded-5 d-flex align-items-center" title="Add new note">
      <Icon icon="fluent:note-add-24-filled" />Crea nota
    </a>
    <ul class="list-group">
      <li
        v-for="note in notes"
        :key="note._id"
        class="list-group-item d-flex justify-content-between"
      >
        <div>
          <p>{{ note._id }}</p>
          <h2>{{ note.name }}</h2>
          <p>Author: {{ note.author }}</p>
          <p class="d-flex align-items-center gap-2">
            <Icon icon="ic:round-update" /> {{ formatDate(note.date) }}
          </p>
          <!-- <p>{{ note.data }}</p> -->
          <img
            v-if="note.attachment"
            :src="note.attachmentPreview"
            alt="Attachment Preview"
            class="img-fluid"
          />
        </div>
        <!-- TODO: https://editorjs.io/fill-block-with-saved-data/ -->
        <div class="d-flex flex-column gap-2">
          <a
            :href="`/editor?edit=${note._id}`"
            role="button"
            class="btn btn-ghost btn-primary fs-3 d-flex align-items-center"
            title="Edit note"
          >
            <Icon icon="fluent:note-edit-24-regular" />
          </a>
          <button
            @click="deleteNote(note._id)"
            role="button"
            class="btn btn-ghost btn-danger fs-3 d-flex align-items-center"
            title="Delete note"
          >
            <Icon icon="fluent:delete-24-regular" />
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<style>
.floating-btn {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}
</style>

<script>
import { ref, onMounted } from 'vue'
import { getNotes } from './editor/note'
import { Icon } from '@iconify/vue'
import { SERVER_URL } from '@/const'

export default {
  setup() {
    const notes = ref([])

    onMounted(async () => {
      try {
        notes.value = await getNotes()
      } catch (error) {
        console.error('Failed to fetch notes:', error)
      }
    })

    async function deleteNote(id) {
      const response = await fetch(SERVER_URL + '/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          collection: 'Note',
          id: id
        })
      })

      if (response.ok) {
        notes.value = await getNotes()
        console.log('Note deleted successfully')
      } else {
        console.error('Failed to delete note')
      }
    }

    function formatDate(isoString) {
      const date = new Date(isoString)
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${day}/${month}/${year} ${hours}:${minutes}`
    }
    return {
      notes,
      formatDate,
      deleteNote
    }
  },
  components: {
    Icon
  }
}
</script>
