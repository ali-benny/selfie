import express from 'express'
import mongoose from 'mongoose'
import bodyParser from 'body-parser'
import { connect } from '../app.js'
import { sendNotification as sendPushNotification } from '../notifications.js'
import { PomodoroConfigSchema } from '../pomodoro/pomodoro.js'
import { loadUsernameById } from '../users/users.js'

const NotificationKind = Object.freeze({
  INVITATION: 'invitation',
  CHAT: 'chat',
  ALERT: 'alert'
})

const InvitationKind = Object.freeze({
  GROUP: 'group',
  NOTE: 'note',
  POMODORO: 'pomodoro'
})

const NotificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.ObjectId,
      ref: 'user',
      required: true
    },
    created: {
      type: Date,
      required: true
    }
  },
  { discriminatorKey: 'kind' }
)

const Notification = mongoose.model('notification', NotificationSchema)

const AlertNotification = Notification.discriminator(
  NotificationKind.ALERT,
  new mongoose.Schema({
    content: {
      type: String,
      required: true
    }
  })
)

const ChatNotification = Notification.discriminator(
  NotificationKind.CHAT,
  new mongoose.Schema({
    sender: {
      id: {
        type: mongoose.ObjectId,
        ref: 'user',
        required: true
      },
      username: {
        type: String,
        require: true
      }
    },
    message: {
      type: String,
      required: true
    }
  })
)

const InvitationSchema = new mongoose.Schema({
  invitation: {
    type: new mongoose.Schema({}, { discriminatorKey: 'kind' }),
    required: true
  },
  sender: {
    id: {
      type: mongoose.ObjectId,
      ref: 'user',
      required: true
    },
    username: {
      type: String,
      require: true
    }
  }
})

InvitationSchema.path('invitation').discriminator(
  InvitationKind.POMODORO,
  new mongoose.Schema({
    pomodoro: {
      type: PomodoroConfigSchema
    }
  })
)

const InvitationNotification = Notification.discriminator(
  NotificationKind.INVITATION,
  InvitationSchema
)

const app = express()
app.use(bodyParser.json())
app.on('mount', async () => {
  await connect('notification')
})

app.get('/:user/notifications', async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.params.user }).sort({
      created: -1
    })
    res.status(200).json(notifications)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.post('/:user/notifications', async (req, res) => {
  try {
    const user = req.params.user
    const created = req.body.created
    const kind = req.body.kind
    const sender = req.body.sender
      ? {
          id: req.body.sender,
          username: await loadUsernameById(req.body.sender)
        }
      : {}

    let notification
    switch (kind) {
      case NotificationKind.ALERT:
        notification = new AlertNotification({
          user: user,
          created: created,
          content: req.body.content
        })
        break
      case NotificationKind.CHAT:
        notification = new ChatNotification({
          user: user,
          created: created,
          sender: sender,
          message: req.body.message
        })
        break
      case NotificationKind.INVITATION:
        notification = new InvitationNotification({
          user: user,
          created: created,
          sender: sender
        })
        switch (req.body.invitation.kind) {
          case InvitationKind.NOTE:
          case InvitationKind.GROUP:
            throw new Error('yet to be implemented!')
          case InvitationKind.POMODORO:
            notification.invitation = {
              kind: 'pomodoro',
              pomodoro: {
                ...req.body.invitation.pomodoro
              }
            }
            break
          default:
            throw new Error('Invalid InvitationKind: ' + req.body.invitation.kind)
        }
        break
      default:
        throw new Error('Invalid NotificationKind: ' + kind)
    }

    await notification.save()
    await sendPushNotification(notification.user, notification)
    res.status(200).json(notification)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.delete('/notifications/:id', async (req, res) => {
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
