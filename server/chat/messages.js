import express from 'express'
import { Server } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import mongoose from 'mongoose'
import { connect } from '../app.js'
let connected = false
const app = express()
const http = new Server(app)
const io = new SocketIOServer(http)

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
  }
})

const Message = mongoose.model('Message', MessageSchema)
// Prima di ogni operazione sul database, assicurati che la connessione sia attiva
const ensureConnection = async () => {
  if (!connected) {
    await connect('messages')
    connected = true
  }
}

// Connessione al database
app.on('mount', async () => {
  await connect('messages')
  connected = true
})

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
  try {
    await ensureConnection()
    const messages = await Message.find({
      chatType: req.params.type,
      chatId: req.params.id
    }).sort({ timestamp: 1 })
    res.json(messages)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/messages/:type/:id/new', async (req, res) => {
  try {
    await ensureConnection()
    const messages = await Message.find({
      chatType: req.params.type,
      chatId: req.params.id,
      _id: { $gt: req.query.after }
    }).sort({ timestamp: 1 })
    res.json(messages)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

io.on('connection', function (socket) {
  console.log('A user with ID: ' + socket.id + ' connected')

  socket.on('chat-message', async (message) => {
    try {
      // Crea e salva il nuovo messaggio nel MongoDB
      await ensureConnection()
      const newMessage = new Message({
        message: message.message,
        user_id: message.userId,
        name: message.user,
        chatId: message.chatId,
        chatType: message.chatType,
        timestamp: new Date()
      })
      
      const savedMessage = await newMessage.save()
      console.log('Message saved:', savedMessage)
      
      // Invia il messaggio a tutti i client nella stessa stanza
      io.to(message.chatId).emit('chat-message', newMessage)
    } catch (err) {
      console.error('Error saving message:', err)
      socket.emit('error', { message: 'Failed to save message' })
    }
  })

  socket.on('joined', async (data) => {
    try {
      // Lascia tutte le stanze precedenti
      socket.rooms.forEach(room => {
        if (room !== socket.id) socket.leave(room)
      })
      
      // Unisciti alla nuova stanza
      socket.join(data.chatId)
      
      // Recupera la cronologia dei messaggi
      const messages = await Message.find({
        chatId: data.chatId,
        chatType: data.type
      })
      .sort({ timestamp: -1 })
      .limit(50)
      
      socket.emit('joined', { messages })
    } catch (err) {
      console.error('Error fetching messages:', err)
      socket.emit('error', { message: 'Failed to fetch messages' })
    }
  })
})

export default app
