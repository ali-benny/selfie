import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'
import { createServer } from 'http'
import { APP_PREFIX, MONGO_URI, SERVER_URL, BACKEND_PORT } from '../const.js'
import notes from './notes/notes.js'
import users from './users/users.js'
import upload from './notes/upload.js'
import pomodoro from './pomodoro/pomodoro.js'
import todo from './todo/todo.js'
import groups from './groups/groups.js'
import chat, { initializeSocket } from './chat/messages.js'

import fs from 'fs'
import path from 'path'

const __dirname = process.cwd()

export let connected = {}
const app = express()
const server = createServer(app)

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/api', notes)
app.use('/api', users)
app.use('/api', upload)
app.use('/api', todo)
app.use('/api', pomodoro)
app.use('/api', groups)
app.use('/chat', chat)
app.use('/uploads', express.static('uploads'))

if (process.env.NODE_ENV !== 'development') app.use(express.static(`${APP_PREFIX}/dist`))

initializeSocket(server)

server.listen(BACKEND_PORT, () => {
  console.log(`Server running at ${SERVER_URL}`)
})

app.all('*', (req, res) => {
 fs.readFile(path.join(__dirname, `${APP_PREFIX}/dist/index.html`), function (err, data) {
    if (err) {
      console.error(err)
      res.redirect('/')
      res.status(500).send()
      return
    }

    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(data, 'utf-8')
  })
})

/**
 * Create a new mongodb collection
 */
app.get(SERVER_URL + '/create', async (req, res) => {
  const { dbName } = req.body
  try {
    const result = await create(dbName)
    res.status(200).send(result)
  } catch (err) {
    res.status(500).send(err.message)
  }
})

/**
 * Connect to a dbName collection into the database "selfie"
 *
 * @param {*} dbName collection name to connect to
 */
export async function connect(dbName) {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    console.log('MongoDB Connected to ' + dbName + ' ...')
    connected[dbName] = true
  } catch (err) {
    console.error(err)
    connected[dbName] = false
  }
}

/**
 * Searching documents from a collection
 *
 * @param dbName collection name
 */
async function search(dbName) {
  console.log('Getting docs from ' + dbName + ' ...')
  if (!connected[dbName]) await connect(dbName)
  else mongoose.create(dbName)
  return mongoose.model(dbName).find()
}

/**
 * Removing documents from a collection by ID
 */
app.post('/api/delete', async (req, res) => {
  const { collection, id } = req.body
  try {
    await mongoose.model(collection).findByIdAndDelete(id)
    res.status(200).send('Document deleted from ' + collection)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * Disconnect from MongoDB
 *
 * @param {*} dbName
 */
async function disconnect(dbName) {
  try {
    await mongoose.disconnect()
    console.log('MongoDB Disconnected from ' + dbName + ' ...')
    connected[dbName] = false
  } catch (err) {
    console.log(err)
  }
}
