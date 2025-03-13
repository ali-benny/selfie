<script setup>
import { ref, onMounted } from 'vue'
import { API_URL } from '~/const'
import { useUserStore } from '@/stores/account.js'

const groups = ref([])
const loggedUser = useUserStore().loggedUser
const emit = defineEmits(['select-group'])

onMounted(async () => {
  const res = await fetch(`${API_URL}/${loggedUser._id}/groups`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  groups.value = await res.json()
})

const selected = ref('')
const selectGroup = (group) => {
  emit('select-group', group)
  selected.value = group._id
}
</script>

<template>
  <div class="flex flex-col gap-2 overflow-y-auto max-h-3/4">
    <div v-for="group in groups" :key="group._id" class="collapse collapse-plus  prose" :class="group._id === selected ? 'bg-base-200 border-2  border-primary' : 'bg-surface-0'">
      <input type="checkbox" class="peer" />
      <div class="collapse-title flex items-center gap-2 font-bold">
        <Icon icon="mingcute:group-3-fill"></Icon>
        {{ group.name }}
      </div>
      <div class="collapse-content">
        <p>{{ group.description }}</p>
        <button
          v-if="group.owner === loggedUser._id"
          @click="selectGroup(group)"
          class="btn btn-sm btn-primary"
        >
          <Icon icon="mingcute:settings-3-fill" />Settings
        </button>
      </div>
    </div>
  </div>
</template>
