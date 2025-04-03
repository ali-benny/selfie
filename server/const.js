import { BACKEND_PORT } from '../global.js'

export const NODE_ENV = process.env.NODE_ENV

export const APP_PREFIX = NODE_ENV === 'development' ? '' : 'webapp'

export const SERVER_URL =
  NODE_ENV === 'development'
    ? `http://localhost:${BACKEND_PORT}`
    : 'https://site232433.tw.cs.unibo.it'

export const MONGO_URI =
  NODE_ENV === 'development'
    ? 'mongodb://127.0.0.1:27017/selfie'
    : 'mongodb://site232433:ahB4ha7j@mongo_site232433/selfie?authSource=admin&writeConcern=majority'

export { BACKEND_PORT }
