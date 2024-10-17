<template>
  <div class="container">
    <div class="flex justify-between m-2 flex-wrap">
      <div class="row">
        <input
          type="text"
          class="col form-control fs-2 fw-bold"
          v-model="title"
          :readonly="!isChecked"
          v-focus="isChecked"
        />
        <button
          class="btn col col-1 text-xl"
          :class="isChecked ? 'text-success' : 'text-primary'"
          @click="toggleIcon"
        >
          <Icon icon="fluent:edit-16-filled" :inline="true" v-if="!isChecked" />
          <Icon icon="fluent:checkmark-12-filled" v-else />
        </button>
      </div>

      <div class="flex flex-end align-items-center">
        <UserShare :content="id" type="Nota"></UserShare>
        <button
          class="btn text-xl btn-warning my-2 rounded-4 flex align-items-center"
          @click="saveNote"
        >
          <Icon icon="fluent:save-32-filled" /> Salva
        </button>
      </div>
    </div>
    <div>
      <v-autocomplete
        v-model="selectedTags"
        :items="tags"
        item-text="name"
        item-value="name"
        label="Categorie"
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
    <div id="editorjs" class="bg-body-tertiary p-4 rounded-4 mt-4"></div>
  </div>
</template>

<script>
import { initializeEditor, getEditNoteTitle, getEditNoteId } from './editor.js'
import { getNoteTags, saveNoteMongo, saveTodoMongo } from './note.js'
import { useToast } from 'vue-toastification'
import { getTags, createTag } from '@/router/note/editor/tags'
import UserShare from '@/components/UserShare.vue'

export default {
  async mounted() {
    this.id = getEditNoteId()
    this.tags = await getTags(this.id)
    this.editor = await initializeEditor()
    if (this.id != null) {
      this.title = getEditNoteTitle()
      this.selectedTags = await getNoteTags(this.id)
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
      id: ''
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
        this.id = await saveNoteMongo(this.id, this.title, outputData, this.selectedTags)

        // Check for checklist type and save to todo collection
        const checklistBlocks = outputData.blocks.filter((block) => block.type === 'checklist')
        for (const block of checklistBlocks) {
          for (const item of block.data.items) {
            const todo = {
              text: item.text,
              checked: item.checked,
              from: { id: this.id, type: 'note'},
              author: 'User', // TODO: get User
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
        this.id = await saveNoteMongo(this.id, this.title, outputData, this.selectedTags)
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
