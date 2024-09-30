import multer, { diskStorage } from 'multer'
import { extname } from 'path'

// Configurazione di Multer
const storage = diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + extname(file.originalname))
  }
})

const upload = multer({ storage: storage })

export default upload
