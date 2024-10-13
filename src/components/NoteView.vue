<script setup>
import { ref, onMounted, computed } from 'vue'
import { Icon } from '@iconify/vue'
import edjsHTML from 'editorjs-html'
import { API_URL } from '../../const.js'
import { getNotes, saveNoteMongo, deleteNote } from '@/router/note/editor/note.js'
import { useToast } from 'vue-toastification'

const props = defineProps(['viewMode', 'lastModified', 'edit', 'extended'])

const notes = ref([])
const edjsParser = edjsHTML()
const toast = useToast()

onMounted(async () => {
  try {
    notes.value = await getNotes()
  } catch (error) {
    console.error('Failed to fetch notes:', error)
  }
})

async function duplicateNote(id) {
  try {
    const response = await fetch(API_URL + `/notes/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Error - duplicating note')
    }

    const note = await response.json()

    const newFilename = 'Copia di ' + note.name
    const newData = { ...note.data }

    // create new note
    await saveNoteMongo(null, newFilename, newData, note.tags)

    notes.value = await getNotes()
    toast.success('Note duplicated successfully')
  } catch (error) {
    toast.error('Error - duplicating note:', error)
  }
}

function orderBy(ordertype) {
  let sortedNotes = []
  if (ordertype === 'title') {
    sortedNotes = [...notes.value].sort((a, b) => a.name.localeCompare(b.name))
  } else if (ordertype === 'date') {
    sortedNotes = [...notes.value].sort((a, b) => new Date(a.date) - new Date(b.date))
  } else if (ordertype === 'author') {
    sortedNotes = [...notes.value].sort((a, b) => a.author.localeCompare(b.author))
  }
  notes.value = sortedNotes
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
  const html = edjsParser.parse(data).join('')
  return html.replace(/src="\/uploads\//g, `src="${API_URL}/uploads/`)
}

function truncate(data, length) {
  const parsedData = parseHtml(data)
  return parsedData.length > length ? parsedData.substring(0, length) + '...' : parsedData
}

const filteredNotes = computed(() => {
  if (props.lastModified) {
    orderBy('date')
    return notes.value.slice(props.lastModified, notes.value.length - 1)
  }
  return notes.value
})

async function removeNote(id) {
  try {
    await deleteNote(id)
    notes.value = await getNotes()
    toast.success('Note deleted successfully')
  } catch (error) {
    console.error('Failed to delete note:', error)
    toast.error('Failed to delete note')
  }
}
</script>

<template>
  <ul class="list-group" v-if="props.viewMode == 'list'">
    <li
      v-for="note in filteredNotes"
      :key="note._id"
      class="list-group-item d-flex flex-row flex-wrap flex-md-nowrap justify-content-between"
    >
      <div class="d-flex flex-column">
        <!-- DEBUG: note _id -->
        <!-- <p>{{ note._id }}</p>  -->
        <h2>{{ note.name }}</h2>
        <p>Author: {{ note.author }}</p>
        <p v-if="props.extended" class="d-flex align-items-center gap-2">
          <Icon icon="ic:round-update" /> {{ formatDate(note.date) }}
        </p>
        <!-- Tags -->
        <div v-if="props.extended" class="d-flex flex-row gap-2 flex-wrap">
          <p v-for="tag in note.tags" class="d-flex px-2 rounded-5 bg-primary-subtle">
            {{ tag }}
          </p>
        </div>
      </div>
      <div
        v-if="props.extended"
        id="preview"
        class="d-flex w-75 m-3 p-3 flex-grow-1 flex-wrap rounded-4 bg-light"
        v-html="truncate(note.data, 200)"
      ></div>
      <!-- <img
            v-if="note.attachment"
            :src="note.attachmentPreview"
            alt="Attachment Preview"
            class="img-fluid"
          /> -->
      <div
        v-if="props.edit"
        class="d-flex flex-md-column flex-row flex-wrap justify-content-center gap-2 mx-auto mt-2"
      >
        <RouterLink
          :to="`/editor?edit=${note._id}`"
          role="button"
          class="btn btn-ghost btn-primary fs-5 d-flex justify-content-center align-items-center"
          title="Edit note"
        >
          <Icon icon="fluent:note-edit-24-regular" /> Modifica
        </RouterLink>
        <button
          @click="duplicateNote(note._id)"
          role="button"
          class="btn btn-ghost btn-outline-primary fs-5 d-flex justify-content-center align-items-center"
          title="Duplicate note"
        >
          <Icon icon="fluent:copy-24-regular" /> Duplica
        </button>
        <button
          @click="removeNote(note._id)"
          role="button"
          class="btn btn-ghost btn-outline-danger fs-5 d-flex justify-content-center align-items-center"
          title="Delete note"
        >
          <Icon icon="fluent:delete-24-regular" /> Elimina
        </button>
      </div>
    </li>
  </ul>
  <div v-if="props.viewMode == 'grid'" class="container-fluid">
    <div class="row">
      <div
        v-for="note in filteredNotes"
        :key="note._id"
        class="col-xl-3 col-lg-4 col-md-6 col-sm-12 d-flex p-2"
      >
        <div class="card d-flex flex-column flex-grow-1 p-3">
          <h2>{{ note.name }}</h2>
          <p>Author: {{ note.author }}</p>
          <p class="d-flex align-items-center gap-2">
            <Icon icon="ic:round-update" /> {{ formatDate(note.date) }}
          </p>
          <!-- Tags -->
          <div class="d-flex flex-row flex-wrap gap-2">
            <p v-for="tag in note.tags" class="d-flex px-2 rounded-5 bg-primary-subtle">
              {{ tag }}
            </p>
          </div>
          <div
            id="preview"
            class="d-flex flex-column flex-grow-1 bg-light card p-2"
            v-html="truncate(note.data, 200)"
          ></div>
          <div
            v-if="props.edit"
            class="d-flex flex-row flex-wrap gap-2 mx-auto justify-content-center mt-2"
          >
            <RouterLink
              :to="`/editor?edit=${note._id}`"
              role="button"
              class="btn btn-ghost btn-primary fs-5 d-flex justify-content-center align-items-center"
              title="Edit note"
            >
              <Icon icon="fluent:note-edit-24-regular" />
            </RouterLink>
            <button
              @click="duplicateNote(note._id)"
              role="button"
              class="btn btn-ghost btn-outline-primary fs-5 d-flex justify-content-center align-items-center"
              title="Duplicate note"
            >
              <Icon icon="fluent:copy-24-regular" />
            </button>
            <button
              @click="removeNote(note._id)"
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
</template>
