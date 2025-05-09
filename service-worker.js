self.addEventListener('push', (event) => {
  let notification

  try {
    notification = event.data.json().notification
    if (!notification) throw new Error('Push data has no payload.')
  } catch (error) {
    console.error(error)
    return
  }

  const deliverPushNotification = async () => {
    const clientWindows = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' })
    const focused = clientWindows.find((w) => w.focused)
    const targetClient = focused || clientWindows[0]

    targetClient?.postMessage({
      type: 'pushNotification',
      notification: notification,
      isFocused: focused !== undefined
    })

    if (Notification.permission === 'granted' && !focused) {
      self.registration.showNotification(notificationTitle(notification), {
        body: notificationBody(notification)
      })
    }
  }

  event.waitUntil(deliverPushNotification())
})

self.addEventListener('notificationclick', (event) => {
  const notification = event.notification
  notification.close()

  const openNotificationWindow = async () => {
    await self.clients
      .matchAll({ includeUncontrolled: true, type: 'window' })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) return client.focus()
        }

        if (self.clients.openWindow) return self.clients.openWindow('/')
      })
  }

  event.waitUntil(openNotificationWindow())
})

function notificationTitle(notification) {
  switch (notification.kind) {
    case 'chat':
      return `Message from ${notification.sender.username}`
    case 'invitation': {
      switch (notification.invitation.kind) {
        case 'pomodoro':
          return 'A Pomodoro invitation for you!'
        default:
          throw new Error('Invalid invitation kind: ' + notification.invitation.kind)
      }
    }
    default:
      throw new Error('Invalid notification kind: ' + notification.kind)
  }
}

function notificationBody(notification) {
  switch (notification.kind) {
    case 'chat':
      return notification.message
    case 'invitation': {
      switch (notification.invitation.kind) {
        case 'pomodoro':
          return `${notification.sender.username} wants to share a Pomodoro with you.`
        default:
          throw new Error('Invalid invitation kind: ' + notification.invitation.kind)
      }
    }
    default:
      throw new Error('Invalid notification kind: ' + notification.kind)
  }
}
