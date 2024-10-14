import express from 'express'
import mongoose from 'mongoose'
import { connect } from '../app.js'

const app = express()

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
  pomodoroTime: {
    type: Number,
    default: 25 * 60,
    required: true
  },
  breakTime: {
    type: Number,
    default: 5 * 60,
    required: true
  },
  cycles: {
    type: Number,
    default: 4,
    required: true
  }
})

/*
 * Schema della collection che mantiene lo stato dei diversi timer Pomodoro.
 * Ogni Pomodoro è composto dalla configurazione e dal suo stato. Ogni utente può avere al massimo
 * un timer Pomodoro attivo.
 */
const PomodoroSchema = new mongoose.Schema({
  config: PomodoroConfigSchema,
  timer: {
    type: Number,
    default: 0,
    required: true
  },
  phase: {
    type: String,
    enum: ['pomodoro', 'break'],
    default: 'pomodoro',
    required: true
  },
  cycle: {
    type: Number,
    default: 1,
    required: true
  },
  running: {
    type: Boolean,
    default: false,
    required: true
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
  await connect('pomodoro')
  await connect('pomodoroConfig')
})

/*
 * Returns the Pomodoro collection
 */
app.get('/pomodoros', async (req, res) => {
  try {
    const pomodoros = await Pomodoro.find()
    res.status(200).json(pomodoros)
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
app.post('/pomodoros', async (req, res) => {
  try {
    /* Recupero la config del nuovo pomodoro: se viene passato anche il campo _id, allora
     * la config è già presente nel db e la carico, altrimenti ne creo una nuova
     */
    let config
    if (req.body.config._id) {
      config = await PomodoroConfig.findById(req.body.config._id)
    } else {
      config = new PomodoroConfig({ ...req.body.config })
      await config.save()
    }

    const pomodoro = new Pomodoro({ config: config })
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
app.get('/pomodoros/configs', async (req, res) => {
  try {
    const configs = await PomodoroConfig.find()
    res.status(200).json(configs)
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

export default app
