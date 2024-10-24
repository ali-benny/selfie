<script setup>
import { ref, onMounted } from 'vue'
import { getUsers, createUser } from '../router/user/user'
import { API_URL } from '../../const'
import UserDropdown from '../components/UserDropdown.vue'
import { useUserStore } from '../stores/account'
import { createAvatar } from '@dicebear/core'
import { adventurer } from '@dicebear/collection'

const users = ref([])
const newUser = ref({ name: '' })
const userStore = useUserStore()
const newImage = ref('')

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
  const user = users.value.find((user) => user._id === userId)
  if (user) {
    userStore.setLoggedUser({
      _id: user._id,
      name: user.name,
      surname: user.surname,
      birthday: user.birthday,
      image: user.image,
      logged: true
    })
    try {
      await fetch(`${API_URL}/users/logged/${userId}`, { method: 'PATCH' })
    } catch (error) {
      console.error('Failed to select user:', error)
    }
  }
}

const generateNewImage = () => {
  const avatar = createAvatar(adventurer, {
    seed: Math.random().toString(36).substring(7)
  }).toDataUri()
  newImage.value = avatar
}

const saveNewImage = async () => {
  if (newImage.value) {
    userStore.setLoggedUser({ ...userStore.loggedUser, image: newImage.value })
    try {
      const response = await fetch(`${API_URL}/users/${userStore.loggedUser._id}/image`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: newImage.value })
      })
      if (response.ok) {
        userStore.setLoggedUser({ ...userStore.loggedUser, image: newImage.value })
        const updatedUser = users.value.find((user) => user._id === userStore.loggedUser._id)
        if (updatedUser) {
          updatedUser.image = newImage.value
        }
        newImage.value = ''
      } else {
        console.error('Failed to save new image: ', response.status)
      }
    } catch (error) {
      console.error('Failed to save new image:', error)
    }
  }
}

onMounted(fetchUsers)
</script>

<template>
  <div class="flex flex-row vh-100 p-3">
    <div class="hidden md:flex flex-col w-25 items-center prose">
      <h1>Il tuo profilo</h1>
      <div
        class="bg-base-300 rounded-box p-3 w-full flex flex-col justify-center items-center gap-2"
      >
        <div class="flex flex-row gap-2 justify-center items-center ">
          <img :src="userStore.loggedUser.image" class="w-48 m-0" />
          <h3 class="m-0">{{ userStore.loggedUser.name }} {{ userStore.loggedUser.surname }}</h3>
        </div>
        <h4 class="flex items-center gap-2 m-0">
          <Icon icon="mingcute:birthday-2-fill" />
          {{
            userStore.loggedUserWithDate.birthday.toLocaleString('it-IT', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit'
            })
          }}
        </h4>
        <!-- TODO: quando esisteranno i gruppi servirà una funzione che da group._id [salvato nel loggedUser] dia il group.name -->
        <h4 v-for="group in userStore.loggedUser.groups">{{ group.name }}</h4>
      </div>
    </div>
    <div class="md:divider md:divider-horizontal"></div>
    <div class="flex flex-col grow m-5 prose">
      <h1>Login with</h1>
      <UserDropdown
        :users="users"
        :selectedUserId="userStore.loggedUser._id"
        @update:selectedUserId="selectUser"
      />
      <div class="divider"></div>
      <div>
        <h2 class="mt-0">Change Profile Image</h2>
        <button @click="generateNewImage" class="btn btn-accent mb-3">
          <Icon class="text-xl" icon="fluent:emoji-sparkle-16-filled" />Generate New Image
        </button>
        <div v-if="newImage">
          <img :src="newImage" alt="New Profile Image" class="mask mask-squircle w-24 h-24 m-0" />
          <button @click="saveNewImage" class="btn btn-primary mt-3">Save Image</button>
        </div>
      </div>
      <div class="divider"></div>
      <div class="flex flex-col gap-3">
        <h2>Registra un nuovo utente</h2>
        <div class="flex flex-row gap-2 w-full">
          <input
            type="text"
            v-model="newUser.name"
            placeholder="Name"
            class="input input-primary input-md border !input-bordered mx-3 grow"
          />
          <input
            type="text"
            v-model="newUser.surname"
            placeholder="Surname"
            class="input input-primary input-md border !input-bordered mx-3 grow"
          />
        </div>
        <input
          type="date"
          v-model="newUser.birthday"
          placeholder="Birthday"
          class="input input-primary input-md border !input-bordered mx-3"
        />
        <button @click="addUser" class="btn btn-primary btn-sm">Add User</button>
      </div>
    </div>
  </div>
</template>
