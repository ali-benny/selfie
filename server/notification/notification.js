import express from 'express'
import mongoose, { SchemaTypes } from 'mongoose'
import bodyParser from 'body-parser'
import { connect } from '../app.js'
import { sendNotification as sendPushNotification } from '../notifications.js'

const NotificationType = Object.freeze({
  SYSTEM: 'system',
  INVITE: 'invite',
  CHAT: 'chat',
  ALERT: 'alert',
  values() {
    return Object.values(this)
  }
})

const EntityType = Object.freeze({
  GROUP: 'group',
  NOTE: 'note',
  POMODORO_CONFIG: 'pomodoroConfig',
  values() {
    return Object.values(this)
  }
})

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.ObjectId,
    ref: 'user',
    required: true
  },
  type: {
    type: String,
    enum: NotificationType.values(),
    required: true
  },
  content: {
    type: String,
    required: true
  },
  entityType: {
    type: String,
    enum: EntityType.values(),
    required: function () {
      return this.type === NotificationType.invite
    }
  },
  entity: {
    type: SchemaTypes.ObjectId,
    refPath: 'entityType',
    required: function () {
      return this.type === NotificationType.invite
    }
  },
  created: {
    type: Date,
    required: true
  }
})

const Notification = mongoose.model('notification', NotificationSchema)

const app = express()
app.use(bodyParser.json())
app.on('mount', async () => {
  await connect('notification')
})

app.get('/:user/notifications', async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.params.user }).sort({ created: -1 })
    res.status(200).json(notifications)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.post('/:user/notification', async (req, res) => {
  try {
    const notification = new Notification({
      user: req.params.user,
      type: req.body.type,
      content: req.body.content,
      created: req.body.created
    })
    if (notification.type === NotificationType.INVITE) {
      notification.entityType = req.body.entityType
      notification.entity = req.body.entity
    }
    await notification.save()

    await sendPushNotification(notification.user, {
      title: 'selfie',
      body: notification.content,
      data: {
        notification: notification
      }
    })

    res.status(200).json(notification)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.delete('/notification/:id', async (req, res) => {
  const id = req.params.id
  try {
    await Notification.deleteOne({ _id: id }).then(() => {
      res.status(200).send('Notification deleted successfully!')
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

export default app
