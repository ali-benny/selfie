import dotenv from 'dotenv'

dotenv.config({ path: ['.env', `.env.${process.env.NODE_ENV}`] })

console.log(process.env.NODE_ENV)

export const BACKEND_PORT = 8000

export const SERVER_URL =
  process.env.SERVER_URL ||
  (process.env.NODE_ENV === 'development' ? `http://locahost:${BACKEND_PORT}` : null)
console.log(SERVER_URL)
if (!SERVER_URL) throw Error('const.js - No SERVER_URL configured')

export const MONGO_URI =
  process.env.MONGO_URI ||
  (process.env.NODE_ENV === 'development' ? 'mongodb://127.0.0.1:27017/selfie' : null)
if (!MONGO_URI) throw Error('const.js - No MONGO_URI configured')

export const API_URL = `${SERVER_URL}/api`
export const CHAT_URL = `${SERVER_URL}/chat`

/*
 * Default tailwind values from https://tailwindcss.com/docs/screens
 */
export const SCREENS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
}
