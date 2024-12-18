<template>
  <div class="chat-container">
    <!-- Sidebar con lista chat -->
    <div class="chat-sidebar">
      <div class="prose">
        <h3>Group Chats</h3>
        <div
          v-for="group in groups"
          :key="group._id"
          @click="selectChat('group', group)"
          :class="['chat-item', selectedChat.id === group._id ? 'active' : '']"
        >
          {{ group.name }}
          <!-- <span v-if="unreadMessages.value[group._id]?" class="unread-dot">
            {{ unreadMessages.value[group._id]? }}</span
          > -->
        </div>
      </div>
      <div class="divider m-0"></div>
      <div class="chat-private">
        <div class="flex justify-between items-center prose">
          <h3>Private Chats</h3>
          <button @click="showNewChat = true" class="btn btn-ghost btn-sm">
            <Icon icon="fluent:add-16-filled" />
          </button>
        </div>
        <div
          v-for="chat in privateChats"
          :key="chat.user._id"
          @click="selectChat('private', chat.user)"
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
      <!-- Header chat -->
      <div
        v-if="selectedChat.id"
        class="font-bold px-5 py-2 bg-base-100 border-solid border-8 border-base-200 rounded-lg"
      >
        {{ selectedChat.dest_username }}
      </div>

      <div class="messages-container">
        <!-- Debug info -->
        <!-- <div v-if="selectedChat.id" class="text-sm text-gray-500 mb-2">
          Current chat: {{ selectedChat.type }} - {{ selectedChat.id }} Messages:
          {{ currentMessages.length }}
        </div> -->

        <div
          v-for="message in currentMessages"
          :key="message._id"
          class="flex flex-col justify-start"
          :class="['message', message.user_id === userStore.loggedUser._id ? 'sent' : 'received']"
        >
          <div class="avatar w-10 m-2 z-2">
            <img
              :src="getUserById(message.user_id)?.image || ''"
              :title="
                getUserById(message.user_id)
                  ? getUserById(message.user_id).name + ' ' + getUserById(message.user_id).surname
                  : message.name
              "
            />
          </div>
          <div class="flex flex-col justify-start text-sm text-surface-0 font-semibold">
            {{ message.name }}
            <span class="flex text-xs">
              {{ new Date(message.timestamp).toLocaleTimeString() }}
            </span>
          </div>
          <div class="flex message-content">
            {{ message.message }}
            <!-- Indicatori di stato per i messaggi inviati -->
            <!-- <span
              v-if="message.user_id === userStore.loggedUser._id"
              class="message-status text-xs"
            >
              <Icon v-if="messageStatus.get(message._id) === 'delivered'" icon="mdi:check-all" />
              <Icon
                v-else-if="messageStatus.get(message._id) === 'read'"
                icon="mdi:check-all"
                class="text-secondary"
              />
              <Icon v-else icon="mdi:check" />
            </span> -->
          </div>
        </div>
      </div>

      <!-- Input area -->
      <div class="chat-input">
        <div v-if="isTyping" class="text-sm text-gray-500">
          {{ isTyping }}
        </div>
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
import { getUsers, getUsersByIds } from '@/router/user/user'
import { getGroups } from '@/router/group/group'
import { CHAT_URL } from '~/const.js'

const userStore = useUserStore()
const messages = ref([])
const newMessage = ref('')
const groups = ref([])
const privateChats = ref([])
const selectedChat = ref({
  type: null,
  id: null,
  dest_username: '',
  img: '',
  users: []
})
const showNewChat = ref(false)
const searchUsername = ref('')
const currentMessages = ref([])
const messageStatus = ref(new Map())
const unreadMessages = ref({})
const users = ref([])

// Filtra gli utenti per la ricerca
const filteredUsers = computed(() => {
  // Aggiungi un controllo per assicurarti che users.value sia un array
  if (!Array.isArray(users.value)) return []

  return users.value.filter(
    (user) =>
      user.username?.toLowerCase().includes(searchUsername.value.toLowerCase()) &&
      user._id !== userStore.loggedUser._id
  )
})

const isTyping = ref(false)
const typingTimeout = ref(null)

const getUserById = (messageUserId) => {
  if (!selectedChat?.users) return null
  return selectedChat.users.find((user) => user._id === messageUserId)
}

const handleTyping = () => {
  if (selectedChat.value.id) {
    socket.emit('typing', {
      chatId: selectedChat.value.id,
      userId: userStore.loggedUser._id,
      name: userStore.loggedUser.name
    })

    // Clear existing timeout
    if (typingTimeout.value) clearTimeout(typingTimeout.value)

    // Set new timeout
    typingTimeout.value = setTimeout(() => {
      socket.emit('stop-typing', {
        chatId: selectedChat.value.id,
        userId: userStore.loggedUser._id
      })
    }, 2000)
  }
}

const handleNewMessage = (message) => {
  // Aggiorna i messaggi solo se appartengono alla chat corrente
  if (message.chatId === selectedChat.value.id) {
    const existingMessageIndex = currentMessages.value.findIndex(
      (m) =>
        m.message === message.message &&
        m.user_id === message.user_id &&
        (m._id.startsWith('temp_') || m._id === message._id)
    )

    if (existingMessageIndex !== -1) {
      currentMessages.value[existingMessageIndex] = message
    } else {
      currentMessages.value.push(message)
      scrollToBottom()
    }
  }

  // Se è un messaggio privato ricevuto, aggiungi automaticamente la chat
  if (message.chatType === 'private' && message.user_id !== userStore.loggedUser._id) {
    // Cerca l'utente mittente
    const sender = users.value.find((u) => u._id === message.user_id)
    if (sender && !privateChats.value.some((chat) => chat.user._id === sender._id)) {
      privateChats.value.push({
        user: sender,
        lastMessage: message
      })
    }
  }
}

const sendMessage = async () => {
  if (newMessage.value.trim() && selectedChat.value.id) {
    const messageData = {
      message: newMessage.value,
      name: userStore.loggedUser.name,
      user_id: userStore.loggedUser._id,
      chatId: selectedChat.value.id,
      chatType: selectedChat.value.type,
      timestamp: new Date(),
      status: 'sent'
    }

    try {
      // Aggiungi il messaggio localmente prima
      const tempId = 'temp_' + Date.now()
      const tempMessage = {
        ...messageData,
        _id: tempId
      }

      currentMessages.value.push(tempMessage)
      newMessage.value = ''
      scrollToBottom()

      // Poi emetti il messaggio via socket
      socket.emit('chat-message', messageData)
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }
}
const handleMessageStatus = ({ messageId, status }) => {
  messageStatus.value.set(messageId, status)
}

const selectChat = async (type, chat) => {
  try {
    // Genera il chatId per chat private
    let chatId =
      type === 'private' ? [userStore.loggedUser._id, chat._id].sort().join('_') : chat._id

    // Raccogli gli ID degli utenti in base al tipo di chat
    const usersIds =
      type === 'private'
        ? [userStore.loggedUser._id, chat._id] // Per chat private, solo i due utenti
        : [...chat.members, chat.owner] // Per gruppi, tutti i membri più l'owner
    const chatUsers = await getUsersByIds(usersIds)

    selectedChat.value = {
      type,
      id: chatId,
      dest_username: chat.name,
      img: chat.img,
      users: chatUsers
    }

    currentMessages.value = [] // Reset messages

    // Carica i messaggi precedenti dal server
    const response = await fetch(`${CHAT_URL}/messages/${type}/${chatId}`)
    if (!response.ok) throw new Error('Failed to fetch messages')
    const messages = await response.json()
    currentMessages.value = messages

    // Unisciti alla stanza socket
    socket.emit('join-chat', {
      chatId,
      userId: userStore.loggedUser._id,
      type
    })

    scrollToBottom()
  } catch (error) {
    console.error('Error selecting chat:', error)
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
import { useToast } from 'vue-toastification'

const toast = useToast()

const setupSocketConnection = () => {
  socket.on('connect', () => {
    console.log('Socket connected successfully')
    toast.success('Connected to chat server')
  })

  socket.on('connect_error', (error) => {
    console.error('Connection error:', error)
    toast.error(`Connection lost: ${error.message}. Trying to reconnect...`)
  })

  socket.on('reconnect_failed', () => {
    toast.error('Failed to reconnect to chat server. Please refresh the page.')
  })

  socket.on('reconnect', (attemptNumber) => {
    toast.success(`Reconnected after ${attemptNumber} attempts!`)
    if (selectedChat.value?.id) {
      socket.emit('join-chat', {
        chatId: selectedChat.value.id,
        userId: userStore.loggedUser._id,
        type: selectedChat.value.type
      })
    }
  })

  socket.on('error', (error) => {
    console.error('Socket error:', error)
    toast.error(`Chat error: ${error.message}`)
  })
}

onMounted(async () => {
  try {
    setupSocketConnection()

    const usersList = await getUsers()
    if (Array.isArray(usersList)) {
      users.value = usersList.filter((u) => u._id !== userStore.loggedUser._id)
    } else {
      console.error('getUsers did not return an array:', usersList)
      users.value = []
    }

    // Carica gruppi e utenti
    const userGroups = await getGroups(userStore.loggedUser._id)
    groups.value = userGroups || []

    if (!socket.connected) {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'))
        }, 5000)

        socket.connect()
        socket.once('connect', () => {
          clearTimeout(timeout)
          resolve()
        })
      })
    }

    socket.on('chat-message', handleNewMessage)
    socket.on('message-status-update', handleMessageStatus)

    // Gestione stato dei messaggi
    socket.on('messages-marked-read', ({ chatId }) => {
      if (chatId === selectedChat.value.id) {
        currentMessages.value.forEach((msg) => {
          if (msg.user_id !== userStore.loggedUser._id) {
            messageStatus.value.set(msg._id, 'read')
          }
        })
      }
    })

    await loadExistingChats()

    // Connessione iniziale
    socket.emit('user-connected', userStore.loggedUser._id)

    socket.on('joined', ({ messages }) => {
      console.log('Received messages on join:', messages)
      currentMessages.value = messages
      scrollToBottom()
    })

    socket.on('typing', ({ name }) => {
      isTyping.value = `${name} is typing...`
    })

    socket.on('stop-typing', () => {
      isTyping.value = false
    })

    socket.on('error', (error) => {
      console.error('Socket error:', error)
    })
  } catch (error) {
    console.error('Error loading initial data:', error)
  }
})

// Cleanup quando il componente viene distrutto
onUnmounted(() => {
  socket.off('chat-message')
  socket.off('joined')
  socket.off('message-status-update')
  socket.off('messages-marked-read')
  socket.off('user-status')
  socket.off('error')
  socket.off('connect_error')
  socket.off('reconnect')
})

const updateUnreadMessages = (chatId) => {
  if (!unreadMessages.value[chatId]) {
    unreadMessages.value[chatId] = 1
  } else {
    unreadMessages.value[chatId] += 1
  }
}

const loadExistingChats = async () => {
  try {
    const response = await fetch(`${CHAT_URL}/messages/private/${userStore.loggedUser._id}/chats`)
    if (!response.ok) throw new Error('Failed to fetch existing chats')

    const responseData = await response.text()
    const existingChats = JSON.parse(responseData)

    // Aggiorna la lista delle chat private
    for (const chat of existingChats) {
      const otherUserId = chat.participantId
      const user = users.value.find((u) => u._id === otherUserId)
      if (user && !privateChats.value.some((pc) => pc.user._id === user._id)) {
        privateChats.value.push({
          user,
          lastMessage: chat.lastMessage
        })
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
  selectChat('private', user)
  showNewChat.value = false
  searchUsername.value = ''
}
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
  @apply mb-4 max-w-[60%] chat-bubble;
}

.sent {
  @apply ml-auto chat chat-end chat-bubble-primary;
}

.received {
  @apply chat chat-start chat-bubble-secondary;
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
