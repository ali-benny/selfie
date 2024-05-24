import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import NoteList from './note/Notes.vue'
import NoteEditor from './note/editor/NoteEditor.vue'
import UserView from '../views/UserView.vue'
import PomodoroTimer from './pomodoro/PomodoroTimer.vue'

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
      path: '/pomodoro/:id?',
      name: 'pomodoro',
      component: PomodoroTimer,
      props: true
    }
  ]
})

export default router
