import express from 'express'
import mongoose from 'mongoose'
import { connected, connect } from '../app.js'

const app = express()

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
  },
  tags: {
    type: Object,
    default: []
  }
})

const Note = mongoose.model('Note', NoteSchema)

/**
 * Save a note to the mongodb into 'notes' collection
 */
app.post('/save', async (req, res) => {
  const { id, filename, data, tags } = req.body
  console.log('Saving: ' + filename)
  if (!connected['note']) await connect('note')
  try {
    const existing_note = await Note.findOne({ _id: id }).lean()
    if (existing_note != null) {
      // i've already this note in mongodb
      await Note.updateOne(
        { _id: id },
        { name: filename, data: data, date: new Date(), tags: tags }
      )
      console.log('Updated!')
    } else {
      const note = new Note({
        name: filename,
        data: data,
        author: 'User',
        tags: tags
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

// Ottieni i tag di una nota specifica
app.get('/:id/tags', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
    if (note == null) {
      return res.status(404).json({ message: 'Note not found' })
    }
    res.json(note.tags)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Aggiungi un tag a una nota esistente
app.post('/:id/tags', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
    if (note == null) {
      return res.status(404).json({ message: 'Note not found' })
    }
    if (!note.tags.includes(req.body.tag)) {
      note.tags.push(req.body.tag)
    }
    await note.save()
    res.status(200).json(note.tags)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// Endpoint per ottenere tutti i tag distinti
app.get('/tags', async (req, res) => {
  try {
    const tags = await Note.distinct('tags', { tags: { $ne: null } }) // Filtra i tag non nulli
    const notEmptyTags = tags.filter((tag) => tag.trim() !== '') // Rimuovi eventuali tag vuoti
    res.json(notEmptyTags)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

/**
 *   ****** UPLOAD IMAGE ******   *
 */

import bodyParser from 'body-parser'
import upload from './upload.js'

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

export default app
