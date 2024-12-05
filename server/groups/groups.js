import express from 'express'
import mongoose from 'mongoose'
import { connect } from '../app.js'

const app = express()

const GroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  owner: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  members: {
    type: [String]
  }
})

const Group = mongoose.model('group', GroupSchema)

app.on('mount', async () => {
	await connect('group')
})

/**
 * Create a group
 */
app.post('/group', async (req, res) => {
	const group = new Group(req.body)
	try {
		await group.save()
		res.status(201)
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: err.message })
	}
})

/**
 * Get all groups for a userId
 * 
 * @returns {Array} - Array of groups where userId is a member or owner
 */
app.get('/:userid/groups', async (req, res) => {
	const userId = req.params.userid
	try {
		const groups = await Group.find({ $or: [{ owner: userId }, { members: userId }] })
		res.status(200).json(groups)
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: err.message })
	}
})

/**
 * Get a group by id
 */
app.get('/group/:id', async (req, res) => {
	const id = req.params.id
	try {
		const group = await Group.findById(id)
		res.status(200).json(group)
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: err.message })
	}
})

/**
 * Update a group by id
 */
app.patch('/group/:id', async (req, res) => {
	const id = req.params.id
	try {
		await Group.findByIdAndUpdate(id, { $set: req.body })
		res.status(200).send('Group updated successfully!')
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: err.message })
	}
})

/**
 * Delete a group by id
 */
app.delete('/group/:id', async (req, res) => {
	const id = req.params.id
	try {
		await Group.findByIdAndDelete(id)
		res.status(200).send('Group deleted successfully!')
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: err.message })
	}
})

export default app