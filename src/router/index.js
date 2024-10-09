import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import PomodoroDashboard from './pomodoro/PomodoroDashboard.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/pomodoro/:id?',
      name: 'pomodoro',
      component: PomodoroDashboard,
      props: true
    }
  ]
})

export default router
