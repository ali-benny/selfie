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
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import './assets/main.css'

const app = createApp(App)

const options = {
  // You can set your default options here
}

app.use(Toast, options)

app.use(createPinia())
app.use(router)
app.use(vuetify)
app.component('Popper', Popper)
app.component('Icon', Icon)
app.component('Transition', Transition)
app.mount('#app')
