<template>
  <label class="swap text-sm text-neutral">
    <input type="checkbox" v-model="modelValue" :true-value="trueValue" :false-value="falseValue" />
    <div class="swap-on flex justify-end">mm</div>
    <div class="swap-off">hh:mm</div>
  </label>
</template>
<script setup>
const { trueValue, falseValue } = defineProps({
  trueValue: {
    type: String,
    default() {
      return 'mm'
    }
  },
  falseValue: {
    type: String,
    default() {
      return 'hhmm'
    }
  }
})

const modelValue = defineModel()
</script>
