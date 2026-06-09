require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

// ── CORS ─────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || 'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3001',
];

app.use(cors({
  origin: (origin, cb) => {
    // Autoriser les requêtes sans origine (Postman, etc.) en développement
    if (!origin || ALLOWED_ORIGINS.includes(origin) || process.env.NODE_ENV !== 'production') {
      cb(null, true);
    } else {
      cb(new Error('CORS : origine non autorisée'));
    }
  },
  credentials: true,
}));

// ── Parseurs ──────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Fichiers statiques (images uploadées) ─────────────────────────────────────
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');
app.use('/uploads', express.static(UPLOAD_DIR));

// ── Routes API ────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/commerces', require('./routes/commerces'));
app.use('/api/products',  require('./routes/products'));

// ── Santé ─────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' })
);

// ── Erreurs 404 ───────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route introuvable.' }));

// ── Gestionnaire d'erreurs global ─────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[ERROR]', err.message);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Fichier trop volumineux (max 2 MB).' });
  }
  res.status(500).json({ error: err.message || 'Erreur interne du serveur.' });
});

// ── Démarrage ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀  FindShop API démarrée → http://localhost:${PORT}`);
  console.log(`📂  Uploads          → ${UPLOAD_DIR}`);
  console.log(`🌱  Seed initial     → node src/config/seed.js\n`);
});

module.exports = app;
