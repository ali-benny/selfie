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
      user: userStore.loggedUser.name,
      userId: userStore.loggedUser._id,
      chatId: selectedChat.value.id,
      chatType: selectedChat.value.type,
      timestamp: new Date()
    }

    try {
      const response = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      })

      if (!response.ok) throw new Error('Failed to send message')
      
      const savedMessage = await response.json()
      currentMessages.value.push(savedMessage)
      newMessage.value = ''

      nextTick(() => {
        const container = document.querySelector('.messages-container')
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      })
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }
}

const selectChat = async (type, id) => {
  selectedChat.value = { type, id }
  currentMessages.value = []
  
  try {
    const response = await fetch(`${API_URL}/messages/${type}/${id}`)
    if (!response.ok) throw new Error('Failed to fetch messages')
    const messages = await response.json()
    currentMessages.value = messages
  } catch (error) {
    console.error('Error fetching messages:', error)
  }
}

// Poll for new messages every 3 seconds
let pollInterval
onMounted(() => {
  pollInterval = setInterval(async () => {
    if (selectedChat.value.id) {
      try {
        const lastMessageId = currentMessages.value[currentMessages.value.length - 1]?._id
        const response = await fetch(
          `${API_URL}/messages/${selectedChat.value.type}/${selectedChat.value.id}/new?after=${lastMessageId || 0}`
        )
        if (!response.ok) throw new Error('Failed to fetch new messages')
        const newMessages = await response.json()
        if (newMessages.length > 0) {
          currentMessages.value.push(...newMessages)
          nextTick(() => {
            const container = document.querySelector('.messages-container')
            if (container) {
              container.scrollTop = container.scrollHeight
            }
          })
        }
      } catch (error) {
        console.error('Error polling messages:', error)
      }
    }
  }, 3000)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})

const startPrivateChat = (user) => {
  privateChats.value.push({ user })
  selectChat('private', user._id)
  showNewChat.value = false
  searchUsername.value = ''
}
</script>

<style scoped>
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
