import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'
import { MONGO_URI, SERVER_URL, PORT } from '../../src/const.js'

let connected = {}
const app = express()
app.use(cors())
app.use(express.json())

app.listen(PORT, () => {
  console.log(`Server running at ${SERVER_URL}`)
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
 * From 'notes' collection get all documents
 */
app.get('/find', async (req, res) => {
  try {
    if (!connected['note']) await connect('note')
    const notes = await Note.find()
    res.status(200).json(notes)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Search by id and return a document
/**
 * From 'notes' collection get documents based on Query ['id']
 */
app.post('/search', async (req, res) => {
  const { query } = req.body
  let id = new mongoose.Types.ObjectId(query) // needed to convert string into mongoose ObjectId
  try {
    if (!connected['note']) await connect('note')
    const notes = await Note.findOne({ _id: id })
    res.status(200).json(notes)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * Connect to a dbName collection into the database "selfie"
 *
 * @param {*} dbName collection name to connect to
 */
async function connect(dbName) {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    console.log('MongoDB Connected to ' + dbName + ' ...')
    connected[dbName] = true
  } catch (err) {
    console.log(err)
    connected[dbName] = false
  }
}

const NoteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  data: {
    type: Object,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  author: {
    type: String,
    required: true
  },
  readers: {
    type: Array,
    default: []
  }
})

const Note = mongoose.model('Note', NoteSchema)

/**
 * Save a note to the mongodb into 'notes' collection
 */
app.post('/save', async (req, res) => {
  const { id, filename, data } = req.body
  console.log('Saving: ' + filename)
  if (!connected['note']) await connect('note')
  try {
    const existing_note = await Note.findOne({ _id: id }).lean()
    if (existing_note != null) {
      // i've already this note in mongodb
      await Note.updateOne({ _id: id }, { name: filename, data: data, date: new Date() })
      console.log('Updated!')
    } else {
      const note = new Note({
        name: filename,
        data: data,
        author: 'User'
      }) // TODO: get user from session
      const resp = await note.save()
      console.log('Saved!')
    }
    res.status(200).send('Note saved successfully')
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

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
app.post('/delete', async (req, res) => {
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

/**
 *   ****** UPLOAD IMAGE ******   *
 */


import bodyParser from 'body-parser'
import upload from '../upload.js'

const ImageSchema = new mongoose.Schema({
  filename: String,
  path: String,
  size: Number,
  mimetype: String
})

const Image = mongoose.model('Image', ImageSchema)

app.use(bodyParser.json())
app.use('/uploads', express.static('uploads'))

app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const newImage = new Image({
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype
    })

    await newImage.save()

    res.json({
      success: 1,
      file: {
        url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
      }
    })
  } catch (error) {
    res.status(500).json({ success: 0, message: 'Upload image error!' })
  }
})
