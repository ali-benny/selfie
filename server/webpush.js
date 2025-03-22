import express from 'express'
import webPush from 'web-push'
import { SERVER_URL } from '../const.js'
import { sendNotification } from './notifications.js'

import fs from 'fs'
import 'dotenv/config'
import mongoose from 'mongoose'

// Se chiavi non presenti le genero e salvo in development, e loggo errore in prod
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  if (process.env.NODE_ENV === 'development') {
    const { publicKey, privateKey } = webPush.generateVAPIDKeys()
    fs.appendFile(
      '.env',
      `VAPID_PUBLIC_KEY=${publicKey}\nVAPID_PRIVATE_KEY=${privateKey}`,
      (err) => {
        if (err) throw err
      }
    )
    process.env.VAPID_PUBLIC_KEY = publicKey
    process.env.VAPID_PRIVATE_KEY = privateKey
  } else {
    console.error('server/webpush.js - vapid keys not available in production!!!')
  }
}

const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env

webPush.setVapidDetails(
  !process.env.NODE_ENV || process.env.NODE_ENV === 'development'
    ? 'mailto:foo@bar.com'
    : SERVER_URL,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
)

const WebPushSubscriptionSchema = new mongoose.Schema({
  user: mongoose.ObjectId,
  endpoint: { type: String, unique: true },
  keys: {
    p256dh: { type: String },
    auth: { type: String }
  }
})

const WebPushSubscription = mongoose.model('webPushSubscription', WebPushSubscriptionSchema)

const app = express()

app.get('/webpush/vapidPublicKey', (req, res) => {
  res.status(200).send(VAPID_PUBLIC_KEY)
})

app.post('/webpush/:user/register', async (req, res) => {
  try {
    WebPushSubscription.findOne({ endpoint: req.body.endpoint }).then(async (doc) => {
      if (!doc) {
        const subscription = new WebPushSubscription({
          user: req.params.user,
          endpoint: req.body.endpoint,
          keys: req.body.keys
        })
        await subscription.save()
      }
    })

    res.status(200).end()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.post('/webpush/:user/notification', async (req, res) => {
  try {
    sendNotification(req.params.user, req.body.options)

    res.status(200).send()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.get('/webpush/:user/subscriptions', async (req, res) => {
  try {
    res.status(200).json(await loadWebPushSubscriptions(req.params.user))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * Loads all Web Push Subscriptions associated with the given user.
 * @param {String} user - The ID of the user
 * @returns {Promise<Array>} Promise resolving to array of subscription documents
 */
export async function loadWebPushSubscriptions(user) {
  return WebPushSubscription.find({ user: user }).exec()
}

export default app
