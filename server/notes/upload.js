import express from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

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
    console.log('Ricevuta richiesta di upload');
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Body size:', req.body?.length || 'N/A');

    // Assicurati che la directory esista
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // Gestisci il file
    const contentType = req.headers['content-type'];
    const extension = contentType.includes('image/') 
      ? contentType.split('/')[1] 
      : 'jpg';
    
    const fileName = `${uuidv4()}.${extension}`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    const fileUrl = `/uploads/${fileName}`;

    await fs.writeFile(filePath, req.body);
    console.log('File salvato:', filePath);

    // Risposta ESATTA come richiesta da Editor.js
    const response = {
      success: 1,
      file: {
        url: fileUrl,
      }
    };

    console.log('Invio risposta:', response);
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