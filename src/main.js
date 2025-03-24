import 'jquery'
import '../const.js'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import vuetify from './plugins/vuetify'
import Popper from 'vue3-popper'
import { Icon } from '@iconify/vue'
import { Transition } from 'vue'

import App from './App.vue'
import router from './router'
import './assets/main.css'

import { createNotivue } from 'notivue'
import 'notivue/notification.css' // Only needed if using built-in notifications
import 'notivue/animations.css' // Only needed if using built-in animations
import { API_URL } from '../const.js'
import { useUserStore } from './stores/account.js'

const app = createApp(App)
const notivue = createNotivue({
  position: 'bottom-right',
  enqueue: true,
  limit: 4,
  notifications: {
    global: {
      duration: 3000
    }
  }
})
app.use(notivue)
app.use(createPinia())
app.use(vuetify)
app.use(router)
app.component('Popper', Popper)
app.component('Icon', Icon)
app.component('Transition', Transition)
app.mount('#app')

// From https://github.com/mdn/serviceworker-cookbook
// This function is needed because Chrome doesn't accept a base64 encoded string
// as value for applicationServerKey in pushManager.subscribe yet
// https://bugs.chromium.org/p/chromium/issues/detail?id=802280
function urlBase64ToUint8Array(base64String) {
  var padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  var rawData = window.atob(base64)
  var outputArray = new Uint8Array(rawData.length)

  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/service-worker.js')
    .then(async (registration) => {
      const response = await fetch(API_URL + '/webpush/vapidPublicKey')
      if (!response.ok) console.error('invalid vapid public key request')

      const convertedVapidKey = urlBase64ToUint8Array(await response.text())

      return registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      })
    })
    .then(async (subscription) => {
      const response = await fetch(
        API_URL + `/webpush/${useUserStore().loggedUser._id}/subscribe`,
        {
          method: 'POST',
          headers: {
            'Content-type': 'application/json'
          },
          body: JSON.stringify(subscription)
        }
      )

      if (!response.ok) {
        throw new Error(`ERROR - service worker registration, response status ${response.status}`)
      }
    })
}
