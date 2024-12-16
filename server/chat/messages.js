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
  ]
})

const Message = mongoose.model('Message', MessageSchema)

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
      $or: [{ chatId: req.params.id }, { user_id: req.params.id }]
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

// Endpoint per ottenere le chat private esistenti
app.get('/messages/private/:userId/chats', async (req, res) => {
  try {
    await ensureConnection()

    // Trova tutte le chat private dove l'utente è coinvolto
    const chats = await Message.aggregate([
      {
        $match: {
          chatType: 'private',
          $or: [{ user_id: req.params.userId }, { chatId: req.params.userId }]
        }
      },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ['$user_id', req.params.userId] }, '$chatId', '$user_id']
          },
          lastMessage: { $last: '$$ROOT' }
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

// Endpoint per segnare i messaggi come letti
app.post('/messages/:messageId/read', async (req, res) => {
  try {
    await ensureConnection()
    const message = await Message.findByIdAndUpdate(
      req.params.messageId,
      {
        $addToSet: { readBy: req.body.userId },
        read: true
      },
      { new: true }
    )
    res.json(message)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Nel file server/chat/messages.js
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Quando un utente si unisce a una chat
  socket.on('join-chat', ({ chatId }) => {
    socket.join(chatId);
  });

  // Quando viene inviato un messaggio
  socket.on('chat-message', async (messageData) => {
    try {
      await ensureConnection();
      const newMessage = new Message({
        ...messageData,
        timestamp: new Date(),
      });
      const savedMessage = await newMessage.save();

      // Invia il messaggio a tutti gli utenti nella chat
      io.to(messageData.chatId).emit('chat-message', savedMessage);

      // Notifica gli utenti che hanno la chat chiusa
      socket.broadcast.emit('new-message', {
        chatId: messageData.chatId,
        message: savedMessage,
      });
    } catch (err) {
      console.error('Error saving message:', err);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});
export default app
