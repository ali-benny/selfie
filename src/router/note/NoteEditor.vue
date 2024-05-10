<template>
  <div class="container w-80 m-5">
    <div class="row justify-content-start m-2">
      <input type="text" class="col form-control fs-1 fw-bold" v-model="title" :readonly="!isChecked" v-focus="isChecked" />
      <button class="btn col col-1 fs-4" @click="toggleIcon">
        <Icon icon="fluent:edit-16-filled" :inline="true" v-if="!isChecked" />
        <Icon icon="fluent:checkmark-12-filled" v-else />
      </button>
      <div class="col"></div>
    </div>

    <div id="editorjs" class="bg-body-tertiary p-4 rounded-4 mt-4"></div>
  </div>
</template>

<script>
import { initializeEditor } from './editor.js'
import { Icon } from '@iconify/vue'

export default {
  mounted() {
    initializeEditor()
  },
  directives: {
    focus: {
      // directive definition
      updated: function (el, binding) {
        if (binding.value) {
          el.focus()
        }
      }
    }
  },
  data() {
    return {
      isChecked: false,
      title: 'Untitled'
    }
  },
  methods: {
    toggleIcon() {
      this.isChecked = !this.isChecked
    }
  },
  components: {
    Icon
  }
}
</script>