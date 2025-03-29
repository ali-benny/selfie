const credentials = {
  user: 'site232433',
  pwd: 'ahB4ha7j',
  site: 'mongo_site232433'
}

export const PORT = 8000
export const SERVER_URL = `http://localhost:${PORT}`
export const MONGO_URI = 'mongodb://127.0.0.1:27017/selfie'

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

// export const MONGO_URI = `mongodb://${credentials.user}:${credentials.pwd}@${credentials.site}/selfie?authSource=admin&writeConcern=majority`;
