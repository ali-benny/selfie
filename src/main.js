import './assets/main.css'
import 'bootstrap/dist/css/bootstrap.css'
import 'jquery'
import 'bootstrap'
import '../const.js'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import vuetify from './plugins/vuetify'

import App from './App.vue'
import router from './router'

const app = createApp(App)

import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
const options = {
  // You can set your default options here
}

app.use(Toast, options)

app.use(createPinia())
app.use(router)
app.use(vuetify)
app.mount('#app')
