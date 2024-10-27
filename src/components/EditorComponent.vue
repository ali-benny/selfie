<template>
  <div id="editorjs" class="bg-base-300 p-4 rounded-xl mt-4 prose"></div>
</template>

<script>
import { initializeEditor } from '@/router/note/editor/editor.js'

export default {
  name: 'EditorComponent',
  emits: ['editor-ready'],
  data() {
    return {
      editor: null
    }
  },
  async mounted() {
    try {
      this.editor = await initializeEditor()
      this.$emit('editor-ready', this.editor)
    } catch (error) {
      console.error('Error initializing editor:', error)
    }
  },
  beforeUnmount() {
    if (this.editor) {
      this.editor.destroy()
    }
  }
}
</script>
