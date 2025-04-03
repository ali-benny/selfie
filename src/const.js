import { BACKEND_PORT } from '../global.js'

const NODE_ENV = import.meta.env?.MODE

export const SERVER_URL =
  NODE_ENV === 'development'
    ? `http://localhost:${BACKEND_PORT}`
    : 'https://site232433.tw.cs.unibo.it'

export const API_URL = `${SERVER_URL}/api`
export const CHAT_URL = `${SERVER_URL}/chat`

export const SCREENS = {
  xs: '30rem',
  sm: '40rem',
  md: '48rem',
  lg: '64rem',
  xl: '80rem',
  '2xl': '96rem'
}
