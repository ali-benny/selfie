import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import NoteList from './note/Notes.vue'
import NoteEditor from './note/editor/NoteEditor.vue'
import UserView from '../views/UserView.vue'
import PomodoroDashboard from './pomodoro/PomodoroDashboard.vue'
import GroupDash from './group/GroupDash.vue'
import Chat from '../components/ChatComponent.vue'
import CalendarMain from '../components/calendar/CalendarMain.vue'
import NotFound from '@/views/NotFound.vue'

const routes = [
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound },
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
    path: '/group',
    name: 'group',
    component: GroupDash
  },
  {
    path: '/chat',
    name: 'chat',
    component: Chat
  },  {
    path: '/pomodoro',
    name: 'Pomodoro',
    component: PomodoroDashboard
  },
  {
    path: '/calendar',
    name: 'calendar',
    component: CalendarMain
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes
})

export default router
