import { Server as SocketIOServer } from 'socket.io'
import express from 'express'
import { SERVER_URL } from '../../const.js'
import { connect } from '../app.js'
import mongoose from 'mongoose'

const app = express()
let io = null

// Funzione per inizializzare Socket.IO
export const initializeSocket = (server) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : SERVER_URL,
      methods: ['GET', 'POST'],
      credentials: true
    }
  })

  setupSocketEvents(io)
}
let connected = false

const MessageSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  user_id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  chatId: {
    type: String,
    required: true
  },
  chatType: {
    type: String,
    enum: ['group', 'private'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Boolean,
    default: false
  },
  readBy: [
    {
      type: String,
      ref: 'User'
    }
  ],
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  }
})

const Message = mongoose.model('Message', MessageSchema)

const ensureConnection = async () => {
  if (!connected) {
    await connect('messages')
    connected = true
  }
}

// Utility per generare un chatId unico per due utenti
const generatePrivateChatId = (userId1, userId2) => {
  return [userId1, userId2].sort().join('_')
}

app.use(express.json())

app.post('/messages', async (req, res) => {
  try {
    await ensureConnection()
    const message = new Message(req.body)
    const savedMessage = await message.save()
    res.status(201).json(savedMessage)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/messages/:type/:id', async (req, res) => {
  const { type, id } = req.params

  try {
    await ensureConnection()

    const query = {
      chatId: id,
      chatType: type
    }

    const messages = await Message.find(query).sort({ timestamp: 1 }).lean() // Per migliori performance

    res.json(messages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    res.status(500).json({ error: error.message })
  }
})

app.get('/messages/private/:userId/chats', async (req, res) => {
  try {
    await ensureConnection()

    // Trova tutte le chat private dove l'utente è coinvolto (come mittente o destinatario)
    const chats = await Message.aggregate([
      {
        $match: {
          chatType: 'private',
          $or: [
            { user_id: req.params.userId },
            { chatId: { $regex: req.params.userId } }
          ]
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$user_id', req.params.userId] },
              { $arrayElemAt: [{ $split: ['$chatId', '_'] }, 1] },
              '$user_id'
            ]
          },
          lastMessage: { $first: '$$ROOT' }
        }
      },
      {
        $project: {
          participantId: '$_id',
          lastMessage: 1
        }
      }
    ])

    res.json(chats)
  } catch (error) {
    console.error('Error fetching chats:', error)
    res.status(500).json({ error: error.message })
  }
})

const setupSocketEvents = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id)

    socket.on('user-connected', (userId) => {
      socket.userId = userId
      socket.broadcast.emit('user-status', { userId, status: 'online' })
    })

    socket.on('join-chat', async ({ chatId, userId, type }) => {
      try {
        console.log(`User ${userId} joining chat ${chatId}`)

        // Lascia le stanze precedenti
        for (const room of socket.rooms) {
          if (room !== socket.id) {
            socket.leave(room)
          }
        }

        // Unisciti alla nuova stanza
        socket.join(chatId)

        // Carica i messaggi esistenti
        const messages = await Message.find({
          chatId: chatId,
          chatType: type
        })
          .sort({ timestamp: 1 })
          .lean()

        // Invia i messaggi solo al client che si è unito
        socket.emit('joined', { messages })
      } catch (err) {
        console.error('Error joining chat:', err)
        socket.emit('error', { message: 'Failed to join chat' })
      }
    })

    socket.on('chat-message', async (messageData) => {
      try {
        await ensureConnection()

        const newMessage = new Message({
          ...messageData,
          status: 'sent',
          timestamp: new Date()
        })

        const savedMessage = await newMessage.save()

        // Emetti il messaggio a tutti i client nella stanza
        io.to(messageData.chatId).emit('chat-message', savedMessage)

        // Conferma al mittente
        socket.emit('message-sent', {
          messageId: savedMessage._id,
          timestamp: savedMessage.timestamp
        })
      } catch (err) {
        console.error('Error handling message:', err)
        socket.emit('error', { message: 'Failed to send message' })
      }
    })

    socket.on('message-received', async ({ messageId, userId }) => {
      try {
        const message = await Message.findByIdAndUpdate(
          messageId,
          { status: 'delivered' },
          { new: true }
        )
        io.to(message.chatId).emit('message-status-update', {
          messageId,
          status: 'delivered'
        })
      } catch (err) {
        console.error('Error updating message status:', err)
      }
    })

    const updateUserStatus = async (userId, status) => {
      io.emit('user-status-change', { userId, status })
    }

    socket.on('user-connected', async (userId) => {
      socket.userId = userId
      await updateUserStatus(userId, 'online')

      // Trova tutte le chat dell'utente e uniscilo
      const userChats = await Message.distinct('chatId', {
        $or: [{ user_id: userId }, { chatId: { $regex: userId } }]
      })

      userChats.forEach((chatId) => {
        socket.join(chatId)
      })
    })

    socket.on('disconnect', async () => {
      if (socket.userId) {
        await updateUserStatus(socket.userId, 'offline')
      }
    })

    socket.on('disconnect', () => {
      if (socket.userId) {
        socket.broadcast.emit('user-status', { userId: socket.userId, status: 'offline' })
      }
      console.log('User disconnected:', socket.id)
    })

    socket.on('mark-messages-read', async ({ chatId, userId }) => {
      try {
        await Message.updateMany(
          {
            chatId,
            user_id: { $ne: userId },
            status: { $ne: 'read' }
          },
          { status: 'read' }
        )

        io.to(chatId).emit('messages-marked-read', { chatId, userId })
      } catch (err) {
        console.error('Error marking messages as read:', err)
      }
    })
  })
}

export default app
