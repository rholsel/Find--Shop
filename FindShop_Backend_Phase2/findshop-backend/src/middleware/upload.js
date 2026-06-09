const multer  = require('multer');
const path    = require('path');
const crypto  = require('crypto');
const fs      = require('fs');

const UPLOAD_DIR   = path.resolve(process.env.UPLOAD_DIR || './uploads');
const MAX_SIZE     = parseInt(process.env.MAX_FILE_SIZE || '2097152', 10); // 2 MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

// Créer le dossier s'il n'existe pas
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = crypto.randomBytes(16).toString('hex') + ext;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Format non supporté. Utilisez jpeg, png ou webp.'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE } });

module.exports = upload;
