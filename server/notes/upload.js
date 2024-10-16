import expressFileForge from 'express-fileforge';
import fs from 'fs';

const uploadDir = 'uploads/';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = expressFileForge({
  storage: {
    directory: uploadDir, // Destinazione di caricamento
    fileName: (req, file) => {
      return `${Date.now()}-${file.originalname}`;
    },
  },
});

export default upload;