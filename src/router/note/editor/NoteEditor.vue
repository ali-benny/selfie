<template>
  <div class="container mx-auto">
    <div class="flex justify-between m-2 flex-wrap">
      <div class="flex flex-row items-center">
        <input
          type="text"
          class="input border !input-bordered input-primary text-2xl font-bold w-dvw md:w-auto"
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

      <div class="flex justify-end items-center">
        <div class="avatar-group -space-x-4 hover:-space-x-0 rtl:space-x-reverse">
          <div v-for="reader in this.readers" :key="reader._id" class="avatar h-10">
            <img
              class="mask mask-circle !bg-secondary"
              :src="reader.image"
              :title="reader.name + ' ' + reader.surname"
            />
          </div>
        </div>
        <UserShare :content="id" type="Note"></UserShare>
        <button class="btn text-xl btn-primary my-2 rounded-box" @click="saveNote">
          <Icon icon="fluent:save-32-filled" /> Save
        </button>
      </div>
    </div>
    <div>
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
    </div>
    <div id="editorjs" class="bg-base-300 p-4 rounded-xl mt-4 prose"></div>
  </div>
</template>

<script>
import { useToast } from 'vue-toastification'
import { initializeEditor, getEditNoteTitle, getEditNoteId } from './editor.js'
import { getNoteTags, getReaders, saveNoteMongo, saveTodoMongo } from './note.js'
import { getTags, createTag } from '@/router/note/editor/tags'
import UserShare from '@/components/UserShare.vue'
import { useUserStore } from '@/stores/account'

export default {
  async mounted() {
    this.id = getEditNoteId()
    this.tags = await getTags(this.id)
    this.editor = await initializeEditor()
    if (this.id != null) {
      this.title = getEditNoteTitle()
      this.selectedTags = await getNoteTags(this.id)
      this.readers = await getReaders(this.id)
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
      editor: null,
      isChecked: false,
      title: 'Untitled',
      selectedTags: [],
      tags: [],
      share: false,
      id: '',
      userStore: useUserStore(),
      readers: []
    }
  },
  methods: {
    toggleIcon() {
      this.isChecked = !this.isChecked
    },
    async saveNote() {
      const toast = useToast()
      if (!this.editor) {
        console.error('Editor not initialized')
        toast.error('Editor not ready. Please try again.')
        return
      }
      try {
        const outputData = await this.editor.save()
        this.id = await saveNoteMongo({
          id: this.id,
          filename: this.title,
          data: outputData,
          tags: this.selectedTags,
          author: this.userStore.loggedUser._id
        })

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
        toast.success('Note saved successfully!')
      } catch (error) {
        console.error('Failed to save EditorJS data:', error)
        toast.error('Failed to save the note')
      }
    },
    async addTag(event) {
      const newTag = event.target.value
      if (this.id == null) {
        // needed a note id => save it
        const outputData = await this.editor.save()
        this.id = await saveNoteMongo({
          id: this.id,
          filename: this.title,
          data: outputData,
          tags: this.selectedTags,
          author: this.userStore.loggedUser._id
        })
      }
      if (newTag && !this.tags.includes(newTag)) {
        createTag(this.id, newTag)
        this.tags.push(newTag)
        this.selectedTags.push(newTag)
      }
    }
  },
  components: {
    UserShare
  }
}
</script>
