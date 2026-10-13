const multer = require('multer');
const AppError = require('../utils/AppError');

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

// Xotirada saqlanadi (Vercel'da diskka yozib bo'lmaydi). Vercel body limiti ~4.5MB.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED.includes(file.mimetype)) {
      return cb(new AppError('Faqat JPG, PNG yoki WEBP rasm yuklash mumkin', 400));
    }
    cb(null, true);
  },
});

module.exports = upload;
