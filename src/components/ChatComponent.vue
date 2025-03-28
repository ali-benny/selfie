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
          :class="[
            'chat-item flex items-center justify-between transition-all duration-200',
            selectedChat.id === group._id ? 'bg-surface-0 shadow-md' : 'hover:bg-base-300',
            hasUnreadMessages(group._id)
              ? 'border-4 border-l-primary border-b-primary/20 border-base-100'
              : ''
          ]"
        >
          <span>{{ group.name }}</span>
          <span v-if="getUnreadCount(group._id)" class="badge badge-primary badge-sm font-bold">
            {{ getUnreadCount(group._id) }}
          </span>
        </div>
      </div>
      <div class="divider m-0"></div>
      <div class="chat-private">
        <div class="flex justify-between items-center prose">
          <h3 class="mb-0">Private Chats</h3>
          <!-- New Private Chat -->
          <Popper>
            <button class="btn btn-ghost btn-sm">
              <Icon icon="fluent:add-16-filled" />
            </button>
            <template #content="{ close }">
              <div class="p-2 w-96">
                <h3 class="m-0">Start New Private Chat</h3>
                <div>
                  <label class="label">
                    <span class="label-text">Search users by username</span>
                  </label>
                  <div class="relative">
                    <input
                      v-model="searchUsername"
                      placeholder="Type username here..."
                      class="input input-bordered w-full pr-10"
                    />
                    <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                      <Icon icon="fluent:search-20-filled" class="text-base-content/30" />
                    </div>
                  </div>
                  <label class="label">
                    <span class="label-text-alt">Enter a username to find users</span>
                  </label>
                </div>

                <div>
                  <!-- Show message when no results -->
                  <div
                    v-if="filteredUsers.length === 0 && searchUsername.length > 0"
                    class="text-center py-4"
                  >
                    No users found matching "{{ searchUsername }}"
                  </div>

                  <!-- Display filtered users -->
                  <div
                    v-for="user in filteredUsers"
                    :key="user._id"
                    @click="startPrivateChat(user)"
                    class="user-item flex items-center gap-2 p-3"
                  >
                    <div class="avatar">
                      <div class="rounded-full mask mask-squircle !bg-primary w-10">
                        <img :src="user.image" :alt="user.name" class="m-0" />
                      </div>
                    </div>
                    <div>
                      <div class="font-semibold">{{ user.name }} {{ user.surname }}</div>
                      <div class="text-xs opacity-70">@{{ user.username }}</div>
                    </div>
                  </div>
                </div>

                <div class="flex flex-row-reverse">
                  <button @click="close" class="btn btn-sm">Close</button>
                </div>
              </div>
            </template>
          </Popper>
        </div>
        <!-- TODO: quando ricevo un messaggio da una chat privata non aggiunta non mi viene mostrato -->
        <div
          v-for="chat in privateChats"
          :key="chat.user._id"
          @click="selectChat('private', chat.user)"
          :class="[
            'chat-item flex items-center justify-between transition-all duration-200',
            selectedChat.id === chat.user._id ? 'bg-surface-0 shadow-md' : 'hover:bg-base-300',
            hasUnreadMessages(chat.user._id)
              ? 'border-4 border-l-primary border-b-primary/20 border-base-100'
              : ''
          ]"
        >
          <span>{{ chat.user.name }}</span>
          <span
            v-if="getUnreadCount(chat.user._id)"
            class="badge font-bold badge-sm badge-primary ml-2"
          >
            {{ getUnreadCount(chat.user._id) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Area messaggi -->
    <div class="chat-messages">
      <!-- Header chat -->
      <!-- TODO-Extra: sarebbe carino mettere come in whatsapp che se clicchi sui 3 puntini puoi avere info del gruppo -->
      <div
        v-if="selectedChat.id"
        class="flex items-center font-bold bg-base-100 border-solid border-8 border-base-200 rounded-lg h-20"
      >
        <div
          v-if="
            selectedChat.type === 'private' && selectedChat.dest._id != userStore.loggedUser._id
          "
          class="avatar w-10 m-2 z-2"
        >
          <img
            :src="getUserById(selectedChat.dest._id)?.image || ''"
            :title="
              getUserById(selectedChat.dest._id)
                ? `${getUserById(selectedChat.dest._id).name} ${getUserById(selectedChat.dest._id).surname}`
                : selectedChat.dest.name
            "
          />
        </div>
        <div v-else class="text-3xl m-3">
          <Icon icon="mingcute:group-3-fill" />
        </div>
        <span>{{ selectedChat.dest.name }}</span>
        <!-- TODO is typing label -->
        <!-- <h6>{{ isTyping }}</h6> -->
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
          :class="[
            message.user_id === userStore.loggedUser._id ? 'chat chat-end' : 'chat chat-start'
          ]"
        >
          <div
            class="chat-image avatar"
            v-if="selectedChat.type === 'group' && message.user_id != userStore.loggedUser._id"
          >
            <div
              class="ring-offset-base-100 rounded-full ring w-10"
              :class="getUserColor('ring', message)"
            >
              <img
                :src="getUserById(message.user_id)?.image || ''"
                :title="getUserById(message.user_id)?.name || message.name"
              />
            </div>
            <!-- Crown for group owner -->
            <span
              v-if="selectedChat.owner === message.user_id"
              class="absolute top-[-1] right-1 w-3 h-3 rotate-45"
              :class="{
                '!text-error': getUserById(message.user_id)?.color === 'primary',
                '!text-warning': getUserById(message.user_id)?.color === 'secondary',
                '!text-success': getUserById(message.user_id)?.color === 'accent',
                '!text-accent': getUserById(message.user_id)?.color === 'success',
                '!text-secondary': getUserById(message.user_id)?.color === 'warning',
                '!text-primary': getUserById(message.user_id)?.color === 'error'
              }"
            >
              <Icon icon="fluent:crown-16-filled" />
            </span>
          </div>
          <div class="chat-header text-sm flex items-center gap-2 mx-2">
            <p
              v-if="selectedChat.type == 'group' && message.user_id !== userStore.loggedUser._id"
              class="font-semibold"
            >
              {{ message.name }}
            </p>
            <time class="text-xs opacity-50">
              {{ new Date(message.timestamp).toLocaleTimeString() }}
            </time>
          </div>
          <div
            class="message"
            :class="
              message.user_id === userStore.loggedUser._id
                ? 'message-sent'
                : selectedChat.type === 'group'
                  ? getUserColor('!chat-bubble', message)
                  : 'message-received'
            "
          >
            <!-- TODO: non ha senso per warning error non mette il bg boh, con chat-bubble non va non capisco perchè -->
            {{ message.message }}
          </div>
          <span
            v-if="message.user_id === userStore.loggedUser._id"
            class="message-status text-xs opacity-70"
          >
            <!-- Indicatori di stato -->
            <!-- * Una singola spunta (✓) per i messaggi inviati (sent) -->
            <!-- * Doppia spunta (✓✓) per i messaggi consegnati (delivered) -->
            <!-- * Doppia spunta primary (✓✓) per i messaggi letti (read) -->
            <!-- * Un'icona di errore (⚠) per i messaggi non inviati (failed) -->
            <Icon v-if="message.status === 'sent'" icon="mdi:check" class="text-base-content" />
            <Icon
              v-else-if="message.status === 'delivered'"
              icon="mdi:check-all"
              class="text-base-content"
            />
            <Icon
              v-else-if="message.status === 'read'"
              icon="mdi:check-all"
              class="!text-primary"
            />
            <Icon
              v-else-if="message.status === 'failed'"
              icon="mdi:alert-circle"
              class="!text-error"
            />
          </span>
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
          @input="handleTyping"
          placeholder="Type a message..."
          class="input input-bordered w-full"
        />
        <button @click="sendMessage" class="btn btn-primary text-xl">
          <Icon icon="fluent:send-20-filled"></Icon>
        </button>
      </div>
    </div>
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
const newMessage = ref('') // message input
const groups = ref([])
const privateChats = ref([])
const selectedChat = ref({
  type: null,
  id: null,
  dest: {},
  img: '',
  users: []
})
const searchUsername = ref('')
const currentMessages = ref([]) // messages in the selectedChat
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

const isTyping = ref(false) // if the logged user is writing a new message
const typingTimeout = ref(null)

const handleTyping = () => {
  if (!selectedChat.value.id) return

  socket.emit('typing', {
    chatId: selectedChat.value.id,
    userId: userStore.loggedUser._id,
    isTyping: true
  })

  // Reset typing status after delay
  if (typingTimeout.value) clearTimeout(typingTimeout.value)
  typingTimeout.value = setTimeout(() => {
    socket.emit('typing', {
      chatId: selectedChat.value.id,
      userId: userStore.loggedUser._id,
      isTyping: false
    })
  }, 3000)
}

const getUserById = (messageUserId) => {
  if (!selectedChat.value?.users || !Array.isArray(selectedChat.value.users)) {
    // Se non abbiamo users nel selectedChat, cerca negli users globali
    return users.value.find((user) => user._id === messageUserId)
  }
  return selectedChat.value.users.find((user) => user._id === messageUserId)
}

const getUnreadCount = (chatId) => {
  // For chats in the list, always return the badge count directly from the respective arrays
  // Find in groups
  const group = groups.value.find((g) => g._id === chatId)
  if (group) {
    return group.unreadCount || 0
  }

  // Find in private chats
  const privateChat = privateChats.value.find(
    (chat) =>
      [userStore.loggedUser._id, chat.user._id].sort().join('_') === chatId ||
      chat.user._id === chatId
  )
  if (privateChat) {
    return privateChat.unreadCount || 0
  }

  // For the currently selected chat, also check current messages
  if (selectedChat.value && selectedChat.value.id === chatId) {
    const unreadInCurrent = currentMessages.value.filter(
      (msg) =>
        msg.user_id !== userStore.loggedUser._id &&
        (!msg.readBy || !msg.readBy.includes(userStore.loggedUser._id))
    ).length
    return unreadInCurrent
  }

  return 0
}

const hasUnreadMessages = (chatId) => {
  // Check if privateChats.value exists before using it
  if (!privateChats.value) return false

  // For private chats, generate the correct chatId
  const fullChatId =
    selectedChat.value?.type === 'private'
      ? [userStore.loggedUser._id, chatId].sort().join('_')
      : chatId

  return (
    currentMessages.value.some(
      (msg) =>
        msg.chatId === fullChatId &&
        msg.user_id !== userStore.loggedUser._id &&
        (!msg.readBy || !msg.readBy.includes(userStore.loggedUser._id))
    ) ||
    privateChats.value.some(
      (chat) =>
        chat.user._id === chatId &&
        chat.lastMessage?.user_id !== userStore.loggedUser._id &&
        (!chat.lastMessage?.readBy || !chat.lastMessage.readBy.includes(userStore.loggedUser._id))
    ) ||
    groups.value.some(
      (group) =>
        group._id === chatId &&
        group.lastMessage?.user_id !== userStore.loggedUser._id &&
        (!group.lastMessage?.readBy || !group.lastMessage.readBy.includes(userStore.loggedUser._id))
    )
  )
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
      readBy: [userStore.loggedUser._id], // Always read by sender
      status: 'sending'
    }

    try {
      // NOTA: non aggiungo più il messaggio localmente perchè non serve, lo salvo in db
      // Aggiungi il messaggio localmente prima
      // const tempId = 'temp_' + Date.now()
      // const tempMessage = {
      //   ...messageData,
      //   _id: tempId
      // }

      // currentMessages.value.push(tempMessage)
      newMessage.value = ''
      // await nextTick()
      scrollToBottom()

      // emetti il messaggio via socket
      socket.emit('chat-message', messageData)
    } catch (error) {
      console.error('Error sending message:', error)
      // Handle failed message
      const failedMsgIndex = currentMessages.value.findIndex((m) => m._id === 'temp_' + Date.now())
      if (failedMsgIndex !== -1) {
        currentMessages.value[failedMsgIndex].status = 'failed'
        currentMessages.value = [...currentMessages.value]
      }
    }
  }
}

async function selectChat(type, chat) {
  try {
    // generate chatId for private chats
    let chatId
    if (type === 'private') {
      chatId = [userStore.loggedUser._id, chat._id].sort().join('_')
    } else {
      chatId = chat._id
    }

    // join the room
    socket.emit('join-chat', {
      chatId,
      userId: userStore.loggedUser._id,
      type
    })

    // get user ID based on chat type
    const usersIds =
      type === 'private'
        ? [userStore.loggedUser._id, chat._id] // private chat: only 2 users
        : [...chat.members, chat.owner] // group chat: members & owner

    const chatUsers = await getUsersByIds(usersIds)

    selectedChat.value = {
      type,
      id: chatId,
      dest: chat,
      img: chat.img,
      users: chatUsers || [],
      owner: chat.owner || ''
    }

    // Fetch messages for this chat
    const response = await fetch(`${CHAT_URL}/messages/${type}/${chatId}`) // Corrected URL
    const data = await response.json()
    currentMessages.value = data

    // Mark messages as read
    markMessagesAsRead(chatId)

    scrollToBottom()
  } catch (error) {
    console.error('Error selecting chat:', error)
  }
}

async function markMessagesAsRead(chatId) {
  try {
    // Update UI immediately
    currentMessages.value.forEach((msg) => {
      if (
        msg.user_id !== userStore.loggedUser._id &&
        (!msg.readBy || !msg.readBy.includes(userStore.loggedUser._id))
      ) {
        msg.readBy = [...(msg.readBy || []), userStore.loggedUser._id]
      }
    })

    updateUnreadBadge()

    // Send API request to mark as read
    await fetch(`${CHAT_URL}/messages/${chatId}/read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userStore.loggedUser._id
      })
    })
  } catch (error) {
    console.error('Error marking messages as read:', error)
  }
}

function updateUnreadBadge() {
  // Check if we have a selected chat first
  if (!selectedChat.value || !selectedChat.value.id) return

  const chatId = selectedChat.value.id // Define chatId from selectedChat

  // Update unread count in chat list
  if (selectedChat.value.type === 'private') {
    const chatIndex = privateChats.value.findIndex(
      (chat) => [userStore.loggedUser._id, chat.user._id].sort().join('_') === chatId
    )
    if (chatIndex !== -1) {
      privateChats.value[chatIndex].unreadCount = 0
    }
  } else if (selectedChat.value.type === 'group') {
    const groupIndex = groups.value.findIndex((group) => group._id === chatId)
    if (groupIndex !== -1) {
      groups.value[groupIndex].unreadCount = 0
    }
  }

  // Force reactive update of the lists
  privateChats.value = [...privateChats.value]
  groups.value = [...groups.value]
}

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
    // console.log('Socket connected successfully')
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

  socket.on('chat-message', (message) => {
    // Se siamo nella chat corretta, aggiungi il messaggio
    if (selectedChat.value.id === message.chatId) {
      currentMessages.value.push(message)
      nextTick(() => {
        scrollToBottom()
      })
    }

    // Aggiorna i contatori non letti per le altre chat
    if (selectedChat.value.id !== message.chatId) {
      if (message.chatType === 'private') {
        const chat = privateChats.value.find(
          (c) => [userStore.loggedUser._id, c.user._id].sort().join('_') === message.chatId
        )
        if (chat) {
          chat.unreadCount = (chat.unreadCount || 0) + 1
          chat.lastMessage = message
        }
      } else {
        const group = groups.value.find((g) => g._id === message.chatId)
        if (group) {
          group.unreadCount = (group.unreadCount || 0) + 1
          group.lastMessage = message
        }
      }
    }
  })

  socket.on('typing', ({ chatId, userId, isTyping: typing }) => {
    if (selectedChat.value.id === chatId && userId !== userStore.loggedUser._id) {
      const user = getUserById(userId)
      isTyping.value = typing ? `${user?.name || 'Someone'} is typing...` : ''
    }
  })

  socket.on('message-sent', ({ messageId, timestamp }) => {
    // Trova il messaggio temporaneo e aggiornalo
    const msgIndex = currentMessages.value.findIndex((m) => m.status === 'sending')
    if (msgIndex !== -1) {
      currentMessages.value[msgIndex] = {
        ...currentMessages.value[msgIndex],
        _id: messageId,
        timestamp: timestamp,
        status: 'sent'
      }
      // Forza l'aggiornamento reattivo
      currentMessages.value = [...currentMessages.value]
    }
  })

  // Quando un messaggio viene consegnato
  socket.on('message-status-update', ({ messageId, status }) => {
    // Aggiorna lo stato del messaggio
    const msgIndex = currentMessages.value.findIndex((m) => m._id === messageId)
    if (msgIndex !== -1) {
      currentMessages.value[msgIndex].status = status
      // Forza l'aggiornamento reattivo
      currentMessages.value = [...currentMessages.value]
    }
  })

  // Quando ci si unisce a una chat
  socket.on('joined', ({ messages }) => {
    if (messages && Array.isArray(messages)) {
      currentMessages.value = messages
      nextTick(() => {
        scrollToBottom()
      })
    }
  })

  socket.on('messages-marked-read', ({ chatId, userId, messages = [] }) => {
    // Update current chat messages if we're in that chat
    if (selectedChat.value?.id === chatId) {
      if (Array.isArray(messages) && messages.length > 0) {
        currentMessages.value = currentMessages.value.map((msg) => {
          const updatedMsg = messages.find((m) => m._id === msg._id)
          if (updatedMsg) {
            return {
              ...msg,
              readBy: updatedMsg.readBy || [],
              status: updatedMsg.status || 'sent'
            }
          }
          return {
            ...msg,
            readBy: msg.readBy || [],
            status: msg.status || 'sent'
          }
        })
      } else {
        currentMessages.value = currentMessages.value.map((msg) => ({
          ...msg,
          readBy: [...new Set([...(msg.readBy || []), userId])],
          status: msg.user_id !== userStore.loggedUser._id ? 'read' : msg.status
        }))
      }
    }

    // Update private chats list
    privateChats.value = privateChats.value.map((chat) => {
      if (chat.lastMessage && chat.lastMessage.chatId === chatId) {
        return {
          ...chat,
          lastMessage: {
            ...chat.lastMessage,
            readBy: [...new Set([...(chat.lastMessage.readBy || []), userId])],
            status:
              chat.lastMessage.user_id !== userStore.loggedUser._id
                ? 'read'
                : chat.lastMessage.status
          }
        }
      }
      return chat
    })

    // Update groups list
    groups.value = groups.value.map((group) => {
      if (group._id === chatId) {
        return {
          ...group,
          lastMessage: group.lastMessage
            ? {
                ...group.lastMessage,
                readBy: [...new Set([...(group.lastMessage.readBy || []), userId])],
                status:
                  group.lastMessage.user_id !== userStore.loggedUser._id
                    ? 'read'
                    : group.lastMessage.status
              }
            : null
        }
      }
      return group
    })

    // Force reactive update
    nextTick(() => {
      privateChats.value = [...privateChats.value]
      groups.value = [...groups.value]
    })
  })
}

onMounted(async () => {
  try {
    setupSocketConnection()

    // Carica tutti gli utenti tranne quello loggato
    const usersData = await getUsers()
    users.value = usersData.filter((u) => u._id !== userStore.loggedUser._id)

    // Carica i gruppi dell'utente
    const userGroups = await getGroups(userStore.loggedUser._id)
    groups.value = userGroups
    await loadGroupChats()

    // Carica le chat private esistenti
    const privateChatData = await loadPrivateChats()
    privateChats.value = privateChatData

    // Unisciti alle room delle chat
    socket.emit('join-user-rooms', {
      userId: userStore.loggedUser._id,
      groups: groups.value.map((g) => g._id),
      privateChats: privateChats.value.map((c) =>
        [userStore.loggedUser._id, c.user._id].sort().join('_')
      )
    })

    // Load unread messages badge
    updateUnreadBadge()
  } catch (error) {
    console.error('Error initializing chat component:', error)
    toast.error('Failed to initialize chat')
  }
})

onUnmounted(() => {
  socket.off('chat-message')
  socket.off('joined')
  socket.off('message-sent')
  socket.off('message-status-update')
  socket.off('messages-marked-read')
  socket.off('typing')
  socket.off('user-status')
  socket.off('error')
  socket.off('connect_error')
  socket.off('reconnect')
  socket.off('reconnect_failed')
  if (typingTimeout.value) clearTimeout(typingTimeout.value)
})

async function loadPrivateChats() {
  try {
    const response = await fetch(`${CHAT_URL}/messages/private/${userStore.loggedUser._id}/all`)
    if (!response.ok) throw new Error('Failed to fetch existing chats')

    const existingChats = await response.json()

    return existingChats
      .map((chat) => {
        const user = users.value.find((u) => u._id === chat.participantId)
        return user
          ? {
              user: user,
              lastMessage: chat.lastMessage,
              unreadCount: chat.unreadCount || 0 // Make sure this is correctly set
            }
          : null
      })
      .filter((chat) => chat) // Filter out null values
  } catch (error) {
    console.error('Error loading existing chats:', error)
    return [] // Return empty array in case of error
  }
}

async function loadGroupChats() {
  try {
    // Make sure we have groups before making the request
    if (!groups.value.length) return

    // Assicurati che ci siano gruppi prima di procedere
    if (!groups.value.length) {
      console.warn('No groups found to load.') // Debug
      return
    }

    const response = await fetch(`${CHAT_URL}/messages/group/${userStore.loggedUser._id}/all`)
    if (!response.ok) throw new Error('Failed to fetch group chats')

    const groupData = await response.json()

    // Update groups with unread counts and last messages
    groups.value = groups.value.map((group) => {
      const groupInfo = groupData.find((g) => g.groupId === group._id)
      return {
        ...group,
        unreadCount: groupInfo?.unreadCount || 0,
        lastMessage: groupInfo?.lastMessage || null
      }
    })

    // Force reactive update
    groups.value = [...groups.value]
  } catch (error) {
    console.error('Error loading group chats:', error)
    toast.error('Failed to load group chats')
  }
}

const startPrivateChat = (user) => {
  // Verifica se la chat privata esiste già
  const existingChat = privateChats.value.find((chat) => chat.user._id === user._id)
  if (!existingChat) {
    privateChats.value.push({ user })
  }
  selectChat('private', user)
  searchUsername.value = ''
}

function getUserColor(prefix, message) {
  if (selectedChat.value.type === 'group') {
    const user = getUserById(message.user_id)

    // Verifica che l'utente esista e abbia un colore
    if (user && user.color) {
      // Handle special case for !bg prefix
      if (prefix === '!bg') {
        return `!bg-${user.color} !text-${user.color}-content`
      }
      return `${prefix}-${user.color}`
    }
  }
  // Handle special case for !bg prefix in fallback
  if (prefix === '!bg') {
    return '!bg-secondary !text-secondary-content'
  }
  return `${prefix}-secondary` // Fallback
}
</script>

<style scoped>
.chat-sidebar {
  @apply w-64 bg-base-200 p-4 rounded-lg flex flex-col gap-4 shadow-inner;
}

.chat-messages {
  @apply flex-1 flex flex-col bg-base-200 rounded-lg shadow-inner;
}

.chat-container {
  @apply flex h-[80vh] gap-4;
}

.messages-container {
  @apply flex-1 p-4 overflow-y-auto;
}

.chat-input {
  @apply p-4 flex gap-2;
}

.message {
  @apply chat-bubble;
}

.message-sent {
  @apply chat-bubble-primary;
}

.message-received {
  @apply chat-bubble-secondary;
}

.message-status {
  @apply flex items-center gap-1 ml-2;
}

.chat-item {
  @apply px-2 py-1 rounded-lg cursor-pointer hover:bg-base-300;
}

.user-item {
  @apply p-2 hover:bg-base-300 cursor-pointer rounded-lg;
}
</style>
