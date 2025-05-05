self.addEventListener('push', (event) => {
  let options
  try {
    options = event.data.json().options
    if (!options) {
      console.error('Push data has no options.')
      return
    }
  } catch (error) {
    console.error('Failed to parse push data as JSON:', error)
    return
  }

  const deliverPushNotification = async () => {
    const clientWindows = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' })
    const focused = clientWindows.find((w) => w.focused)
    const targetClient = focused || clientWindows[0]

    targetClient?.postMessage({
      type: 'newNotification',
      notification: options.data,
      isFocused: focused !== undefined
    })

    if (Notification.permission === 'granted' && !focused) {
      self.registration.showNotification('Selfie', options)
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
