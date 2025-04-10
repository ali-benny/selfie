<template>
  <Popper>
    <button class="btn btn-ghost text-xl">
      <Icon icon="typcn:user-add" />
    </button>
    <template #content>
      <div class="shadow-md bg-base-200 rounded-box p-2 z-3 flex flex-col w-svw md:w-max">
        <ul
          class="flex flex-col z-3 left-0 m-0 p-3 bg-base-200 rounded-box shadow-xl overflow-y-auto w-auto max-h-72"
        >
          <button
            v-for="user in users"
            :key="user._id"
            :class="[
              'flex gap-2 justify-between items-center',
              'rounded-lg',
              'p-1 px-3 my-1',
              'bg-base-300',
              { 'bg-primary/30': sharewith.includes(user) }
            ]"
            @click="select(user)"
          >
            <div class="flex items-center gap-3">
              <div :class="['avatar', user.logged ? 'online' : '']">
                <div class="mask mask-squircle !bg-primary w-10">
                  <Icon v-if="user.group" icon="mingcute:group-3-fill" class="text-base-100 text-3xl m-1"></Icon>
                  <img v-else :src="user.image" alt="User Image" class="m-0" />
                </div>
              </div>
              {{ user.name }} {{ user.surname ? user.surname : '' }}
            </div>

            <span v-if="sharewith.includes(user)" class="!text-primary right-0">
              <Icon icon="fluent:checkmark-12-filled" />
            </span>
          </button>
        </ul>
        <button
          class="btn btn-outline btn-primary mt-2 flex items-center justify-center rounded-lg gap-2"
          @click="sendshare()"
        >
          {{ props.msg }}<Icon icon="fluent:send-person-16-filled" />
        </button>
      </div>
    </template>
  </Popper>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { API_URL } from '@/const.js'
import { saveNoteMongo, getReadersIds } from '@/router/note/editor/note'
import { updateGroup } from '@/router/group/group'
import { useUserStore } from '@/stores/account.js'

const loggedUser = useUserStore().loggedUser

const users = ref() // all users and groups to share with
const sharewith = ref([]) // users to share with [users selected from the popper]
const emit = defineEmits(['update:modelValue'])

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
    validator: (value) => value.every((item) => typeof item === 'string')
  },
  id: String,
  type: String,
  msg: {
    type: String,
    default: 'Share'
  }
})

onMounted(async () => {
  try {
    const response = await fetch(`${API_URL}/users`)
    const data = await response.json()
    loadUserData(data)
    if (props.type !== 'Group') loadUserGroups()
  } catch (error) {
    console.error('Error fetching users:', error)
  }
})

function loadUserData(allUsers) {
  if (!Array.isArray(allUsers)) {
    console.error('loadUserData received non-array data:', allUsers)
    allUsers = [] // Default to empty array
  }

  // Ensure props.modelValue is an array
  const modelValue = Array.isArray(props.modelValue) ? props.modelValue : []

  users.value = allUsers.filter((user) => {
    // Make sure user and user._id are valid before comparison
    return user && user._id && user._id !== loggedUser._id && !modelValue.includes(user._id)
  })

  // Reset sharewith whenever users are reloaded
  sharewith.value = []
}

async function loadUserGroups() {
  // get all groups of the logged user
  const groups = await fetch(`${API_URL}/${loggedUser._id}/groups`)
  const data = await groups.json()

  // add groups as users to the list of users
  data.forEach((group) => {
    users.value.push({
      _id: group._id,
      name: group.name,
      surname: '',
      logged: false,
      group: true // add group property to identify groups
    })
  })
}

function select(user) {
  if (sharewith.value.includes(user)) {
    sharewith.value = sharewith.value.filter((u) => u !== user)
    emit(
      'update:modelValue',
      props.modelValue.filter((id) => id !== user._id && id !== undefined && id !== null)
    )
  } else if (user._id !== undefined && user._id !== null) {
    sharewith.value.push(user)
    emit('update:modelValue', [
      ...props.modelValue.filter((id) => id !== undefined && id !== null),
      user._id
    ])
  } else console.error('Error selecting users')
}

async function sendshare() {
  if (!props.id) {
    push.warning(`Please, save your ${props.type} before sharing`)
    return
  }

  switch (props.type) {
    case 'Note': {
      const readers = await getReadersIds(props.id)
      emit('update:modelValue', [
        ...props.modelValue.filter((id) => id !== undefined && id !== null),
        ...readers.map((reader) => reader._id).filter((id) => id !== undefined && id !== null)
      ])
      await saveNoteMongo({
        id: props.id,
        readers: props.modelValue.filter((id) => id !== undefined && id !== null)
      })
      break
    }
    case 'Pomodoro': {
      //TODO: add user to pomo share
      break
    }
    case 'Event': {
      //TODO: add user to event share
      break
    }
    case 'Group': {
      await updateGroup({ _id: props.id, members: props.modelValue })
    }
  }
  sharewith.value = []
  push.success(`${props.type} shared successfully!`)
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter,
.fade-leave-to

/* .fade-leave-active in <2.1.8 */ {
  opacity: 0;
}
</style>
