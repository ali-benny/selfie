const credentials = {
  user: "site232433",
  pwd: "ahB4ha7j",
  site: "mongo_site232433"
}

export const PORT = 3000;
export const SERVER_URL = `http://localhost:${PORT}`
export const MONGO_URI = 'mongodb://127.0.0.1:27017/selfie';
// export const MONGO_URI = process.env.NODE_ENV === 'debug' ? 'mongodb://127.0.0.1:27017/selfie' : `mongodb://${credentials.user}:${credentials.pwd}@${credentials.site}/selfie?authSource=admin&writeConcern=majority`;