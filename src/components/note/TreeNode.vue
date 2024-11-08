<template>
  <div class="tree-node mb-2" ref="nodeElement">
    <div class="collapse" :class="{ 'collapse-open': isExpanded }">
      <div
        class="collapse-title flex items-center px-3 justify-between gap-2 cursor-pointer bg-surface-0/40 hover:bg-surface-0"
        @click="toggleExpand"
      >
        <div class="flex items-center gap-2 flex-1">
          <Icon
            :icon="isExpanded ? 'fluent:chevron-down-12-filled' : 'fluent:chevron-right-12-filled'"
            class="text-base-content transition-transform"
          />
          <Icon
            :icon="isExpanded ? 'fluent:folder-20-filled' : 'fluent:folder-open-20-filled'"
            class="!text-primary"
          />
          <span class="font-medium">{{ node.name }}</span>
        </div>
        <button
          v-if="props.node._id === 'root'"
          class="btn btn-ghost btn-xs text-lg hover:!text-secondary"
          @click="handleNewFolder"
        >
          <Icon icon="fluent:folder-add-20-regular" />
        </button>
      </div>

      <div class="collapse-content bg-surface-0/50 pt-0">
        <!-- Note nella directory corrente -->
        <div class="pl-4 mt-2 flex flex-col gap-1">
          <div
            v-for="note in directoryNotes"
            :key="note._id"
            class="flex items-center gap-2 p-2 hover:bg-base-100 rounded-lg transition-colors"
            draggable="true"
            @dragstart.stop="onDragStart($event, note._id)"
          >
            <Icon icon="fluent:notebook-24-regular" />
            <RouterLink :to="`/editor?edit=${note._id}`" class="flex-1">
              {{ note.name }}
            </RouterLink>
          </div>
        </div>

        <!-- Directory figlie -->
        <TreeNode
          v-for="child in node.children"
          :key="child._id"
          :node="child"
          :notes="notes"
          @create-dir="(name) => $emit('create-dir', name, node._id)"
          @move-note="handleMoveNoteEvent"
        />
      </div>
    </div>

    <!-- New directory dialog -->
    <dialog class="modal" :open="showNewDirDialog">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Create New Folder</h3>
        <div class="form-control">
          <label class="label">
            <span class="label-text">Folder Name</span>
          </label>
          <input
            v-model="newDirName"
            type="text"
            placeholder="New Folder Name"
            class="input input-bordered w-full max-w-xs"
            @keyup.enter="createDir"
          />
        </div>
        <div class="modal-action">
          <button class="btn btn-outline !btn-error" @click="closeDialog">Cancel</button>
          <button class="btn btn-primary" @click="createDir">Create</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="closeDialog">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  notes: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['create-dir', 'move-note'])
const nodeElement = ref(null)
const isExpanded = ref(props.node._id === 'root')
const showNewDirDialog = ref(false)
const newDirName = ref('')

function handleMoveNoteEvent(noteId, targetDir) {
  emit('move-note', noteId, targetDir)
}

// Computed property per filtrare le note
const directoryNotes = computed(() => {
  if (props.node._id === 'root') {
    isExpanded.value = true
    return props.notes.filter((note) => !note.directory || note.directory === 'root')
  }
  return props.notes.filter((note) => note.directory === props.node._id)
})

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

function handleNewFolder(e) {
  e.preventDefault()
  e.stopPropagation()
  showNewDirDialog.value = true
}

function closeDialog() {
  showNewDirDialog.value = false
  newDirName.value = ''
}

function createDir() {
  if (newDirName.value) {
    emit('create-dir', newDirName.value, props.node._id)
    closeDialog()
  }
}

function onDragStart(event, noteId) {
  event.stopPropagation()
  event.dataTransfer.setData('noteId', noteId)
}

onMounted(() => {
  const element = nodeElement.value
  if (!element) return

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    element.classList.add('bg-primary/20')
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    element.classList.remove('bg-primary/20')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    element.classList.remove('bg-primary/20')
    const noteId = e.dataTransfer.getData('noteId')
    console.log('TreeNode Drop:', { noteId, targetDir: props.node._id })
    if (noteId) {
      emit('move-note', noteId, props.node._id)
    }
  }

  // Add event listeners
  element.addEventListener('dragover', handleDragOver)
  element.addEventListener('dragleave', handleDragLeave)
  element.addEventListener('drop', handleDrop)

  // Clean up
  onUnmounted(() => {
    element.removeEventListener('dragover', handleDragOver)
    element.removeEventListener('dragleave', handleDragLeave)
    element.removeEventListener('drop', handleDrop)
  })
})
</script>
