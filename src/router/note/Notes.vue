<script setup>
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import edjsHTML from 'editorjs-html'
import { API_URL } from '../../../const.js'
import { getNotes, saveNoteMongo } from './editor/note.js'
import { useToast } from 'vue-toastification'
import { RouterLink } from 'vue-router'
import NoteView from '@/components/NoteView.vue'

const notes = ref([])
const viewMode = ref('list')
const edjsParser = edjsHTML()
const toast = useToast()

onMounted(async () => {
  try {
    notes.value = await getNotes()
  } catch (error) {
    console.error('Failed to fetch notes:', error)
  }
})

async function deleteNote(id) {
  const response = await fetch(API_URL + '/delete', {
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
    toast.success('Note deleted successfully!')
  } else {
    toast.error('Failed to delete note')
  }
}

async function duplicateNote(id) {
  try {
    const response = await fetch(API_URL + '/search', {
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
  return edjsParser.parse(data).join('')
}

function truncate(data, length) {
  const parsedData = parseHtml(data)
  return parsedData.length > length ? parsedData.substring(0, length) + '...' : parsedData
}
</script>

<template>
  <div class="d-flex flex-column flex-grow-1">
    <h1>Le tue note</h1>
    <a
      href="/editor"
      class="btn btn-success floating-btn rounded-circle d-flex align-items-center p-2 fs-2"
      title="Add new note"
    >
      <Icon icon="fluent:note-add-24-filled" />
    </a>
    <div class="d-flex justify-content-end my-2">
      <div class="dropdown">
        <button
          class="btn btn-default dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          Ordina per
        </button>
        <ul class="dropdown-menu" role="menu">
          <li><button class="dropdown-item" @click="orderBy('title')">Titolo</button></li>
          <li><button class="dropdown-item" @click="orderBy('date')">Data</button></li>
          <li><button class="dropdown-item" @click="orderBy('author')">Autore</button></li>
        </ul>
      </div>
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
    <NoteView :viewMode="viewMode" :edit="true" :extended="true"></NoteView>
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
