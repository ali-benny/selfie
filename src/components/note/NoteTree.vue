<template>
  <div class="flex h-screen top-[20%] absolute sm:sticky z-10">
    <div
      class="transition-all duration-300 bg-base-200 border-r border-base-300 rounded-xl h-[calc(100vh-2rem)]"
      :class="isOpen ? 'w-80' : 'w-0'"
    >
      <div class="overflow-x-hidden h-full">
        <div class="flex justify-end m-3">
          <div class="flex grow w-full"></div>
          <div :class="{ 'motion-preset-confetti': !editmode }">
            <button class="btn btn-ghost btn-sm btn-circle" @click="editmode = !editmode">
              <Icon v-if="!editmode" class="text-xl" icon="mingcute:settings-3-fill" />
              <Icon v-else class="!text-secondary" icon="mingcute:check-fill" />
            </button>
          </div>
        </div>
        <ul class="menu text-base-content px-4 w-80">
          <TreeNode
            :node="directories"
            :notes="notes"
            :edit="editmode"
            @create-dir="handleCreateDir"
            @move-note="handleMoveNote"
            @delete-dir="handleDelete"
          />
        </ul>
      </div>
    </div>

    <!-- Toggle Button -->
    <div class="relative">
      <button
        class="btn btn-md z-[100] hover:btn-primary absolute -left-1 px-1 top-4 !rounded-l-none shadow-lg hover:shadow-primary/40 transition-all duration-300 border-l-0 hover:translate-x-1"
        :class="isOpen ? 'bg-base-200' : '!bg-primary !text-base-100'"
        @click="toggleSidebar"
      >
        <Icon
          :icon="isOpen ? 'fluent:chevron-left-24-filled' : 'fluent:folder-list-20-filled'"
          class="text-2xl"
        />
      </button>
    </div>
  </div>
</template>

<script setup>
import { createDirectory, getDirectoryStructure, moveNote } from '@/router/note/editor/directory'
import { getNotes } from '@/router/note/editor/note'
import { useUserStore } from '@/stores/account'
import { onMounted, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { API_URL } from '~/const'
import TreeNode from './TreeNode.vue'

const userStore = useUserStore()
const toast = useToast()
const directories = ref([])
const notes = ref([])
const isOpen = ref(false) // Stato della sidebar
const editmode = ref(false)

const emit = defineEmits(['note-deleted', 'note-added'])

function toggleSidebar() {
  isOpen.value = !isOpen.value
}

onMounted(async () => {
  await refreshDirectories()
})

async function refreshDirectories() {
  directories.value = await getDirectoryStructure(userStore.loggedUser._id)
  notes.value = await getNotes(userStore.loggedUser._id)
}

async function handleCreateDir(name, parentId) {
  try {
    await createDirectory(name, parentId, userStore.loggedUser._id)
    await refreshDirectories()

    emit('note-added')
  } catch (err) {
    toast.error('Failed to create directory')
  }
}

async function handleDelete(directoryId) {
  try {
    const response = await fetch(`${API_URL}/directories/${directoryId}`, {
      method: 'DELETE'
    })
    if (!response.ok) {
      throw new Error('Failed to delete directory')
    }
    await refreshDirectories()
    emit('note-deleted')
    toast.success('Directory deleted successfully')
  } catch (err) {
    toast.error('Failed to delete directory: ', err)
    console.error(err)
  }
}

async function handleMoveNote(noteId, directoryId) {
  try {
    await moveNote(noteId, directoryId)
    await refreshDirectories()
  } catch (err) {
    toast.error('Failed to move note: ', err)
  }
}
</script>

<style scoped>
.menu {
  overflow-y: auto;
  overflow-x: hidden;
}
</style>
