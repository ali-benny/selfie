<template>
  <div class="flex justify-center items-center h-full *:prose">
    <form class="card flex min-w-96 bg-surface-0 shadow-xl" @submit.prevent="handleSubmit">
      <div class="card-body pt-0">
        <h2 class="card-title font-italic">Selfie</h2>
        <div
          class="mt-2"
          :class="(status == 'create') === true ? 'md:flex flex-row' : 'items-center'"
        >
          <div v-if="status == 'create'" class="flex flex-col">
            <label class="input input-bordered flex items-center gap-2 mb-2">
              <input
                type="text"
                class="grow"
                v-model="name"
                placeholder="Name"
                required
                @focus="setActiveInput('name')"
              />
            </label>
            <label class="input input-bordered flex items-center gap-2 mb-2">
              <input
                type="text"
                class="grow"
                v-model="surname"
                @focus="setActiveInput('surename')"
                placeholder="Surname"
                required
              />
            </label>
            <label class="input input-bordered flex items-center gap-2 mb-2">
              <Icon icon="mingcute:birthday-2-fill" class="text-overlay-0" />
              <input
                type="date"
                class="grow"
                v-model="birthday"
                @focus="setActiveInput('birthday')"
                placeholder="Birthday"
              />
            </label>
          </div>
          <div v-show="status == 'create'" class="divider md:divider-horizontal"></div>
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
                v-model="password1"
                :placeholder="status == 'reset' ? 'New Password' : 'Password'"
                @focus="setActiveInput('password1')"
                required
              />
            </label>
            <password-meter
              v-if="status == 'create' || (status == 'reset' && focus == 'password1')"
              :password="password1"
            />
            <label
              v-if="status == 'create' || status == 'reset'"
              class="input input-bordered flex items-center gap-2"
              :class="focus == 'password1' ? 'my-2' : 'mb-2'"
            >
              <Icon icon="fluent:key-16-filled" class="text-overlay-0" />
              <input
                type="password"
                class="grow"
                v-model="password2"
                placeholder="Confirm Password"
                @focus="setActiveInput('password2')"
                required
              />
            </label>
          </div>
          <button
            v-if="status != 'create'"
            type="button"
            class="btn btn-ghost btn-secondary btn-sm !text-secondary"
            @click="handleReset"
          >
            {{ status != 'reset' ? 'Reset Password' : 'Back to Login' }}
          </button>
        </div>

        <div class="card-actions justify-end mt-2">
          <button type="submit" class="btn btn-primary w-full">
            {{
              status == 'create'
                ? 'Create Account'
                : status == 'reset'
                  ? 'Set New Password'
                  : 'Login'
            }}
          </button>
          <button type="button" @click="toggleCreate" class="btn btn-primary btn-outline w-full">
            {{ status == 'create' ? 'Back to Login' : 'Create Account' }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { createUser, getUsers, updateUser } from '@/router/user/user'
import { API_URL } from '~/const'
import passwordMeter from 'vue-simple-password-meter'
import bcrypt from 'bcryptjs'
import { useToast } from 'vue-toastification'
import { useUserStore } from '@/stores/account'
const toast = useToast()

const focus = ref('')
const status = ref('')
const users = ref([])
const userStore = useUserStore()

const name = ref('')
const surname = ref('')
const username = ref('')
const birthday = ref('')
const password1 = ref('')
const password2 = ref('')

onMounted(async () => {
  const response = await getUsers()
  users.value = response.sort((a, b) => a.name.localeCompare(b.name))
})

function setActiveInput(inputName) {
  focus.value = inputName
}

function toggleCreate() {
  if (status.value === 'create') {
    status.value = ''
  } else {
    status.value = 'create'
  }
}

function handleReset() {
  if (status.value === 'reset') {
    status.value = ''
  } else {
    status.value = 'reset'
  }
}

async function handleSubmit() {
  switch (status.value) {
    case 'create':
      if (!isExtistingUser()) {
        if (!checkPassword()) {
          toast.warning('Passwords do not match')
          break
        }
        await createAccount()
      }
      break
    case 'reset':
      if (!checkPassword()) {
        toast.warning('Passwords do not match')
        break
      }
      const user = users.value.find((user) => user.username === username.value)
      try {
        await updateUser(user._id, { password: password1.value })
        toast.success('Password reset successfully!')
        status.value = ''
      } catch (error) {
        toast.error(error.message)
        console.error('Failed to reset password:', error)
      }
      break
    default:
      await login()
      break
  }
}

function isExtistingUser() {
  const existingUser = users.value.find((user) => user.username === username.value)

  if (existingUser) {
    toast.error('Username already exists, try to login again')
    return true
  }
  return false
}

function checkPassword() {
  return password1.value === password2.value
}

async function login() {
  try {
    const user = users.value.find((user) => user.username === username.value)
    if (!user) {
      toast.warning('Username not found, try to create an account')
      return
    }

    const passwordMatch = await bcrypt.compare(password1.value, user.password)
    if (!passwordMatch) {
      toast.error('Incorrect password')
      return
    }

    const response = await fetch(`${API_URL}/users/logged/${user._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: username.value, password: password1.value })
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
  var hash = bcrypt.hashSync(password1.value, salt)
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
    password1.value = ''
    password2.value = ''
    status.value = ''
    users.value = await getUsers()
  } catch (error) {
    toast.error(error.message)
    console.error('Failed to create user:', error)
  }
}
</script>
