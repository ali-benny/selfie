self.addEventListener('push', async (e) => {
  /* se trova una pagina di 'Selfie' focused, allora inoltra la notifica
   * all'app che la mostra come toast, altrimenti manda proprio la notifica browser
   */
  const deliverPushNotification = async () => {
    const options = e.data.json().options
    const isFocused = await self.clients
      .matchAll({ includeUncontrolled: true })
      .then((windows) => windows.some((w) => w.focused))

    await self.clients.matchAll({ includeUncontrolled: true }).then((windows) => {
      const focused_window = windows.find((w) => w.focused)
      const window = focused_window || windows[0]
      window?.postMessage({
        type: 'newNotification',
        notification: options.data.notification,
        isFocused: isFocused
      })
    })

    if (Notification.permission === 'granted' && !isFocused) {
      self.registration.showNotification('Selfie', options)
    }
  }

  e.waitUntil(deliverPushNotification())
})
