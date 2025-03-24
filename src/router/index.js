import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import NoteList from './note/Notes.vue'
import NoteEditor from './note/editor/NoteEditor.vue'
import UserView from '../views/UserView.vue'
import PomodoroDashboard from './pomodoro/PomodoroDashboard.vue'
import NotificationsDebug from '@/views/NotificationsDebug.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/note',
      name: 'NoteList',
      component: NoteList
    },
    {
      path: '/editor',
      name: 'NoteEditor',
      component: NoteEditor
    },
    {
      path: '/user',
      name: 'user',
      component: UserView
    },
    {
      path: '/pomodoro',
      name: 'pomodoro',
      component: PomodoroDashboard,
      props: true
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/notifications',
      name: 'notifications',
      component: NotificationsDebug
    }
  ]
})

export default router
