<script setup>
import { ref, watch } from 'vue'
import { API_URL } from '~/const'
import { useUserStore } from '@/stores/account.js'

const props = defineProps({
  groups: {
    type: Array,
    required: true,
    default: () => []
  },
  selectedGroupId: {
    type: String,
    default: null
  }
})
const emit = defineEmits(['select-group'])

watch(
  () => props.selectedGroupId,
  (newId) => {
    if (newId) {
      selected.value = newId
    }
  }
)

const selected = ref('')
const selectGroup = (group) => {
  emit('select-group', group)
  selected.value = group._id
}
</script>

<template>
  <div class="flex flex-col gap-2 overflow-y-auto max-h-3/4">
    <div
      v-for="group in groups"
      :key="group._id"
      class="collapse collapse-plus prose"
      :class="group._id === selected ? 'bg-base-200 border-2  border-primary' : 'bg-surface-0'"
      @click="selectGroup(group)"
    >
      <input type="checkbox" class="peer" />
      <div class="collapse-title flex items-center gap-2 font-bold">
        <Icon icon="mingcute:group-3-fill"></Icon>
        {{ group.name }}
      </div>
      <div class="collapse-content">
        <p>{{ group.description }}</p>
        <!-- <button
          v-if="group.owner === loggedUser._id"
          @click="selectGroup(group)"
          class="btn btn-sm btn-primary"
        >
          <Icon icon="mingcute:settings-3-fill" />Settings
        </button> -->
      </div>
    </div>
  </div>
</template>
