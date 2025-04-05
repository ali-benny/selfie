import 'jquery'
import '../const.js'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import vuetify from './plugins/vuetify'
import Popper from 'vue3-popper'
import { Icon } from '@iconify/vue'
import { Transition } from 'vue'
import ganttastic from '@infectoone/vue-ganttastic'

import App from './App.vue'
import router from './router'
import './assets/main.css'

import { createNotivue } from 'notivue'
import 'notivue/notification.css' // Only needed if using built-in notifications
import 'notivue/animations.css' // Only needed if using built-in animations

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
app.use(ganttastic)
app.component('Popper', Popper)
app.component('Icon', Icon)
app.component('Transition', Transition)
app.mount('#app')
