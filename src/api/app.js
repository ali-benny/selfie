import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'
import { MONGO_URI, SERVER_URL, PORT } from '../cost.js'
import pomodoro from './pomodoro/pomodoro.js'

export let connected = {}

/*
 * TODO: chiedere ad Alice: come gestisco nomi delle collections
 */

const app = express()
app.use(cors())
app.use(express.json())
app.use('/', pomodoro)

app.listen(PORT, () => {
  console.log(`Server running at ${SERVER_URL}`)
})

app.all('*', (res, req, next) => {
  // TODO: require autentication
  next()
})

/**
 * Connect to a dbName collection into the database "selfie"
 *
 * @param {*} dbName collection name to connect to
 */
export async function connect(dbName) {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    console.log('MongoDB Connected to ' + dbName + ' ...')
    connected[dbName] = true
  } catch (err) {
    console.log(err)
    connected[dbName] = false
  }
}

/**
 * Disconnect from MongoDB
 *
 * @param {*} dbName
 */
async function disconnect(dbName) {
  try {
    await mongoose.disconnect()
    console.log('MongoDB Disconnected from ' + dbName + ' ...')
    connected[dbName] = false
  } catch (err) {
    console.log(err)
  }
}
