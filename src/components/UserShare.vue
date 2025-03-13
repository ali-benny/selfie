<template>
  <Popper @open:popper="reloadUsers">
    <slot>
      <button class="btn btn-ghost text-xl">
        <Icon icon="typcn:user-add" />
      </button>
    </slot>
    <template #content="{ close }">
      <div
        v-if="users?.length > 0"
        class="shadow-md bg-base-200 rounded-box p-2 z-3 flex overflow-hidden flex-col gap-3 w-svw md:w-max !text-base"
      >
        <ul class="overflow-y-auto max-h-72 flex flex-col gap-2">
          <li
            v-for="user in users"
            :key="user._id"
            class="items-center p-2 rounded-box bg-base-300 hover:bg-primary/20"
            :class="{ '!bg-primary/30': selectedUsers.includes(user._id) }"
            @click="selectUser(user._id)"
          >
            <button class="w-full flex justify-between items-center gap-3">
              <div class="flex items-center gap-2">
                <div class="avatar" :class="{ online: user.logged }">
                  <div class="mask mask-squircle !bg-primary w-10">
                    <img :src="user.image" alt="User Image" class="m-0" />
                  </div>
                </div>
                <div>{{ user.name }} {{ user.surname ? user.surname : '' }}</div>
              </div>

              <span class="!text-primary right-0 w-4 h-4">
                <Icon v-if="selectedUsers.includes(user._id)" icon="fluent:checkmark-12-filled" />
              </span>
            </button>
          </li>
        </ul>
        <button
          class="btn btn-outline btn-primary flex items-center justify-center rounded-lg gap-2"
          @click="sendShare(close)"
        >
          Condividi
          <Icon icon="fluent:send-person-16-filled" />
        </button>
      </div>
      <div v-else class="shadow-md bg-base-200 rounded-box text-base p-2 z-3">
        No users to share with.
      </div>
    </template>
  </Popper>
</template>

<script setup>
import { ref } from 'vue'
import { saveNoteMongo } from '@/router/note/editor/note'
import { useUserStore } from '@/stores/account'
import { getUsers } from '@/router/user/user'
import { createPomodoroConfigs } from '@/router/pomodoro/pomodoro'

/* Lista degli utenti con cui è possibile condividere la risorsa */
const users = ref([])

/* Lista degli utenti con cui condividere la risorsa */
const selectedUsers = ref([])

const emit = defineEmits(['update:modelValue'])

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
    validator: (value) => value.every((item) => typeof item === 'string')
  },
  id: String,
  type: String
})

// TODO: come stabilisco utenti con cui condividere ??? (modelValue?, users?)

async function sendShare(closePopper) {
  if (!props.id) {
    push.warning(`Please, save your ${props.type} before sharing`)
    return
  }

  const shareWith = [...props.modelValue, ...selectedUsers.value]
  emit('update:modelValue', shareWith)

  switch (props.type) {
    case 'Note': {
      await saveNoteMongo({
        id: props.id,
        readers: shareWith
      })
      break
    }
    case 'Pomodoro': {
      await createPomodoroConfigs(selectedUsers.value, props.id)
      break
    }
    case 'Event': {
      //TODO: add user to event share
      break
    }
  }

  push.success(`${props.type} shared successfully!`)

  closePopper()
}

function selectUser(userId) {
  if (selectedUsers.value.includes(userId)) {
    selectedUsers.value = selectedUsers.value.filter((u) => u !== userId)
  } else {
    selectedUsers.value.push(userId)
  }
}

async function reloadUsers() {
  const allUsers = await getUsers()
  users.value = allUsers.filter(
    (u) => u._id !== useUserStore().loggedUser._id && !props.modelValue.includes(u._id)
  )

  selectedUsers.value = []
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
