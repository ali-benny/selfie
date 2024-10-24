<script setup>
import { ref, onMounted } from 'vue'
import { getUsers, createUser } from '../router/user/user'
import { API_URL } from '../../const'

const users = ref([])
const newUser = ref({ name: '' })
const loggedUser = ref(localStorage.getItem('loggedUser') || '')

const fetchUsers = async () => {
  try {
    const response = await getUsers()
    users.value = response.sort((a, b) => a.name.localeCompare(b.name))
  } catch (error) {
    console.error('Failed to fetch users:', error)
  }
}

const addUser = async () => {
  try {
    const createdUser = await createUser(newUser.value)
    users.value.push(createdUser)
    users.value.sort((a, b) => a.name.localeCompare(b.name))
    newUser.value = { name: '' }
  } catch (error) {
    console.error('Failed to create user:', error)
  }
}

const selectUser = async (userId) => {
  loggedUser.value = userId
  localStorage.setItem('loggedUser', userId)
  try {
    await fetch(`${API_URL}/users/logged/${userId}`, { method: 'PATCH' })
  } catch (error) {
    console.error('Failed to select user:', error)
  }
}

onMounted(fetchUsers)
</script>

<template>
  <div class="flex flex-row vh-100 p-3">
    <div class="flex flex-col w-25 justify-content-center">
      <div class="bg-secondary rounded-5 h-50"></div>
      <div class="flex h-75"></div>
    </div>
    <div class="flex flex-col grow m-5 prose">
      <h1>Login with</h1>
      <select v-model="loggedUser" @change="selectUser($event.target.value)" class="select select-bordered w-full max-w-xs">
        <option v-for="user in users" :key="user._id" :value="user._id">{{ user.name }}</option>
      </select>
      <div class="divider"></div>
      <div>
        <input v-model="newUser.name" placeholder="New user name" class="input input-primary input-bordered mx-3" />
        <button @click="addUser" class="btn btn-primary btn-sm">Add User</button>
      </div>
    </div>
  </div>
</template>