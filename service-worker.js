console.log('hello from service worker')

self.addEventListener('push', (e) => {
  if (Notification.permission === 'granted') {
    const options = e.data.json().options
    console.log('options', options)
    self.registration.showNotification('Selfie', options)
  }
})
