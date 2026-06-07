const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, unique + path.extname(file.originalname));
    }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/image', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    res.json({ success: true, imageUrl: `/uploads/${req.file.filename}` });
});

module.exports = router;
