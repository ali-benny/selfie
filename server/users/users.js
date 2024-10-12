import express from 'express'
import mongoose from 'mongoose'
import { connect } from '../app.js'

const app = express()

/*
 * Schema della collection 'users'
 */
const UsersSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }
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
 * Edits the properties of the user specified
 */
app.patch('/users/:id', async (req, res) => {
  const id = req.params.id
  try {
    await Users.findByIdAndUpdate(id, { $set: req.body })

    res.status(200).send('User updated successfully!')
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
    // TODO: fare dei check sul nome? niente cifre, o caratteri speciali?
    const user = new Users({ name: req.body.name })
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

export default app
