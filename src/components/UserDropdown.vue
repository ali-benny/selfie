<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  users: Array,
  selectedUserId: String
})

const emit = defineEmits(['update:selectedUserId'])

const selectedUser = ref({})

const selectUser = (user) => {
  selectedUser.value = user
  emit('update:selectedUserId', user._id)
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
  <Popper>
    <button class="btn btn-primary btn-ghost w-full justify-between">
      <div class="flex items-center gap-4">
        <img
          :src="selectedUser?.image"
          alt="User Image"
          v-if="selectedUser.image != undefined"
          class="mask mask-squircle !bg-primary w-12 h-12 m-0"
        />
        <span>{{ selectedUser.name || 'Select User' }} {{  selectedUser.surname? selectedUser.surname : '' }}</span>
      </div>
      <Icon icon="fluent:chevron-down-16-filled" />
    </button>
    <template #content>
      <ul class="flex flex-col z-3 left-0 m-0 p-3 bg-base-200 rounded-box shadow-xl overflow-y-auto w-fit max-h-72">
        <li
          v-for="user in users"
          :key="user._id"
          @click="selectUser(user)"
          class="cursor-pointer hover:bg-base-300 p-2 m-0 flex items-center space-x-4 w-80 rounded-lg"
        >
          <div :class="['avatar', user.logged ? 'online' : '']">
            <div class="mask mask-squircle !bg-primary w-10">
              <img :src="user.image" alt="User Image" class="m-0" />
            </div>
          </div>
          <span>{{ user.name }} {{  user.surname? user.surname : '' }}</span>
        </li>
      </ul>
    </template>
  </Popper>
</template>
