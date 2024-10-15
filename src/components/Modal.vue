<!-- Per togliere warn 'vue/multi-word-component-names': 'off' dentro a eslint.config.js -->
<template>
  <button @click="openModal">
    <slot name="activationBtn"></slot>
  </button>
  <Teleport :to="body">
    <Transition>
      <div class="w-100 h-100 d-flex flex-column position-fixed top-0 start-0 z-3 bg-dark bg-opacity-50 gap-1"
        v-if="showModal">
        <div class="m-auto">
          <div class="">
            <slot name="header"></slot>
          </div>
          <div>
            <slot name="body"></slot>
          </div>
          <div>
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
export default {
  data() {
    return {
      showModal: Boolean
    }
  },
  methods: {
    openModal() {
      this.showModal = true
    },
    closeModal() {
      this.showModal = false
      this.$emit('close')
    }
  },
  emits: {
    close: null
  }
}

</script>
