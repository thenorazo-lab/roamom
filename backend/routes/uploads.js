const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Save files to backend/public/uploads
const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// POST /api/upload-image (form-data, field 'image') -> returns { url }
router.post('/upload-image', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  // serve from /uploads/<filename>
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

module.exports = router;
