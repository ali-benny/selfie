<script setup>
import { provide } from 'vue'
import ChatNotification from './components/notification/ChatNotification.vue'
import PomodoroNotification from './components/notification/PomodoroNotification.vue'
import PomodoroTimerWidget from './components/pomodoro/PomodoroTimerWidget.vue'
import { useUserStore } from './stores/account'
import { usePomodoroStore } from './stores/pomodoro'
import { Notivue, Notification, NotivueSwipe } from 'notivue'

const userStore = useUserStore()
const pomodoroStore = usePomodoroStore()

provide('notification.viewMode', 'notivue')

function notificationComponent(item) {
  const notification = item.props.notification

  if (!notification) return Notification

  switch (notification.kind) {
    case 'chat':
      return ChatNotification
    case 'invitation': {
      switch (notification.invitation.kind) {
        case 'pomodoro':
          return PomodoroNotification
        case 'groups':
        case 'note':
          throw new Error('Not implemented yet')
        default:
          throw new Error('Invalid invitation kind:' + notification.invitation.kind)
      }
    }
    default:
      throw new Error('Notification kind:' + notification.kind)
  }
}
</script>

<template>
  <div class="container min-h-screen mx-auto flex flex-col">
    <div
      class="navbar relative bg-base-300 justify-around rounded-b-xl text-2xl !text-primary z-20"
    >
      <RouterLink class="hover:!text-accent" to="/">
        <Icon icon="ic:round-dashboard" />
      </RouterLink>
      <RouterLink class="hover:!text-accent" to="/note">
        <Icon icon="fluent:notebook-32-filled" />
      </RouterLink>
      <RouterLink class="hover:!text-accent" to="/pomodoro">
        <Icon icon="fluent-emoji-high-contrast:tomato" />
      </RouterLink>
      <RouterLink class="hover:!text-accent" to="/group">
        <Icon icon="mingcute:group-3-fill" />
      </RouterLink>
      <RouterLink class="hover:!text-accent" to="/chat">
        <Icon icon="fluent:chat-28-filled" />
      </RouterLink>
      <RouterLink class="hover:!text-accent" to="/user">
        <img
          v-if="userStore.loggedUser?.image"
          :src="userStore.loggedUser.image"
          alt="User Image"
          class="mask mask-squircle !bg-primary h-9 m-0"
        />
        <Icon v-else icon="fluent:settings-48-filled" />
      </RouterLink>
    </div>
    <div id="app" class="relative w-full grow px-2 mb-16 sm:!pb-0">
      <Notivue v-slot="item">
        <NotivueSwipe :item="item" touch-only>
          <component :item="item" :is="notificationComponent(item)" class="w-[350px]"></component>
        </NotivueSwipe>
      </Notivue>
      <RouterView />
      <PomodoroTimerWidget v-if="pomodoroStore.showPomodoroWidget()" />
    </div>
  </div>
</template>
