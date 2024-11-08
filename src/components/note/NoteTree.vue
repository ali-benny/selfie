<template>
  <div class="drawer">
    <input id="my-drawer" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content">
      <label for="my-drawer" class="btn btn-primary drawer-button">
        <Icon icon="fluent:notebook-24-regular" /> Notes
      </label>
    </div>
    <div class="drawer-side z-50">
      <label for="my-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
      <ul class="menu bg-base-200 text-base-content min-h-full w-80 p-4">
        <!-- Directory tree -->
        <TreeNode
          :node="directoryTree"
          :notes="notes"
          @create-dir="handleCreateDir"
          @move-note="handleMoveNote"
        />
      </ul>
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
  console.log('handleMoveNote received:', { noteId, directoryId })

  try {
    await moveNote(noteId, directoryId)
    await refreshDirectories()
    toast.success('Note moved')
  } catch (err) {
    toast.error('Failed to move note')
  }
}
</script>
