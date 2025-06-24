import { io } from 'socket.io-client'
import { SERVER_URL } from '@/const.js'

const socket = io(SERVER_URL, {
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  autoConnect: true,
  timeout: 10000,
  transports: ['websocket', 'polling']
})

export default socket
