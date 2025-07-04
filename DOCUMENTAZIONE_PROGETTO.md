# Documentazione Progetto SELFIE

## Authors

Alice Benatti, alice.benatti4@studio.unibo.it, 0000971007

Leonardo Verrone, leonardo.verrone@studio.unibo.it, 0001078280

## Introduzione

SELFIE è una piattaforma web per la gestione della produttività personale e collaborativa sviluppata per il corso di Tecnologie Web. Il sistema integra calendario eventi, gestione attività, timer Pomodoro, chat e sistema di note con funzionalità di time machine per la simulazione temporale.

## Tecnologie utilizzate

### Tecnologie Frontend

- **Vue.js 3** framework frontend
- **Pinia** global state manager basato su Vue3
- **Vue Router** router client-side
- **TailwindCSS + DaisyUI** come framework css e sistema di componenti
- **Vite** build tool
- **Service Worker** implementazione notifiche push
- **Socket.IO Client** implementazione delle chat
- **EditorJS** per editor rich-text avanzato
- **Iconify Vue** per sistema di icone unificato

### Tecnologie Backend

- **Node.js + Express.js** application server
- **MongoDB + Mongoose** database e ObjectDataModel
- **Web Push** implementazione notifiche push
- **Socket.IO Server** implementazione della chat

### Architettura REST API e Database

Il sistema utilizza **API REST** complete per la gestione delle risorse salvate sul database **MongoDB**.

Ad esempio sono stati utilizzati i seguenti endpoints:

```javascript
// Struttura API per gestione eventi calendario
GET    /api/calendar/events      // Lista eventi utente
POST   /api/calendar/events      // Crea nuovo evento
PUT    /api/calendar/events/:id  // Aggiorna evento esistente
DELETE /api/calendar/events/:id  // Elimina evento

// Gestione note collaborative
GET    /api/notes/:id            // Recupera nota con contenuto EditorJS
POST   /api/notes                // Crea nuova nota
PUT    /api/notes/:id            // Salva modifiche nota
POST   /api/notes/upload         // Upload allegati via GridFS

// Sistema chat e gruppi
GET    /api/groups               // Lista gruppi utente
POST   /api/chat/messages        // Invio messaggio
GET    /api/users                // Lista utenti per condivisione
```

Relativi ai seguenti schema MongoDB:

```javascript
// Collection Eventi
{
  title: String,
  start: Date, end: Date,
  owner: ObjectId,              // ref Users
  invitees: [ObjectId],         // ref Users
  recurrence: {
    frequency: String,          // 'daily','weekly','monthly'
    interval: Number,
    endDate: Date
  }
}

// Collection Note Collaborative
{
  title: String,
  content: Object,              // EditorJS JSON structure
  author: ObjectId,             // ref Users
  readers: [ObjectId],          // ref Users (condivisione)
  attachments: [GridFS.files]   // File storage
}
```

## Implementazione State Management con Pinia

**Pinia** gestisce lo stato globale dell'applicazione con store reattivi e tipizzati. Ad esempio:

### Calendar Store

```javascript
export const useCalendarStore = defineStore('calendar', {
  state: () => ({
    currentDate: new Date(),
    currentView: 'month', // 'day', 'week', 'month'
    events: [],
    todos: [],
    isLoading: false,
    activeCategories: ['work', 'personal', 'other']
  }),

  actions: {
    async fetchEvents() {
      this.isLoading = true
      const response = await fetch(`${API_URL}/calendar/events`)
      this.events = await response.json()
      this.isLoading = false
    },

    async createEvent(eventData) {
      const response = await fetch(`${API_URL}/calendar/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      })
      const newEvent = await response.json()
      this.events.push(newEvent)
    }
  },

  getters: {
    visibleEvents: (state) =>
      state.events.filter((event) => state.activeCategories.includes(event.category))
  }
})
```

## Sistema Notifiche: Service Worker e Web Push

Abbiamo utilizzato le **[Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)** e le **[Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)** per la ricezione delle notifiche push da parte del client.

```javascript
// service-worker.js
self.addEventListener('push', (event) => {
  const data = event.data.json()

  const options = {
    body: data.message,
    icon: '/favicon.png',
    badge: '/favicon.png',
    tag: data.type,
    requireInteraction: data.urgent || false,
    actions: data.actions || []
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})
```

### Web Push Server

Sul server backend abbiamo utilizzato con **web-push** per l'invio delle notifiche push ai client:

```javascript
// server/notification/webpush.js
import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:admin@selfie.app',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

export async function sendNotification(subscription, payload) {
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: payload.title,
        message: payload.message,
        type: payload.type,
        urgent: payload.urgent || false
      })
    )
  } catch (error) {
    console.error('Push notification failed:', error)
  }
}
```

## Comunicazione Real-time con Socket.IO

### Chat System Implementation

```javascript
// Frontend - Gestione WebSocket
import io from 'socket.io-client'
const socket = io(CHAT_URL)

// Join chat room
socket.emit('join-chat', {
  chatId: selectedChat.value.id,
  userId: userStore.loggedUser._id,
  type: selectedChat.value.type
})

// Ricezione messaggi real-time
socket.on('chat-message', (message) => {
  if (selectedChat.value.id === message.chatId) {
    currentMessages.value.push(message)
    scrollToBottom()
  }
})
```

### Backend Socket.IO Server

```javascript
// server/chat/messages.js
export function initializeSocket(server) {
  const io = new Server(server, { cors: { origin: '*' } })

  io.on('connection', (socket) => {
    socket.on('join-chat', async ({ chatId, userId, type }) => {
      socket.join(chatId)

      // Carica messaggi esistenti da MongoDB
      const messages = await Message.find({ chatId }).populate('user_id')
      socket.emit('joined', { messages })
    })

    socket.on('send-message', async ({ chatId, message, userId }) => {
      // Salva in MongoDB
      const newMessage = await Message.create({
        message,
        user_id: userId,
        chatId,
        timestamp: new Date(),
        type
      })

      // Broadcast a tutti i client nella room
      io.to(chatId).emit('chat-message', newMessage)
    })
  })
}
```
