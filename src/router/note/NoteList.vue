<template>
  <div>
    <h1>Le tue note</h1>
    <a
      href="/editor"
      class="btn btn-success floating-btn rounded-circle d-flex align-items-center p-2 fs-2"
      title="Add new note"
    >
      <Icon icon="fluent:note-add-24-filled" />
    </a>
    <div class="d-flex justify-content-end my-2">
      <div class="btn-group" role="group" aria-label="Note View Mode">
        <input type="radio" class="btn-check" id="list" value="list" v-model="viewMode" />
        <label class="btn btn-outline-primary" for="list"
          ><Icon icon="fluent:apps-list-24-filled"
        /></label>
        <input type="radio" class="btn-check" id="grid" value="grid" v-model="viewMode" />
        <label class="btn btn-outline-primary" for="grid"
          ><Icon icon="fluent:grid-16-filled"
        /></label>
      </div>
    </div>
    <ul class="list-group" v-if="viewMode == 'list'">
      <li
        v-for="note in notes"
        :key="note._id"
        class="list-group-item d-flex flex-row flex-wrap justify-content-between"
      >
        <div class="d-flex flex-column">
          <p>{{ note._id }}</p>
          <h2>{{ note.name }}</h2>
          <p>Author: {{ note.author }}</p>
          <p class="d-flex align-items-center gap-2">
            <Icon icon="ic:round-update" /> {{ formatDate(note.date) }}
          </p>
        </div>
        <div
          id="preview"
          class="bg-light p-3 d-flex flex-column w-md-75 m-md-3 flex-md-grow-1 rounded-4 flex-wrap"
          v-html="truncate(note.data, 200)"
        ></div>
        <!-- <img
            v-if="note.attachment"
            :src="note.attachmentPreview"
            alt="Attachment Preview"
            class="img-fluid"
          /> -->
        <div class="d-grid gap-2 mx-auto align-center mt-2">
          <a
            :href="`/editor?edit=${note._id}`"
            role="button"
            class="btn btn-ghost btn-primary fs-5 d-flex justify-content-center align-items-center"
            title="Edit note"
          >
            <Icon icon="fluent:note-edit-24-regular" /> Modifica
          </a>
          <button
            @click="duplicateNote(note._id)"
            role="button"
            class="btn btn-ghost btn-outline-primary fs-5 d-flex justify-content-center align-items-center"
            title="Duplicate note"
          >
            <Icon icon="fluent:copy-24-regular" /> Duplica
          </button>
          <button
            @click="deleteNote(note._id)"
            role="button"
            class="btn btn-ghost btn-outline-danger fs-5 d-flex justify-content-center align-items-center"
            title="Delete note"
          >
            <Icon icon="fluent:delete-24-regular" /> Elimina
          </button>
        </div>
      </li>
    </ul>
    <div v-if="viewMode == 'grid'" class="container-fluid">
      <div class="row">
        <div
          v-for="note in notes"
          :key="note._id"
          class="col-xl-3 col-lg-4 col-md-6 col-sm-12 d-flex p-2"
        >
          <div class="card d-flex flex-column p-3">
            <h2>{{ note.name }}</h2>
            <p>Author: {{ note.author }}</p>
            <p class="d-flex align-items-center gap-2">
              <Icon icon="ic:round-update" /> {{ formatDate(note.date) }}
            </p>
            <div
              id="preview"
              class="d-flex flex-column flex-grow-1 bg-light card p-2"
              v-html="truncate(note.data, 200)"
            ></div>
            <div class="d-flex flex-row flex-wrap gap-2 mx-auto justify-content-center mt-2">
              <a
                :href="`/editor?edit=${note._id}`"
                role="button"
                class="btn btn-ghost btn-primary fs-5 d-flex justify-content-center align-items-center"
                title="Edit note"
              >
                <Icon icon="fluent:note-edit-24-regular" />
              </a>
              <button
                @click="duplicateNote(note._id)"
                role="button"
                class="btn btn-ghost btn-outline-primary fs-5 d-flex justify-content-center align-items-center"
                title="Duplicate note"
              >
                <Icon icon="fluent:copy-24-regular" />
              </button>
              <button
                @click="deleteNote(note._id)"
                role="button"
                class="btn btn-ghost btn-outline-danger fs-5 d-flex justify-content-center align-items-center"
                title="Delete note"
              >
                <Icon icon="fluent:delete-24-regular" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
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

<script>
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import edjsHTML from 'editorjs-html'
import { SERVER_URL } from '@/const'
import { getNotes } from './editor/note'
import { saveNoteMongo } from './editor/note.js'

export default {
  setup() {
    const notes = ref([])
    const viewMode = ref('list')
    const edjsParser = edjsHTML()

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

    async function duplicateNote(id) {
      try {
        const response = await fetch(SERVER_URL + '/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: id })
        })

        if (!response.ok) {
          throw new Error('Error - duplicating note')
        }

        const note = await response.json()

        const newFilename = 'Copia di ' + note.name
        const newData = { ...note.data }

        // create new note
        await saveNoteMongo(null, newFilename, newData)

        notes.value = await getNotes()
        console.log('Note duplicated successfully')
      } catch (error) {
        console.error('Error - duplicating note:', error)
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

    function parseHtml(data) {
      if (!data || !Array.isArray(data.blocks)) {
        return ''
      }
      return edjsParser.parse(data).join('')
    }

    function truncate(data, length) {
      const parsedData = parseHtml(data)
      return parsedData.length > length ? parsedData.substring(0, length) + '...' : parsedData
    }

    return {
      notes,
      viewMode,
      formatDate,
      deleteNote,
      duplicateNote,
      parseHtml,
      truncate
    }
  },
  components: {
    Icon
  }
}
</script>
