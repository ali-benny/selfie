<template>
  <Popper>
    <button class="btn text-xl flex align-items-center">
      <Icon icon="typcn:user-add" />
    </button>
    <template #content>
      <div class="rounded-lg shadow bg-light p-2 z-3 flex flex-col w-screen md:w-max">
        <div class="overflow-y-auto max-h-48 flex flex-col flex-grow my-2">
          <button
            v-for="user in users"
            :key="user._id"
            :class="[
              'flex',
              'gap-2',
              'justify-between',
              'rounded-md',
              'p-1',
              'px-3',
              'my-1',
              'bg-body-secondary',
              'items-center',
              { 'bg-primary-subtle': sharewith.includes(user) }
            ]"
            @click="select(user)"
          >
            {{ user.name }}
            <span v-if="sharewith.includes(user)" class="text-primary"
              ><Icon icon="fluent:checkmark-12-filled"
            /></span>
          </button>
        </div>
        <button
          class="btn btn-outline-primary mt-2 flex items-center justify-center rounded-md gap-2"
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
const toast = useToast()

const users = ref([])
const sharewith = ref([])

const props = defineProps({
  content: {
    type: [String, Object],
    required: true
  },
  type: {
    type: String,
    required: true
  }
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
  }
}

function sendshare() {
  if (props.content === null) {
    toast.warning('Salva la nota prima di condividerla')
  }

  switch (props.type) {
    case 'Nota':
      break
    case 'Pomodoro':
      break
    case 'Evento':
      break
  }
  sharewith.value = []
  toast.success(`${props.type} condiviso con successo!`)
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
