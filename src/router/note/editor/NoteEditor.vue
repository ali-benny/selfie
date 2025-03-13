<template>
  <div v-if="isLoading" class="flex text-xl flex-row justify-center items-center h-[90svh]">
    <Icon icon="mingcute:loading-3-fill" class="animate-spin mr-1" />Loading...
  </div>

  <div v-else class="container mx-auto static">
    <!-- Permessi non validi -->
    <div v-if="!hasPermission" class="prose container mx-auto flex-col justify-center w-fit static">
      <h3 class="mt-48">
        Oops, you don't have permission to view this note as it belongs to someone else.
      </h3>
      <button class="btn btn-outline text-xl" @click="$router.back()">
        <Icon icon="fluent:arrow-left-12-filled" />Go back
      </button>
    </div>
    <!-- Contenuto con permessi validi -->
    <template v-else>
      <div
        class="trash-bin z-10 absolute inset-x-2/4 bottom-20 w-16 h-16 !bg-error text-base-300 justify-center items-center rounded-full hidden shadow shadow-error"
        @dragover.prevent
        @drop="onDrop"
      >
        <Icon icon="fluent:delete-12-filled" class="text-3xl" />
      </div>
      <div class="flex justify-between flex-col md:flex-row *:w-full m-2 items-center">
        <div class="flex flex-row items-center">
          <input
            type="text"
            class="input border !input-bordered input-primary text-2xl font-bold w-auto"
            v-model="title"
          />
          <!-- <button
        class="btn btn-ghost text-xl"
        :class="isChecked ? '!text-success' : '!text-primary'"
        @click="toggleIcon"
      >
        <Icon icon="fluent:edit-16-filled" :inline="true" v-if="!isChecked" />
        <Icon icon="fluent:checkmark-12-filled" v-else />
      </button> -->
        </div>
        <div class="flex justify-between flex-wrap lg:justify-end items-center">
          <div
            class="avatar-group flex items-center -space-x-4 hover:-space-x-0 transition hover:-translate-x-1 ease-in-out duration-300 rtl:space-x-reverse"
          >
            <!-- avatar author -->
            <div
              v-if="id != null"
              class="relative space-x-2 hover:cursor-pointer transition ease-in-out duration-300 rounded-full"
            >
              <div class="avatar h-12 border !border-primary border-lg">
                <img
                  class="mask mask-circle !bg-surface-2"
                  :src="author.image"
                  :alt="author.name + ' ' + author.surname"
                />
              </div>
              <span
                v-if="author.logged"
                class="absolute top-0 right-1 w-3 h-3 !bg-success rounded-full border-2 border-base-100 transform translate-x-1 translate-y-1"
              ></span>
            </div>
            <!-- avatar readers -->
            <div
              v-for="reader in readers_verbose"
              :key="reader._id"
              class="relative h-10 hover:cursor-pointer transition ease-in-out hover:scale-125 duration-300 rounded-full"
              draggable="true"
              @dragstart="onDragStart(reader)"
              @dragend="onDragEnd"
              @mouseover="showTrashBin"
              @mouseleave="hideTrashBin"
            >
              <div class="avatar h-10">
                <img
                  class="mask mask-circle !bg-secondary hover:!bg-error"
                  :src="reader.image"
                  :title="reader.name + ' ' + reader.surname"
                />
              </div>
              <span
                v-if="reader.logged"
                class="absolute top-0 right-1 w-3 h-3 !bg-success rounded-full border-2 border-base-100 transform translate-x-1 translate-y-1"
              ></span>
            </div>
          </div>
          <div class="flex items-center">
            <UserShare :id="id" v-model="readers" type="Note"></UserShare>
            <button class="btn text-xl btn-primary my-2 rounded-box" @click="saveNote">
              <Icon icon="fluent:save-32-filled" /> Save
            </button>
          </div>
        </div>
      </div>
      <div class="flex justify-around flex-wrap">
        <v-autocomplete
          bg-color="#494d64"
          item-color="#5b6078"
          v-model="selectedTags"
          :items="tags"
          item-text="name"
          item-value="name"
          label="Tags"
          chips
          clearable
          deletable-chips
          multiple
          closable-chips
          density="compact"
          variant="solo-filled"
          @keydown.enter.prevent="addTag"
        ></v-autocomplete>

        <div class="flex items-center mx-4 mb-5 px-2 bg-surface-1 rounded-lg">
          <div class="flex items-center gap-2">
            <Icon icon="fluent:folder-20-filled" class="-right-10 !text-primary text-xl" />
            <select v-model="selectedFolder" class="select select-sm select-ghost w-fit max-w-sm">
              <option v-for="folder in folders" :key="folder._id" :value="folder._id">
                {{ folder.name }}
              </option>
            </select>
          </div>
          <button
            class="btn btn-ghost btn-sm hover:!text-secondary"
            @click="showNewFolderDialog = true"
          >
            <Icon icon="fluent:folder-add-20-regular" />
            New Folder
          </button>
        </div>

        <!-- New Folder Dialog -->
        <dialog id="new_folder_modal" class="modal" :open="showNewFolderDialog">
          <div class="modal-box">
            <h3 class="font-bold text-lg">Create New Folder</h3>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Folder Name</span>
              </label>
              <input v-model="newFolderName" type="text" class="input input-bordered" />
            </div>
            <div class="modal-action">
              <button class="btn" @click="showNewFolderDialog = false">Cancel</button>
              <button class="btn btn-primary" @click="createFolder">Create</button>
            </div>
          </div>
          <form method="dialog" class="modal-backdrop">
            <button @click="showNewFolderDialog = false">close</button>
          </form>
        </dialog>
      </div>
      <EditorComponent v-if="showEditor" @editor-ready="onEditorReady" />
    </template>
  </div>
</template>

<script>
import { nextTick } from 'vue'
import { getEditNoteTitle, getEditNoteId } from './editor.js'
import {
  getNoteAuthor,
  getNoteTags,
  getNoteById,
  getReaders,
  getReadersIds,
  saveNoteMongo,
  saveTodoMongo
} from './note.js'
import { getTags, createTag } from '@/router/note/editor/tags'
import UserShare from '@/components/UserShare.vue'
import EditorComponent from '@/components/note/EditorComponent.vue'
import { useUserStore } from '@/stores/account'
import { getDirectoryStructure, createDirectory } from './directory.js'
import { getUsersByIds } from '@/router/user/user.js'

export default {
  computed: {
    hasPermission() {
      // Se non c'è ID è una nuova nota, quindi ha sempre i permessi
      return (
        !this.id ||
        this.userStore.loggedUser._id === this.author._id ||
        this.readers.includes(this.userStore.loggedUser._id)
      )
    }
  },
  async mounted() {
    try {
      this.id = getEditNoteId()
      this.tags = await getTags(this.id)
      if (this.id) {
        this.author = await getNoteAuthor(this.id)
        this.readers = await getReadersIds(this.id)
        const tmp = await getNoteById(this.id)
        this.selectedFolder = tmp.directory
        console.log('🔥 - mounted - tmp.directory:', tmp.directory)
      }
      // Mostra l'editor se è una nuova nota o se l'utente ha i permessi
      this.showEditor = !this.id || this.hasPermission
      await nextTick()
      if (this.id) {
        this.title = await getEditNoteTitle()
        this.selectedTags = await getNoteTags(this.id)
        this.readers_verbose = await getReaders(this.id)
      }
      await this.refreshFolders()
    } catch (error) {
      console.error('Error during component initialization:', error)
    } finally {
      this.isLoading = false
    }
  },
  directives: {
    focus: {
      updated: function (el, binding) {
        if (binding.value) {
          el.focus()
        }
      }
    }
  },
  data() {
    return {
      isLoading: true,
      author: [],
      editor: null,
      showEditor: false,
      isChecked: false,
      title: 'Untitled',
      selectedTags: [],
      tags: [],
      share: false,
      id: null,
      userStore: useUserStore(),
      readers: [],
      readers_verbose: [],
      draggedReader: null,
      selectedFolder: 'root',
      folders: [],
      showNewFolderDialog: false,
      newFolderName: ''
    }
  },
  methods: {
    onEditorReady(editorInstance) {
      this.editor = editorInstance
    },
    toggleIcon() {
      this.isChecked = !this.isChecked
    },
    async createFolder() {
      if (!this.newFolderName) return

      try {
        await createDirectory(this.newFolderName, 'root', this.userStore.loggedUser._id)

        // Refresh directories
        await this.refreshFolders()

        // Update selected folder to new one
        this.selectedFolder = this.newFolderName.toLowerCase().replace(/\s+/g, '-')

        this.showNewFolderDialog = false
        this.newFolderName = ''

        push.success('Folder created successfully')

        // Emit event for NoteTree update
        this.$emit('folder-created')
      } catch (err) {
        push.error('Failed to create folder')
        console.error(err)
      }
    },
    async refreshFolders() {
      try {
        const directoryTree = await getDirectoryStructure(this.userStore.loggedUser._id)
        // Convert tree to flat array for select dropdown
        this.folders = this.flattenDirectoryTree(directoryTree)
      } catch (err) {
        console.error('Failed to refresh folders:', err)
      }
    },
    // Helper to flatten directory tree for select dropdown
    flattenDirectoryTree(node, arr = []) {
      arr.push({
        _id: node._id,
        name: node.name
      })

      if (node.children) {
        for (const child of node.children) {
          this.flattenDirectoryTree(child, arr)
        }
      }
      return arr
    },
    async saveNote() {
      // const toast = useNotivue()
      if (!this.editor) {
        console.error('Editor not initialized')
        push.error('Editor not ready. Please try again.')
        return
      }
      try {
        const outputData = await this.editor.save()
        let newnote = false
        console.log('🔥 - saveNote - this.selectedFolder:', this.selectedFolder)
        if (this.id == null) newnote = true
        this.id = await saveNoteMongo({
          id: this.id,
          filename: this.title,
          directory: this.selectedFolder,
          data: outputData,
          tags: this.selectedTags,
          readers: this.readers,
          ...(this.id == null && { author: this.userStore.loggedUser._id }) // save author._id only if is a new note
        })
        if (newnote) {
          this.author = await getNoteAuthor(this.id)
          // update url with id
          const url = new URL(window.location)
          url.searchParams.set('edit', this.id)
          window.history.pushState({}, '', url)
        }

        // Check for checklist type and save to todo collection
        const checklistBlocks = outputData.blocks.filter((block) => block.type === 'checklist')
        for (const block of checklistBlocks) {
          for (const item of block.data.items) {
            const todo = {
              text: item.text,
              checked: item.checked,
              from: { id: this.id, type: 'note' },
              author: this.userStore.loggedUser._id,
              readers: this.readers
            }
            await saveTodoMongo(todo)
          }
        }
        push.success('Note saved successfully!')
      } catch (error) {
        console.error('Failed to save EditorJS data:', error)
        push.error('Failed to save the note')
      }
    },
    async addTag(event) {
      const newTag = event.target.value
      if (this.id == null) {
        // needed a note id => savethe note before
        const outputData = await this.editor.save()
        let newnote = false
        if (this.id == null) newnote = true
        this.id = await saveNoteMongo({
          id: this.id,
          filename: this.title,
          directory: this.selectedFolder,
          data: outputData,
          tags: this.selectedTags,
          readers: this.readers,
          ...(this.id == null && { author: this.userStore.loggedUser._id }) // save author._id only if is a new
        })
        this.author = newnote ? await getNoteAuthor(this.id) : this.author
      }
      if (newTag && !this.tags.includes(newTag)) {
        createTag(this.id, newTag)
        this.tags.push(newTag)
        this.selectedTags.push(newTag)
      }
    },
    async removeShare(reader) {
      // const toast = useNotivue()
      const index = this.readers.indexOf(reader._id)
      if (index !== -1) this.readers.splice(index, 1)

      if (this.readers_verbose[reader._id]) {
        delete this.readers_verbose[reader._id]
      }

      try {
        await saveNoteMongo({
          id: this.id,
          readers: this.readers
        })

        push.success(`Removed ${reader.name} ${reader.surname} from readers.`)
      } catch (error) {
        console.error('Failed to save updated readers:', error)
        push.error('Failed to remove reader')
        // Ricarico i readers in caso di errore per mantenere la sincronizzazione
        this.readers = await getReadersIds(this.id)
        this.readers_verbose = await getReaders(this.id)
      }
    },

    onDragStart(reader) {
      // Salvo il reader che sta per essere trascinato
      this.draggedReader = reader
      document.querySelector('.trash-bin').classList.remove('hidden')
      document.querySelector('.trash-bin').classList.add('flex')
    },

    onDragEnd() {
      // Nascondo il cestino
      document.querySelector('.trash-bin').classList.add('hidden')
      document.querySelector('.trash-bin').classList.remove('flex')
    },

    async onDrop() {
      if (this.draggedReader && this.draggedReader._id) {
        await this.removeShare(this.draggedReader)
        this.draggedReader = null
      }
    },

    showTrashBin() {
      document.querySelector('.trash-bin').classList.remove('hidden')
      document.querySelector('.trash-bin').classList.add('flex')
    },

    hideTrashBin() {
      // Nascondo il cestino solo se non sto trascinando
      if (!this.draggedReader) {
        document.querySelector('.trash-bin').classList.add('hidden')
        document.querySelector('.trash-bin').classList.remove('flex')
      }
    }
  },
  watch: {
    async readers() {
      this.readers_verbose = await getUsersByIds(this.readers)
    }
  },
  components: {
    UserShare,
    EditorComponent
  }
}
</script>
