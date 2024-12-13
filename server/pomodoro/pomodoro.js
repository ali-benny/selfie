import { flavors } from '@catppuccin/palette'
import express from 'express'
import mongoose from 'mongoose'
import { connect } from '../app.js'

const app = express()

const LongBreakSchema = new mongoose.Schema({
  time: {
    type: Number,
    required: true
  },
  interval: {
    type: Number,
    required: true
  }
})

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

/*
 * Schema della collection che mantiene lo stato dei diversi timer Pomodoro.
 * Ogni Pomodoro è composto dalla configurazione e dal suo stato. Ogni utente può avere al massimo
 * un timer Pomodoro attivo.
 */
const PomodoroSchema = new mongoose.Schema({
  config: PomodoroConfigSchema,
  userId: mongoose.ObjectId,
  initialTimer: {
    type: Number
  },
  timer: {
    type: Number
  },
  phase: {
    type: String,
    enum: ['pomodoro', 'break']
  },
  cycle: {
    type: Number
  },
  running: {
    type: Boolean
  },
  started: {
    type: Boolean,
    default: false,
    required: true
  }
})

const PomodoroConfig = mongoose.model('pomodoroConfig', PomodoroConfigSchema)
const Pomodoro = mongoose.model('pomodoro', PomodoroSchema)

app.on('mount', async () => {
  await connect('pomodoroConfig')
})

/*
 * Returns all the Pomodoros of the user specified
 */
app.get('/:userId/pomodoros', async (req, res) => {
  try {
    const pomodoro = await Pomodoro.findOne({ userId: req.params.userId })
    res.status(200).json(pomodoro)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

/*
 * Edits the properties of the Pomodoro specified
 */
app.patch('/pomodoros/:id', async (req, res) => {
  const id = req.params.id
  try {
    await Pomodoro.findByIdAndUpdate(id, { $set: req.body })
    res.status(200).send('Pomodoro updated successfully!')
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

/*
 * Creates a new Pomodoro
 */
app.post('/:userId/pomodoros', async (req, res) => {
  try {
    /* Recupero la config del nuovo pomodoro: se viene passato anche il campo _id, allora
     * la config è già presente nel db e la carico, altrimenti ne creo una nuova
     */
    let config
    if (req.body.config._id) {
      config = await PomodoroConfig.findById(req.body.config._id)
    } else {
      config = new PomodoroConfig({ ...req.body.config })
    }
    config.lastUsed = Date.now()
    await config.save()

    const pomodoro = new Pomodoro({ config: config, userId: req.params.userId })
    await pomodoro.save()

    res.json(pomodoro)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

/*
 * Deletes the specified Pomodoro
 */
app.delete('/pomodoros/:id', async (req, res) => {
  const id = req.params.id
  try {
    await Pomodoro.deleteOne({ _id: id }).then(() => {
      res.status(200).send('Pomodoro deleted successfully!')
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

/*
 * Returns the Configs of pomodoros
 */
app.get('/:userId/pomodoros/configs', async (req, res) => {
  try {
    // if (req.query.sort) {
    //   const split = req.query.sort.split(',')
    //   const sort = split[0]
    //   const order = split[1]
    //   if (!(sort in PomodoroConfigSchema.paths)) {
    //     throw Error('Invalid sort param: ' + sort + ' not in PomodoroConfigSchema')
    //   }
    //   if (!['-1', '1'].includes(order)) {
    //     throw Error('Invalid sort param: ' + order + ' not a valid order')
    //   }

    //   const configs = await PomodoroConfig.find({ userId: req.params.userId }).sort({
    //     [sort]: order
    //   })
    //   res.status(200).json(configs)
    // } else {
    const configs = await PomodoroConfig.find({ userId: req.params.userId })
    res.status(200).json(configs)
    // }
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
    await PomodoroConfig.findByIdAndUpdate(id, { $set: req.body })
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
    res.status(500).json({ error: err.message })
  }
})

export default app
