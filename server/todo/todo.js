import express from 'express'
import mongoose from 'mongoose'
import { connected, connect } from '../app.js'

const app = express()
app.use(express.json())

const TodoSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  checked: {
    type: Boolean,
    required: true,
    default: false
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
  from: {
    type: {
      id: String,
      type: String
    },
    default: []
  }
})

const Todo = mongoose.model('Todo', TodoSchema)

// Create new Todo
app.post('/todo', async (req, res) => {
  try {
    const todo = new Todo({
      text: req.body.text,
      checked: req.body.checked,
      author: req.body.author,
      readers: req.body.readers,
      from: req.body.from
    })
    const savedTodo = await todo.save()
    res.status(201).json(savedTodo)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// Get all Todos
app.get('/todo', async (req, res) => {
  try {
    const todos = await Todo.find()
    res.status(200).json(todos)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get a Todo by _id
app.get('/todo/:id', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id)
    if (todo == null) {
      return res.status(404).json({ message: 'Todo not found' })
    }
    res.status(200).json(todo)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Update Todo by _id
app.patch('/todo/:id', async (req, res) => {
  try {
    const updatedTodo = await Todo.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (updatedTodo == null) {
      return res.status(404).json({ message: 'Todo not found' })
    }
    res.status(200).json(updatedTodo)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// Remove Todo by _id
app.delete('/todo/:id', async (req, res) => {
  try {
    const deletedTodo = await Todo.findByIdAndDelete(req.params.id)
    if (deletedTodo == null) {
      return res.status(404).json({ message: 'Todo not found' })
    }
    res.status(200).json({ message: 'Todo deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default app
