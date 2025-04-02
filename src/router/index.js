import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import NoteList from './note/Notes.vue'
import NoteEditor from './note/editor/NoteEditor.vue'
import UserView from '../views/UserView.vue'
import PomodoroDashboard from './pomodoro/PomodoroDashboard.vue'
import GroupDash from './group/GroupDash.vue'
import Chat from '../components/ChatComponent.vue'
import ProjectDash from './project/ProjectDash.vue'

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
      path: '/group',
      name: 'group',
      component: GroupDash
    },
    {
      path: '/chat',
      name: 'chat',
      component: Chat
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
      path: '/projects',
      name: 'projects',
      component: ProjectDash
    }
  ]
})

export default router
