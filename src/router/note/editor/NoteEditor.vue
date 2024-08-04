<template>
  <div class="container">
    <div class="d-flex justify-content-between m-2 flex-wrap">
      <div class="row">
        <input
          type="text"
          class="col form-control fs-2 fw-bold"
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
      </div>
      <button
        class="btn fs-4 btn-warning my-2 rounded-4 d-flex align-items-center"
        @click="saveNote"
      >
        <Icon icon="fluent:save-32-filled" /> Salva
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
