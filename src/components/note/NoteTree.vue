<template>
  <div class="flex h-screen sticky top-0">
    <div
      class="transition-all duration-300 bg-base-200 border-r border-base-300 rounded-xl h-[calc(100vh-2rem)] overflow-y-auto"
      :class="isOpen ? 'w-80' : 'w-0'"
    >
      <div class="overflow-x-hidden h-full">
        <ul class="menu text-base-content p-4 w-80">
          <TreeNode
            :node="directoryTree"
            :notes="notes"
            @create-dir="handleCreateDir"
            @move-note="handleMoveNote"
          />
        </ul>
      </div>
    </div>

    <!-- Toggle Button -->
    <div class="relative">
      <button
        class="btn btn-md z-[100] hover:btn-primary absolute -left-1 px-1 top-4 !rounded-l-none shadow-lg hover:shadow-primary/40 transition-all duration-300 border-l-0  hover:translate-x-1"
        :class="isOpen ? ' bg-base-200': '!bg-primary !text-base-100'"
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
import { ref, onMounted } from 'vue'
import { getDirectoryStructure, createDirectory, moveNote } from '@/router/note/editor/directory'
import TreeNode from './TreeNode.vue'
import { useUserStore } from '@/stores/account'
import { useToast } from 'vue-toastification'
import { getNotes } from '@/router/note/editor/note'

const userStore = useUserStore()
const toast = useToast()
const directoryTree = ref([])
const notes = ref([])
const isOpen = ref(true) // Stato della sidebar

// Toggle sidebar
function toggleSidebar() {
  isOpen.value = !isOpen.value
}

onMounted(async () => {
  await refreshDirectories()
})

async function refreshDirectories() {
  directoryTree.value = await getDirectoryStructure(userStore.loggedUser._id)
  notes.value = await getNotes(userStore.loggedUser._id)
}

async function handleCreateDir(name, parentId) {
  try {
    await createDirectory(name, parentId, userStore.loggedUser._id)
    await refreshDirectories()
    toast.success('Directory created')
  } catch (err) {
    toast.error('Failed to create directory')
  }
}

async function handleMoveNote(noteId, directoryId) {
  try {
    await moveNote(noteId, directoryId)
    await refreshDirectories()
    directoryId === 'root' ? toast.success('Note moved to All Notes') :
    toast.success('Note moved to '+directoryId)
  } catch (err) {
    toast.error('Failed to move note')
  }
}
</script>

<style scoped>
.menu {
  overflow-y: auto;
  overflow-x: hidden;
}
</style>
