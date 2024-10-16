import express from 'express'
import mongoose from 'mongoose'
import { connected, connect } from '../app.js'
import bodyParser from 'body-parser'
import upload from './upload.js'

const app = express()

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

const ImageSchema = new mongoose.Schema({
  filename: String,
  path: String,
  size: Number,
  mimetype: String
})

const Image = mongoose.model('Image', ImageSchema)

app.use(bodyParser.json())
app.use('/uploads', express.static('uploads'))

/**
 * Get all notes
 * Find from 'notes' collection get all documents
 */
app.get('/notes', async (req, res) => {
  try {
    if (!connected['note']) await connect('note')
    const notes = await Note.find()
    res.status(200).json(notes)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * Search from 'notes' collection get documents based on Query ['id']
 */
app.post('/notes/:id', async (req, res) => {
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
 * Create a new note
 */
app.post('/notes', async (req, res) => {
  const { filename, data, tags } = req.body
  const note = new Note({
    name: filename,
    data: data,
    author: 'User',
    tags: tags,
  })
  try {
    if (!connected['note']) await connect('note')
    await note.save()
    res.status(201).json(note)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * Get a note by ID
 * Search from 'notes' collection get documents based on Query ['id']
 */
app.get('/notes/:id', async (req, res) => {
  const { id } = req.params
  try {
    if (!connected['note']) await connect('note')
    const note = await Note.findById(id)
    if (note) {
      res.status(200).json(note)
    } else {
      res.status(404).json({ error: 'Note not found' })
    }
  } catch (err) {
    console.error('NOTES/:id | '+err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * Save a note to the mongodb into 'notes' collection
 */
app.put('/notes/:id', async (req, res) => {
  const { id } = req.params
  const { filename, data, tags } = req.body
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

/**
 * Delete a note
 */
app.delete('/notes/:id', async (req, res) => {
  const { id } = req.params
  try {
    if (!connected['note']) await connect('note')
    const note = await Note.findByIdAndDelete(id)
    if (note) {
      res.status(200).json({ message: 'Note deleted successfully' })
    } else {
      res.status(404).json({ error: 'Note not found' })
    }
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * Get tags for a note
 */
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
/**
 * Add tag to a note
 */
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
    const tags = await Note.distinct('tags', { tags: { $ne: null } })
    const notEmptyTags = tags.filter((tag) => tag.trim() !== '')
    res.json(notEmptyTags)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

/**
 *   ****** UPLOAD IMAGE ******   *
 */

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!connected['upload']) await connect('upload')
    const newImage = new Image({
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype
    })

    await newImage.save()

    res.status(200).json({
      success: 1,
      file: {
        url: `/uploads/${req.file.filename}`
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: 0, message: 'Upload error!' })
  }
})

app.post('/upload/image', upload.single('image'), async (req, res) => {
  try {
    if (!connected['image']) await connect('image')
    const newImage = new Image({
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype
    })

    await newImage.save()

    res.status(200).json({
      success: 1,
      file: {
        url: `/uploads/${req.file.filename}`
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: 0, message: 'Upload error!' })
  }
})

/** 
 * Including Block external link url
 */

import * as cheerio from 'cheerio';

app.get('/fetchUrl', async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).json({ success: 0, message: 'URL is required' });
  }

  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    const metadata = {
      success: 1,
      link: url,
      meta: {
        title: $('title').first().text(),
        description: $('meta[name="description"]').attr('content') || '',
        image: {
          url: $('meta[property="og:image"]').attr('content') || ''
        }
      }
    };

    res.json(metadata);
  } catch (error) {
    console.error('Error fetching URL:', error);
    res.status(500).json({ success: 0, message: 'Failed to fetch URL metadata' });
  }
});

export default app
