import express from 'express'
import mongoose from 'mongoose'
import { connect } from '../app.js'
import { createAvatar } from '@dicebear/core'
import { adventurer } from '@dicebear/collection'
import bcrypt from 'bcryptjs'

const app = express()

/*
 * Schema della collection 'users'
 */
const UsersSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  surname: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: ''
  },
  logged: {
    type: Boolean,
    default: false
  },
  birthday: {
    type: Date,
    default: Date.now
  },
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    default: '',
    required: true
  },
  groups: {
    type: Object,
    default: []
  }
})

// Middleware per generare un avatar prima di salvare un nuovo utente
UsersSchema.pre('save', function (next) {
  if (this.isNew) {
    const avatar = createAvatar(adventurer, {
      seed: Math.random().toString(36).substring(7)
    }).toDataUri()
    this.image = avatar
  }
  next()
})

const Users = mongoose.model('user', UsersSchema)

app.on('mount', async () => {
  await connect('user')
})

/*
 * Returns the Users collection
 */
app.get('/users', async (req, res) => {
  try {
    const users = await Users.find()
    res.status(200).json(users)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

/*
 * Return the user id information
 */
app.get('/users/:id', async (req, res) => {
  try {
    const id = req.params.id
    const user = await Users.findById(id)
    res.status(200).json(user)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

/*
 * Edits the properties of the user specified
 */
app.patch('/users/:id', async (req, res) => {
  const id = req.params.id
  const updates = req.body

  try {
    if (updates.password) {
      const salt = bcrypt.genSaltSync(10)
      updates.password = bcrypt.hashSync(updates.password, salt)
    }

    const updatedUser = await Users.findByIdAndUpdate(id, { $set: updates })
    res.status(200).json(updatedUser)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

/*
 * Updates the user's profile image
 */
app.patch('/users/:id/image', async (req, res) => {
  const id = req.params.id
  const { image } = req.body
  try {
    await Users.findByIdAndUpdate(id, { $set: { image: image } })
    res.status(200).send('User image updated successfully!')
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

/*
 * Creates a new User
 */
app.post('/users', async (req, res) => {
  try {
    const user = new Users({
      name: req.body.name,
      surname: req.body.surname,
      birthday: req.body.birthday,
      username: req.body.username,
      password: req.body.password
    })
    await user.save()

    res.status(200).json(user)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

/*
 * Deletes the specified User
 */
app.delete('/users/:id', async (req, res) => {
  const id = req.params.id
  try {
    await Users.deleteOne({ _id: id }).then(() => {
      res.status(200).send('User deleted successfully!')
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

/*
 * Updates the logged user
 */
app.patch('/users/logged/:id', async (req, res) => {
  const id = req.params.id
  try {
    const user = await Users.findById(id)
    const passwordMatch = bcrypt.compareSync(req.body.password, user.password)
    if (!passwordMatch) {
      return res.status(401).send('Password incorrect!')
    }
    await Users.updateOne({ _id: id }, { $set: { logged: true } })

    res.status(200).send('User logged successfully!')
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

export default app
