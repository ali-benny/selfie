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
import { initializeEditor } from './editor.js'
import { Icon } from '@iconify/vue'
import { saveNoteMongo } from './note.js';

export default {
  mounted() {
    this.editor = initializeEditor()
    fetch('/api/check')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Server is not running')
        }
        console.log('Server is running')
      })
      .catch((error) => {
        console.error('Failed to reach the server:', error)
      })
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
          try{
            saveNoteMongo(this.title, outputData)
        //   const response = await axios.post('/api/save', {
        //       filename: this.title,
        //       data: outputData
        // });
        //     if (response.status === 200) {
        //     this.saved = true;
        //   }
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
