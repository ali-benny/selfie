import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import { MONGO_URI, SERVER_URL, port } from '../../src/const.js';

let connected = {}
const app = express()
app.use(cors())
app.use(express.json())

app.listen(port, () => {
  console.log(`Server running at ${SERVER_URL}`);
});

// Create new collection if not already exist
app.get(SERVER_URL + '/create', async (req, res) => {
  const { dbName } = req.body
  try {
    const result = await create(dbName)
    res.status(200).send(result)
  } catch (err) {
    res.status(500).send(err.message)
  }
})

// Get all documents
app.get('/find', async (req, res) => {
  try {
    if (!connected['note']) await connect('note');
    const notes = await Note.find();
    res.status(200).json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


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

// Save a note to the database
app.post('/save', async (req, res) => {
  const { filename, data } = req.body
  console.log('Saving: ' + filename)
  
  if (!connected['note']) await connect('note')
  try {
    if (await Note.findOne({ name: filename })) {
      // i've already this note in mongodb
      await Note.updateOne({ name: filename }, { data: data, date: new Date() })
      console.log('Updated!')
    } else {
      const note = new Note({
        name: filename,
        data: data,
        author: 'User'
      }) // TODO: get user from session
      // Note.create(note)
      const resp = await note.save();
      console.log('Saved!')
    }
    res.status(200).send('Note saved successfully')
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

async function search(dbName) {
  console.log('Getting docs from ' + dbName + ' ...')
  if (!connected[dbName]) await connect(dbName)
  else mongoose.create(dbName)
  return mongoose.model(dbName).find()
}

async function disconnect(dbName) {
  try {
    await mongoose.disconnect()
    console.log('MongoDB Disconnected from ' + dbName + ' ...')
    connected[dbName] = false
  } catch (err) {
    console.log(err)
  }
}
