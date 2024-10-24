<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  users: Array,
  selectedUserId: String
})

const emit = defineEmits(['update:selectedUserId'])

const isOpen = ref(false)
const selectedUser = ref({})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const selectUser = (user) => {
  selectedUser.value = user
  emit('update:selectedUserId', user._id)
  isOpen.value = false
}

watch(
  () => props.selectedUserId,
  (newVal) => {
    selectedUser.value = props.users.find((user) => user._id === newVal) || {}
  },
  { immediate: true }
)
</script>

<template>
  <div class="relative">
    <button @click="toggleDropdown" class="btn btn-primary btn-ghost w-50 justify-between">
      <div class="flex items-center gap-4">
        <img
          :src="selectedUser?.image"
          alt="User Image"
          v-if="selectedUser.image != undefined"
          class="mask mask-squircle !bg-primary w-12 h-12 m-0"
        />
        <span>{{ selectedUser.name || 'Select User' }}</span>
      </div>
      <Icon icon="fluent:chevron-down-16-filled" />
    </button>
    <ul
      v-if="isOpen"
      class="flex flex-col z-3 w-full bg-base-200 border border-base-300 rounded-md shadow-lg"
    >
      <li
        v-for="user in users"
        :key="user._id"
        @click="selectUser(user)"
        class="cursor-pointer hover:bg-base-300 p-2 flex items-center space-x-4"
      >
        <div :class="['avatar', user.logged ? 'online' : '']">
          <div class="mask mask-squircle !bg-primary w-10">
            <img :src="user.image" alt="User Image" class="m-0" />
          </div>
        </div>
        <span>{{ user.name }}</span>
      </li>
    </ul>
  </div>
</template>
