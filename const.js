const isNode = typeof process === 'undefined'
const NODE_ENV = isNode ? process.env.NODE_ENV : import.meta.env?.MODE

export const APP_PREFIX = NODE_ENV === 'development' ? '' : 'webapp'

export const BACKEND_PORT = 8000

export const SERVER_URL =
  NODE_ENV === 'development'
    ? `http://localhost:${BACKEND_PORT}`
    : 'https://site232433.tw.cs.unibo.it'

if (!SERVER_URL) throw Error('const.js - No SERVER_URL configured')

export const MONGO_URI =
  NODE_ENV === 'development'
    ? 'mongodb://127.0.0.1:27017/selfie'
    : 'mongodb://site232433:ahB4ha7j@mongo_site232433/selfie?authSource=admin&writeConcern=majority'

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
