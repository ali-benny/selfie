import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'
import { MONGO_URI, SERVER_URL, PORT } from '../const.js'
import notes from './notes/notes.js'
import users from './users/users.js'
import upload from './notes/upload.js'
import pomodoro from './pomodoro/pomodoro.js'
import todo from './todo/todo.js'
import groups from './groups/groups.js'

import fs from 'fs'
import path from 'path'

const __dirname = process.cwd()

export let connected = {}
const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/api', notes)
app.use('/api', users)
app.use('/api', upload)
app.use('/uploads', express.static('uploads'))
app.use('/api', todo)
app.use('/api', pomodoro)
app.use('/api', groups)

app.listen(PORT, () => {
  console.log(`Server running at ${SERVER_URL}`)
})

app.all('*', (res, req, next) => {
  // TODO: require autentication
  next()
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
    console.log(err)
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

app.get('/static/:file', async (req, res) => {
  fs.readFile(path.join(__dirname, 'dist/static/', req.params.file), (err, data) => {
    if (err) {
      console.log(err)
      res.redirect('/')
      return
    }
    var extname = path.extname(req.params.file)
    var contentType = 'text/html'
    switch (extname) {
      case '.js':
        contentType = 'text/javascript'
        break
      case '.css':
        contentType = 'text/css'
        break
      case '.json':
        contentType = 'application/json'
        break
      case '.png':
        contentType = 'image/png'
        break
      case '.jpg':
        contentType = 'image/jpg'
        break
      case '.wav':
        contentType = 'audio/wav'
        break
    }
    res.writeHead(200, { 'Content-Type': contentType })
    res.end(data, 'utf-8')
  })
})

app.get('/*/', async (req, res) => {
  fs.readFile(path.join(__dirname, 'dist/index.html'), function (err, data) {
    if (err) {
      console.error(err)
      res.redirect('/')
      // res.status(500).send()
      return
    }

    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(data, 'utf-8')
  })
})
