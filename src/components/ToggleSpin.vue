<template>
  <div ref="toggleElem" @click="toggle()" class="cursor-pointer text-xl">
    <Icon icon="fluent:arrow-sync-circle-32-regular" inline />
  </div>
</template>
<script setup>
import { useTemplateRef } from 'vue';


const { trueValue, falseValue } = defineProps({
  trueValue: {
    type: [Boolean, Number, String, Object, Date, null],
    default() { return true }
  },
  falseValue: {
    type: [Boolean, Number, String, Object, Date, null],
    default() { return false }
  }
})

const emit = defineEmits(['toggle'])
const toggleElem = useTemplateRef('toggleElem')
const modelValue = defineModel()

function toggle() {
  if (modelValue.value === trueValue) {
    modelValue.value = falseValue
  } else {
    modelValue.value = trueValue
  }

  toggleElem.value.animate({ transform: 'rotate(180deg)', easing: 'ease-in' }, 300)
  emit('toggle', modelValue.value)
}

</script>
