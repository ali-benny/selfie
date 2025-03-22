import { flavors } from '@catppuccin/palette'
import express from 'express'
import mongoose from 'mongoose'
import { connect } from '../app.js'

import bodyParser from 'body-parser'

const app = express()

const LongBreakSchema = new mongoose.Schema(
  {
    time: {
      type: Number,
      required: true
    },
    interval: {
      type: Number,
      required: true
    }
  },
  { _id: false }
)

/*
 * Schema della collection che mantiene le configurazioni dei timer pomodoro.
 * Ogni pomodoro ha una configurazione che specifica i parametri dello stesso (durata dello studio,
 * durata della pausa, quanti cicli fare...). Una configurazione può essere condivisa tra più timer
 * pomodoro sei parametri sono gli stessi
 */
const PomodoroConfigSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  userId: mongoose.ObjectId,
  pomodoroTime: {
    type: Number,
    required: true
  },
  shortBreakTime: {
    type: Number,
    required: true
  },
  longBreak: {
    type: LongBreakSchema,
    required: false
  },
  cycles: {
    type: Number
  },
  lastUsed: {
    type: Date,
    default: null
  },
  color: {
    type: Object,
    default: {
      name: flavors.macchiato.colors.mauve.name,
      hex: flavors.macchiato.colors.mauve.hex
    }
  }
})

const PomodoroConfig = mongoose.model('pomodoroConfig', PomodoroConfigSchema)

app.use(bodyParser.json())
app.on('mount', async () => {
  await connect('pomodoroConfig')
})

/*
 * Returns the Configs of pomodoros
 */
app.get('/:userId/pomodoros/configs', async (req, res) => {
  try {
    const configs = await PomodoroConfig.find({ userId: req.params.userId })
    res.status(200).json(configs)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

/*
 * Creates a new config
 */
app.post('/:userId/pomodoros/configs/', async (req, res) => {
  try {
    const config = new PomodoroConfig({ userId: req.params.userId, ...req.body })
    config.lastUsed = Date.now()
    await config.save()

    res.status(200).json(config)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

/*
 * Edits the properties of the Config specified
 */
app.patch('/pomodoros/configs/:id', async (req, res) => {
  const id = req.params.id
  try {
    const config = await PomodoroConfig.findById(id)
    config.name = req.body.name
    config.pomodoroTime = req.body.pomodoroTime
    config.breakTime = req.body.breakTime
    config.cycles = req.body.cycles
    config.longBreak = req.body.longBreak
    config.color = req.body.color
    config.lastUsed = req.body.lastUsed
    config.save()
    res.status(200).send('Config updated successfully!')
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

/*
 * Deletes the specified Config
 */
app.delete('/pomodoros/configs/:id', async (req, res) => {
  const id = req.params.id
  try {
    await PomodoroConfig.deleteOne({ _id: id }).then(() => {
      res.status(200).send('Config deleted successfully!')
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

/*
 * Returns the lastUsed PomodoroConfig
 */
app.get('/:userId/pomodoros/configs/latest', async (req, res) => {
  try {
    const config = await PomodoroConfig.findOne({ userId: req.params.userId }).sort({
      lastUsed: -1
    })

    res.status(200).json(config)
  } catch (err) {
    console.error(err)
    console.log('error occurred')
    res.status(500).json({ error: err.message })
  }
})

export default app
