console.log('hello from service worker')

self.addEventListener('push', (e) => {
  const options = e.data.json().options
  e.waitUntil(
    (async () => {
      self.clients.matchAll({ includeUncontrolled: true }).then((windows) => {
        const window = windows.find((w) => w.focused) || windows[0]
        window?.postMessage({
          type: 'newNotification',
          notification: options.data.notification
        })
      })
    })()
  )
  if (Notification.permission === 'granted') {
    self.registration.showNotification('Selfie', options)
  }
})
