<template>
  <Popper>
    <button class="btn btn-ghost text-xl">
      <Icon icon="typcn:user-add" />
    </button>
    <template #content>
      <div class="shadow-md bg-base-200 rounded-box p-2 z-3 flex flex-col w-svw md:w-max">
        <ul
          class="flex flex-col z-3 left-0 m-0 p-3 bg-base-200 rounded-box shadow-xl overflow-y-auto w-fit max-h-72"
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
                  <img :src="user.image" alt="User Image" class="m-0" />
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
          Condividi<Icon icon="fluent:send-person-16-filled" />
        </button>
      </div>
    </template>
  </Popper>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { API_URL } from '../../const'
import { useToast } from 'vue-toastification'
import { saveNoteMongo, getReadersIds } from '@/router/note/editor/note'

const toast = useToast()

const users = ref([])
const sharewith = ref([])
const sendto = ref([])

const props = defineProps({
  content: String,
  type: String
})

onMounted(async () => {
  try {
    const response = await fetch(`${API_URL}/users`)
    const data = await response.json()
    users.value = data
  } catch (error) {
    console.error('Error fetching users:', error)
  }
})

function select(user) {
  if (sharewith.value.includes(user)) {
    sharewith.value = sharewith.value.filter((u) => u !== user)
  } else {
    sharewith.value.push(user)
    sendto.value.push(user._id)
  }
}

async function sendshare() {
  if (props.content === null) {
    toast.warning(`Please, save your ${props.type} before sharing`)
  }

  switch (props.type) {
    case 'Note': {
      const readers = await getReadersIds(props.content)
      sendto.value.push(...readers)
      await saveNoteMongo({ id: props.content, readers: sendto.value })
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
  }
  sharewith.value = []
  toast.success(`${props.type} shared successfully!`)
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active in <2.1.8 */ {
  opacity: 0;
}
</style>
