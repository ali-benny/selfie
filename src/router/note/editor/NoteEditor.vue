<template>
  <div class="container w-80 m-5">
    <div class="row justify-content-start m-2">
      <input
        type="text"
        class="col form-control fs-1 fw-bold"
        v-model="title"
        :readonly="!isChecked"
        v-focus="isChecked"
      />
      <button
        class="btn col col-1 fs-4"
        :class="isChecked ? 'text-success' : 'text-primary'"
        @click="toggleIcon"
      >
        <Icon icon="fluent:edit-16-filled" :inline="true" v-if="!isChecked" />
        <Icon icon="fluent:checkmark-12-filled" v-else />
      </button>
      <div class="col"></div>
      <button class="btn col col-1 fs-4 text-warning" @click="saveNote">
        <Icon icon="fluent:save-32-filled" />
      </button>
    </div>
    <div id="editorjs" class="bg-body-tertiary p-4 rounded-4 mt-4"></div>
  </div>
</template>

<script>
import { initializeEditor, getEditNoteTitle, getEditNoteId } from './editor.js'
import { Icon } from '@iconify/vue'
import { saveNoteMongo } from './note.js'

export default {
  async mounted() {
    this.editor = await initializeEditor()
    this.title = getEditNoteTitle()
    this.id = getEditNoteId()
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
      title: 'Untitled'
    }
  },
  methods: {
    toggleIcon() {
      this.isChecked = !this.isChecked
    },
    saveNote() {
      this.editor
        .save()
        .then(async (outputData) => {
          try {   
            console.log(getEditNoteId())
            saveNoteMongo(this.id, this.title, outputData)
          } catch (error) {
            console.error('Failed to save EditorJS data:', error)
          }
        })
        .catch((error) => {
          console.error('Failed to save EditorJS data:', error)
        })
    }
  },
  components: {
    Icon
  }
}
</script>
