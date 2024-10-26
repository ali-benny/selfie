<script setup>
import { ref, onMounted, computed } from 'vue'
import { Icon } from '@iconify/vue'
import edjsHTML from 'editorjs-html'
import { API_URL } from '~/const.js'
import { getNotes, saveNoteMongo, deleteNote } from '@/router/note/editor/note.js'
import { useToast } from 'vue-toastification'
import { useUserStore } from '@/stores/account'
import { getUsersByIds } from '@/router/user/user.js'

const userStore = useUserStore()

const props = defineProps({
  viewMode: String,
  lastModified: Number,
  edit: Boolean,
  extended: Boolean,
  order: String
})
const notes = ref([])
const toast = useToast()
const users = ref({})

const checklistParser = (block) => {
  const items = block.data.items
    .map((item) => {
      return `<input type="checkbox" class="checkbox checkbox-sm" ${item.checked ? 'checked="checked"' : 'disabled'}/><span class="label-text">${item.text}</span>`
    })
    .join('')
  return `<label class="label cursor-pointer flex justify-start gap-1">${items}</label>`
}
const edjsParser = edjsHTML({ checklist: checklistParser })

onMounted(async () => {
  try {
    notes.value = await getNotes(userStore.loggedUser._id)
    const authorIds = notes.value.map((note) => note.author)
    const readerIds = notes.value.flatMap((note) => note.readers)
    const uniqueUserIds = [...new Set([...authorIds, ...readerIds])]
    users.value = await getUsersByIds(uniqueUserIds)
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
    await saveNoteMongo({
      id: null,
      filename: newFilename,
      data: newData,
      tags: note.tags,
      author: userStore.loggedUser._id
    })

    notes.value = await getNotes(userStore.loggedUser._id)
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
  if (props.order) orderBy(props.order)
  if (props.lastModified) {
    orderBy('date')
    return notes.value.slice(props.lastModified, notes.value.length - 1)
  }
  return notes.value
})

async function removeNote(id) {
  try {
    await deleteNote(id)
    notes.value = await getNotes(userStore.loggedUser._id)
    toast.success('Note deleted successfully')
  } catch (error) {
    console.error('Failed to delete note:', error)
    toast.error('Failed to delete note')
  }
}
</script>

<template>
  <ul class="m-2 gap-2 flex flex-col max-w-screen-xl" v-if="props.viewMode == 'list'">
    <RouterLink
      :to="`/editor?edit=${note._id}`"
      v-for="note in filteredNotes"
      :key="note._id"
      class="bg-base-200 rounded-box flex flex-wrap md:flex-nowrap p-3 gap-2 justify-between hover:bg-base-content/20 hover:cursor-pointer"
      :class="props.extended ? 'md:grid md:grid-cols-6' : 'flex-row'"
    >
      <div
        class="flex flex-none"
        :class="props.extended ? 'flex-col' : 'flex-row gap-4 items-center justify-between'"
      >
        <!-- DEBUG: note _id -->
        <!-- <p>{{ note._id }}</p>  -->
        <h1 class="font-bold text-lg">{{ note.name }}</h1>
        <div class="flex flex-row flex-wrap items-center w-36">
          <div class="avatar w-10 m-2">
            <div class="ring-primary ring-offset-base-100 rounded-full ring ring-offset-2">
              <img
                :src="users[note.author]?.image"
                :title="users[note.author]?.name + ' ' + users[note.author]?.surname"
              />
            </div>
          </div>
          <div class="avatar-group -space-x-4 hover:-space-x-0 rtl:space-x-reverse">
            <div v-for="reader in note.readers" :key="reader._id" class="avatar h-10">
              <img
                class="mask mask-circle !bg-secondary"
                :src="users[reader]?.image"
                :title="users[reader]?.name + ' ' + users[reader]?.surname"
              />
            </div>
          </div>
        </div>
        <p v-if="props.extended" class="flex items-center gap-2">
          <Icon icon="ic:round-update" /> {{ formatDate(note.date) }}
        </p>
        <!-- Tags -->
        <div v-if="props.extended" class="flex flex-row gap-2 flex-wrap">
          <p
            v-for="tag in note.tags"
            :key="tag._id"
            class="flex px-2 rounded-xl font-semibold bg-primary/50"
          >
            {{ tag }}
          </p>
        </div>
      </div>
      <div
        v-if="props.extended"
        id="preview"
        class="col-span-4 p-3 flex rounded-lg bg-base-300 text-balance truncate"
        v-html="truncate(note.data, 400)"
      ></div>
      <!-- <img
            v-if="note.attachment"
            :src="note.attachmentPreview"
            alt="Attachment Preview"
            class="img-fluid"
          /> -->
      <div
        v-if="props.edit"
        class="md:grid flex md:flex-col flex-wrap justify-center gap-2 mx-auto mt-2"
      >
        <!-- <RouterLink
          :to="`/editor?edit=${note._id}`"
          role="button"
          class="btn btn-primary text-xl flex justify-center items-center"
          title="Edit note"
        >
          <Icon icon="fluent:note-edit-24-regular" /> Modifica
        </RouterLink> -->
        <button
          @click.stop.prevent="duplicateNote(note._id)"
          role="button"
          class="btn btn-outline btn-primary text-xl flex justify-center items-center"
          title="Duplicate note"
        >
          <Icon icon="fluent:copy-24-regular" /> Duplicate
        </button>
        <button
          @click.stop.prevent="removeNote(note._id)"
          role="button"
          class="btn btn-error btn-outline text-xl flex justify-center items-center"
          title="Delete note"
        >
          <Icon icon="fluent:delete-24-regular" /> Delete
        </button>
      </div>
    </RouterLink>
  </ul>
  <div
    v-if="props.viewMode == 'grid'"
    class="m-2 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3"
  >
    <RouterLink
      :to="`/editor?edit=${note._id}`"
      v-for="note in filteredNotes"
      :key="note._id"
      class="card flex flex-col gap-1 p-3 bg-base-200 h-full hover:bg-base-content/20 hover:cursor-pointer"
    >
      <h2 class="text-xl font-bold">{{ note.name }}</h2>
      <p>Author: {{ note.author }}</p>
      <p class="flex align-items-center gap-2">
        <Icon icon="ic:round-update" /> {{ formatDate(note.date) }}
      </p>
      <!-- Tags -->
      <div class="flex flex-row flex-wrap gap-2">
        <p
          v-for="tag in note.tags"
          :key="tag._id"
          class="flex px-2 rounded-xl !bg-primary/50 font-semibold"
        >
          {{ tag }}
        </p>
      </div>
      <div
        id="preview"
        class="flex flex-col grow text-balance bg-base-300 card p-2 truncate"
        v-html="truncate(note.data, 200)"
      ></div>
      <div v-if="props.edit" class="flex flex-row flex-wrap gap-2 mx-auto justify-center mt-2">
        <!-- <RouterLink
          :to="`/editor?edit=${note._id}`"
          role="button"
          class="btn btn-primary text-2xl flex justify-center items-center"
          title="Edit note"
        >
          <Icon icon="fluent:note-edit-24-regular" />
        </RouterLink> -->
        <button
          @click.stop.prevent="duplicateNote(note._id)"
          role="button"
          class="btn btn-outline btn-primary text-2xl flex justify-center items-center"
          title="Duplicate note"
        >
          <Icon icon="fluent:copy-24-regular" />
        </button>
        <button
          @click.stop.prevent="removeNote(note._id)"
          role="button"
          class="btn btn-outline btn-error text-2xl flex justify-center items-center"
          title="Delete note"
        >
          <Icon icon="fluent:delete-24-regular" />
        </button>
      </div>
    </RouterLink>
  </div>
</template>
