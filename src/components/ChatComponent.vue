<template>
  <div class="chat-container">
    <!-- Sidebar con lista chat -->
    <div class="chat-sidebar">
      <div class="chat-groups">
        <h3>Group Chats</h3>
        <div
          v-for="group in groups"
          :key="group._id"
          @click="selectChat('group', group._id)"
          :class="['chat-item', selectedChat.id === group._id ? 'active' : '']"
        >
          {{ group.name }}
          <!-- <span v-if="unreadMessages.value[group._id]?" class="unread-dot">
            {{ unreadMessages.value[group._id]? }}</span
          > -->
        </div>
      </div>

      <div class="chat-private">
        <div class="flex justify-between items-center">
          <h3>Private Chats</h3>
          <button @click="showNewChat = true" class="btn btn-ghost btn-sm">
            <Icon icon="fluent:add-16-filled" />
          </button>
        </div>
        <div
          v-for="chat in privateChats"
          :key="chat.user._id"
          @click="selectChat('private', chat.user._id)"
          :class="['chat-item', selectedChat.id === chat.user._id ? 'active' : '']"
        >
          {{ chat.user.name }}
          <!-- <span v-if="unreadMessages?.value[chat.user._id]" class="unread-dot">
            {{ unreadMessages?.value[chat.user._id] }}</span
          > -->
        </div>
      </div>
    </div>

    <!-- Area messaggi -->
    <div class="chat-messages">
      <div class="messages-container">
        <div
          v-for="message in currentMessages"
          :key="message._id"
          :class="['message', message.user_id === userStore.loggedUser._id ? 'sent' : 'received']"
        >
          <div class="message-header">
            {{ message.name }}
            <span class="message-time">
              {{ new Date(message.timestamp).toLocaleTimeString() }}
            </span>
          </div>
          <div class="message-content">{{ message.message }}</div>
        </div>
      </div>

      <!-- Input area -->
      <div class="chat-input">
        <input
          v-model="newMessage"
          @keyup.enter="sendMessage"
          placeholder="Type a message..."
          class="input input-bordered w-full"
        />
        <button @click="sendMessage" class="btn btn-primary">Send</button>
      </div>
    </div>

    <!-- Modal per nuova chat privata -->
    <dialog :open="showNewChat" class="modal">
      <div class="modal-box">
        <h3>Start New Chat</h3>
        <input
          v-model="searchUsername"
          placeholder="Search by username"
          class="input input-bordered w-full mt-2"
        />
        <div class="user-list">
          <div
            v-for="user in filteredUsers"
            :key="user._id"
            @click="startPrivateChat(user)"
            class="user-item"
          >
            {{ user.name }} ({{ user.username }})
          </div>
        </div>
        <button @click="showNewChat = false" class="btn btn-sm">Close</button>
      </div>
    </dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useUserStore } from '@/stores/account'
import socket from '@/plugins/socket'
import { getUsers } from '@/router/user/user'
import { getGroups } from '@/router/group/group'
import { CHAT_URL } from '~/const.js'

const userStore = useUserStore()
const messages = ref([])
const newMessage = ref('')
const groups = ref([])
const privateChats = ref([])
const selectedChat = ref({ type: null, id: null })
const showNewChat = ref(false)
const searchUsername = ref('')
const users = ref([])
const currentMessages = ref([])

// Filtra gli utenti per la ricerca
const filteredUsers = computed(() => {
  return users.value.filter(
    (user) =>
      user.username?.toLowerCase().includes(searchUsername.value.toLowerCase()) &&
      user._id !== userStore.loggedUser._id
  )
})

const sendMessage = async () => {
  if (newMessage.value.trim() && selectedChat.value.id) {
    const messageData = {
      message: newMessage.value,
      name: userStore.loggedUser.name,
      user_id: userStore.loggedUser._id,
      chatId: selectedChat.value.id,
      chatType: selectedChat.value.type,
      timestamp: new Date()
    }

    try {
      // Aggiungi il messaggio localmente subito per UI reattiva
      const tempMessage = { ...messageData, _id: Date.now(), pending: true }
      currentMessages.value.push(tempMessage)

      // Salva nel DB e notifica gli altri utenti
      const response = await fetch(`${CHAT_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      })

      if (!response.ok) throw new Error('Failed to send message')
      const savedMessage = await response.json()

      // Sostituisci il messaggio temporaneo con quello salvato
      const index = currentMessages.value.findIndex((m) => m._id === tempMessage._id)
      if (index !== -1) {
        currentMessages.value[index] = savedMessage
      }

      // Emetti il messaggio via socket per notifiche real-time
      socket.emit('chat-message', savedMessage)

      newMessage.value = ''
      scrollToBottom()
    } catch (error) {
      console.error('Error sending message:', error)
      // Rimuovi il messaggio temporaneo in caso di errore
      currentMessages.value = currentMessages.value.filter((m) => m._id !== tempMessage._id)
    }
  }
}

// Funzione helper per lo scroll
const scrollToBottom = () => {
  nextTick(() => {
    const container = document.querySelector('.messages-container')
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  })
}

// Poll for new messages every 3 seconds
let pollInterval

onMounted(async () => {
  try {
    // Carica gruppi e utenti
    const userGroups = await getGroups(userStore.loggedUser._id)
    groups.value = userGroups

    const usersList = await getUsers()
    users.value = usersList.filter((u) => u._id !== userStore.loggedUser._id)

    await loadExistingChats()

    // Socket listeners
    socket.on('chat-message', (msg) => {
      if (msg.chatId === selectedChat.value.id) {
        currentMessages.value.push(msg)
        scrollToBottom()
      } else {
        updateUnreadMessages(msg.chatId)
      }
    })

    // Ricezione di una notifica per nuovi messaggi
    socket.on('new-message', ({ chatId }) => {
      if (chatId !== selectedChat.value.id) {
        updateUnreadMessages(chatId)
      }
    })

    socket.on('joined', ({ messages }) => {
      if (messages) {
        currentMessages.value = messages // Sostituisci tutti i messaggi
        scrollToBottom()
      }
    })

    socket.on('error', (error) => {
      console.error('Socket error:', error)
    })
  } catch (error) {
    console.error('Error loading initial data:', error)
  }
})

const unreadMessages = ref({})

const updateUnreadMessages = (chatId) => {
  if (!unreadMessages.value[chatId]) {
    unreadMessages.value[chatId] = 1
  } else {
    unreadMessages.value[chatId] += 1
  }
}

const loadExistingChats = async () => {
  try {
    // Carica le chat private esistenti (quelle che hanno almeno un messaggio)
    const response = await fetch(`${CHAT_URL}/messages/private/${userStore.loggedUser._id}/chats`)
    if (!response.ok) throw new Error('Failed to fetch existing chats')
    const existingChats = await response.json()

    // Per ogni chat esistente, cerca l'utente corrispondente e aggiungi la chat
    for (const chat of existingChats) {
      const user = users.value.find((u) => u._id === chat.participantId)
      if (user && !privateChats.value.find((pc) => pc.user._id === user._id)) {
        privateChats.value.push({ user })
      }
    }
  } catch (error) {
    console.error('Error loading existing chats:', error)
  }
}

const startPrivateChat = (user) => {
  // Verifica se la chat privata esiste già
  const existingChat = privateChats.value.find((chat) => chat.user._id === user._id)
  if (!existingChat) {
    privateChats.value.push({ user })
  }
  selectChat('private', user._id)
  showNewChat.value = false
  searchUsername.value = ''
}

const selectChat = async (type, id) => {
  selectedChat.value = { type, id }
  currentMessages.value = []

  try {
    // Carica i messaggi esistenti
    const response = await fetch(`${CHAT_URL}/messages/${type}/${id}`)
    if (!response.ok) throw new Error('Failed to fetch messages')
    const messages = await response.json()
    currentMessages.value = messages

    // Unisciti alla stanza della chat
    socket.emit('join-chat', { chatId: id })

    // Resetta i messaggi non letti
    unreadMessages.value[id] = 0

    scrollToBottom()
    setTimeout(1000)
  } catch (error) {
    console.error('Error fetching messages:', error)
  }
}

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})
</script>

<style scoped>
/* Nel <style scoped> di ChatComponent.vue */
.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  margin-left: 5px;
  @apply bg-primary;
}
.chat-container {
  @apply flex h-[80vh] gap-4;
}

.chat-sidebar {
  @apply w-64 bg-base-200 p-4 rounded-lg flex flex-col gap-4;
}

.chat-messages {
  @apply flex-1 flex flex-col bg-base-200 rounded-lg;
}

.messages-container {
  @apply flex-1 p-4 overflow-y-auto;
}

.chat-input {
  @apply p-4 flex gap-2;
}

.message {
  @apply mb-4 p-3 rounded-lg max-w-[80%];
}

.sent {
  @apply ml-auto bg-primary text-primary-content;
}

.received {
  @apply bg-secondary text-secondary-content;
}

.chat-item {
  @apply p-2 rounded-lg cursor-pointer hover:bg-base-300;
}

.active {
  @apply bg-primary text-primary-content;
}

.user-item {
  @apply p-2 hover:bg-base-300 cursor-pointer rounded-lg;
}
</style>
