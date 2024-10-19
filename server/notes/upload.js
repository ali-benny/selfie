import express from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join('./uploads');

// Middleware per logging
const logMiddleware = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
};

router.use(logMiddleware);

// Middleware per gestire il file upload
const uploadMiddleware = express.raw({ 
  limit: '10mb',
  type: ['image/*', 'multipart/form-data', 'application/octet-stream']
});

router.post('/upload', uploadMiddleware, async (req, res) => {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const contentType = req.headers['content-type'];
    const extension = contentType.includes('image/') 
      ? contentType.split('/')[1] 
      : 'jpg';
    
    const fileName = `${uuidv4()}.${extension}`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    const fileUrl = `/uploads/${fileName}`;

    await fs.writeFile(filePath, req.body);

    const response = {
      success: 1,
      file: {
        url: fileUrl,
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Errore durante upload:', error);
    res.status(500).json({
      success: 0,
      message: error.message
    });
  }
});

export default router;