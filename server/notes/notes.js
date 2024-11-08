import express from 'express'
import mongoose from 'mongoose'
import { connected, connect } from '../app.js'
import bodyParser from 'body-parser'

const app = express()

const DirectorySchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  parentDirectory: {
    type: String,
    default: null
  },
  author: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const Directory = mongoose.model('Directory', DirectorySchema)

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
    type: [String],
    default: []
  },
  tags: {
    type: Object,
    default: []
  },
  directory: {
    type: String,
    ref: 'Directory',
    default: 'root'
  }
})

const Note = mongoose.model('Note', NoteSchema)

// const ImageSchema = new mongoose.Schema({
//   filename: String,
//   path: String,
//   size: Number,
//   mimetype: String
// })

// const Image = mongoose.model('Image', ImageSchema)

app.use(bodyParser.json())
app.use('/uploads', express.static('uploads'))

/**
 * Get all notes
 * Find from 'notes' collection get all documents
 */
app.get('/:author/notes', async (req, res) => {
  try {
    if (!connected['note']) await connect('note')
    const author = req.params.author
    // visualizzo anche le note condivise con me
    // TODO: se vogliamo accettare le note che ci condividono bisogna capire come gestire i permessi, attualmente ti inserisce subito nella lista readers
    const notes = await Note.find({
      $or: [{ author: author.toString() }, { readers: author.toString() }],
      function(err, user) {
        if (err) {
          res.send(err)
        }
        console.log(user)
        res.json(user)
      }
    })
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
  const { filename, data, tags, author } = req.body
  const note = new Note({
    name: filename,
    data: data,
    author: author,
    tags: tags
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
    console.error('NOTES/:id | ' + err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * Save a note to the mongodb into 'notes' collection
 */
app.put('/notes/:id', async (req, res) => {
  const { id } = req.params
  const { filename, data, tags, author, readers, directory } = req.body
  console.log('Saving: ' + filename)
  if (!connected['note']) await connect('note')
  try {
    const existing_note = await Note.findOne({ _id: id }).lean()
    if (existing_note != null) {
      // i've already this note in mongodb
      await Note.updateOne(
        { _id: id },
        {
          name: filename,
          data: data,
          date: new Date(),
          tags: tags,
          author: author,
          readers: readers,
          directory: directory
        }
      )
      console.log('Updated!')
    } else {
      const note = new Note({
        name: filename,
        data: data,
        author: author,
        tags: tags,
        readers: readers,
        directory: directory
      })
      await note.save()
      console.log('Saved!')
    }
    res.status(200).json('Note saved successfully')
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

/**
 * Retrieves a list of distinct tags from the Note collection where the user has permissions (author or reader).
 *
 * @constant {Array<string>} tags - An array of unique tags.
 * @async
 * @function
 * @returns {Promise<Array<string>>} A promise that resolves to an array of distinct tags.
 */
app.get('/user/:id/tags', async (req, res) => {
  try {
    const userId = req.params.id
    const notes = await Note.find({
      $or: [{ author: userId }, { readers: { $in: [userId] } }]
    })

    const tags = notes.reduce((acc, note) => {
      if (note.tags) {
        acc.push(...note.tags)
      }
      return acc
    }, [])

    const distinctTags = [...new Set(tags.filter((tag) => tag.trim() !== ''))]
    res.json(distinctTags)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

/**
 * Retrieves directories created by a specific user.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.params - The parameters from the request.
 * @param {string} req.params.userId - The ID of the user whose directories are to be retrieved.
 * @returns {Promise<Array>} A promise that resolves to an array of directories.
 */
app.get('/users/:userId/directories', async (req, res) => {
  try {
    const directories = await Directory.find({ author: req.params.userId })
    res.status(200).json(directories)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * Creates a new Directory object.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.body - The body of the request.
 * @param {string} req.body.id - The unique identifier for the directory.
 * @param {string} req.body.name - The name of the directory.
 * @param {string} req.body.parentDirectory - The ID of the parent directory.
 * @param {string} req.body.author - The author of the directory.
 * @returns {Directory} The newly created Directory object.
 */
app.post('/directories', async (req, res) => {
  try {
    const directory = new Directory({
      _id: req.body.id,
      name: req.body.name,
      parentDirectory: req.body.parentDirectory,
      author: req.body.author
    })
    await directory.save()
    res.status(201).json(directory)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * Get readers from Note by id
 * @returns readers Array [] with ids
 */
app.get('/notes/:id/readers', async (req, res) => {
  const { id } = req.params
  try {
    if (!connected['note']) await connect('note')
    const note = await Note.findById(id)
    if (note) {
      res.status(200).json(note.readers)
    } else {
      res.status(404).json({ error: 'Note not found' })
    }
  } catch (err) {
    console.error('/notes/:id/readers | ' + err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * Get author from Note by id
 * @returns readers Array [] with ids
 */
app.get('/notes/:id/author', async (req, res) => {
  const { id } = req.params
  try {
    if (!connected['note']) await connect('note')
    const note = await Note.findById(id)
    if (note) {
      res.status(200).json(note.author)
    } else {
      res.status(404).json({ error: 'Note not found' })
    }
  } catch (err) {
    console.error('/notes/:id/author | ' + err)
    res.status(500).json({ error: err.message })
  }
})

import * as cheerio from 'cheerio'

/**
 * Including Block external link url
 */
app.get('/fetchUrl', async (req, res) => {
  const url = req.query.url

  if (!url) {
    return res.status(400).json({ success: 0, message: 'URL is required' })
  }

  try {
    const response = await fetch(url)
    const html = await response.text()
    const $ = cheerio.load(html)

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
    }

    res.json(metadata)
  } catch (error) {
    console.error('Error fetching URL:', error)
    res.status(500).json({ success: 0, message: 'Failed to fetch URL metadata' })
  }
})

export default app
