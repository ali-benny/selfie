<template>
  <div class="flex justify-center items-center h-full *:prose">
    <form class="card flex min-w-96 bg-surface-0 shadow-xl" @submit.prevent="handleSubmit">
      <div class="card-body pt-0">
        <h2 class="card-title font-italic">Selfie</h2>
        <div class="mt-2" :class="create === true ? 'md:flex flex-row' : 'items-center'">
          <div v-if="create" class="flex flex-col">
            <label class="input input-bordered flex items-center gap-2 mb-2">
              <input type="text" class="grow" v-model="name" placeholder="Name" required />
            </label>
            <label class="input input-bordered flex items-center gap-2 mb-2">
              <input type="text" class="grow" v-model="surname" placeholder="Surname" required />
            </label>
            <label class="input input-bordered flex items-center gap-2 mb-2">
              <Icon icon="mingcute:birthday-2-fill" class="text-overlay-0" />
              <input type="date" class="grow" v-model="birthday" placeholder="Birthday" />
            </label>
          </div>
          <div v-show="create" class="divider md:divider-horizontal"></div>
          <div class="flex flex-col">
            <label class="input input-bordered flex items-center gap-2 mb-2">
              <Icon icon="mingcute:user-2-fill" class="text-overlay-0" />
              <input type="text" class="grow" v-model="username" placeholder="Username" required />
            </label>
            <label class="input input-bordered flex items-center gap-2 mb-2">
              <Icon icon="fluent:key-16-filled" class="text-overlay-0" />
              <input
                type="password"
                class="grow"
                v-model="password"
                placeholder="Password"
                required
              />
            </label>
            <password-meter :password="password" />
          </div>
        </div>

        <div class="card-actions justify-end mt-2">
          <button type="submit" class="btn btn-primary w-full">
            {{ create ? 'Create Account' : 'Login' }}
          </button>
          <button type="button" @click="toggleCreate" class="btn btn-primary btn-outline w-full">
            {{ create ? 'Back to Login' : 'Create Account' }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { createUser, getUsers } from '@/router/user/user'
import { API_URL } from '~/const'
import passwordMeter from 'vue-simple-password-meter'
import bcrypt from 'bcryptjs'
import { useToast } from 'vue-toastification'
import { useUserStore } from '@/stores/account'
const toast = useToast()

const create = ref(false)
const name = ref('')
const surname = ref('')
const username = ref('')
const birthday = ref('')
const password = ref('')
const users = ref([])
const userStore = useUserStore()

onMounted(async () => {
  const response = await getUsers()
  users.value = response.sort((a, b) => a.name.localeCompare(b.name))
})

function toggleCreate() {
  create.value = !create.value
}

async function handleSubmit() {
  if (create.value && !isExtistingUser()) {
    await createAccount()
  } else {
    await login()
  }
}

function isExtistingUser() {
  const existingUser = users.value.find((user) => user.username === username.value)

  if (existingUser) {
    toast.error('Username already exists')
    return true
  }

  return false
}

async function login() {
  try {
    const user = users.value.find((user) => user.username === username.value)
    if (!user) {
      toast.warning('Username not found, try to create a new one')
      return
    }

    const passwordMatch = await bcrypt.compare(password.value, user.password)
    if (!passwordMatch) {
      toast.error('Incorrect password')
      return
    }

    console.log('🔥 - login - userId:', user._id)
    const response = await fetch(`${API_URL}/users/logged/${user._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: username.value, password: password.value })
    })

    if (response) {
      userStore.setLoggedUser({
        _id: user._id,
        name: user.name,
        surname: user.surname,
        birthday: user.birthday,
        image: user.image,
        logged: true
      })
      toast.success('Login successful')
    } else {
      toast.error('Failed to log in!')
    }
  } catch (error) {
    toast.error(error.message)
    console.error('Failed to log in:', error)
  }
}

async function createAccount() {
  var salt = bcrypt.genSaltSync(10)
  var hash = bcrypt.hashSync(password.value, salt)
  const newUser = {
    name: name.value,
    surname: surname.value,
    birthday: birthday.value,
    username: username.value,
    password: hash
  }
  try {
    const createdUser = await createUser(newUser)
    toast.success(createdUser.name + ' ' + createdUser.surname + ' created successfully')
    name.value = ''
    surname.value = ''
    birthday.value = ''
    username.value = ''
    password.value = ''
    users.value = await getUsers()
  } catch (error) {
    toast.error(error.message)
    console.error('Failed to create user:', error)
  }
}
</script>
