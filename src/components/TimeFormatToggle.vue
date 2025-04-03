<template>
  <label class="swap text-sm text-neutral">
    <input type="checkbox" @input="toggle" />
    <div class="swap-on flex justify-end">mm</div>
    <div class="swap-off">hh:mm</div>
  </label>
</template>
<script setup>
const { trueValue, falseValue } = defineProps({
  trueValue: {
    type: [Boolean, Number, String, Object, Date, null],
    default() {
      return true
    }
  },
  falseValue: {
    type: [Boolean, Number, String, Object, Date, null],
    default() {
      return false
    }
  }
})

const emit = defineEmits(['toggle'])
const modelValue = defineModel()

function toggle() {
  if (modelValue.value === trueValue) {
    modelValue.value = falseValue
  } else {
    modelValue.value = trueValue
  }

  emit('toggle', modelValue.value)
}
</script>
