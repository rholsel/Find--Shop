const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'findshop_secret';

/**
 * Middleware : vérifie le token JWT dans Authorization: Bearer <token>
 * Attache req.user = { id, email, role, shop_name }
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant ou invalide.' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token expiré ou invalide.' });
  }
}

/**
 * Middleware : autorise seulement le rôle spécifié
 * @param {string} role  'merchant' | 'visitor'
 */
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Non authentifié.' });
    if (req.user.role !== role) {
      return res.status(403).json({ error: `Accès réservé aux ${role}s.` });
    }
    next();
  };
}

/**
 * Optionnel : charge l'utilisateur si un token est présent, mais ne bloque pas
 */
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.slice(7), JWT_SECRET);
    } catch {/* ignoré */}
  }
  next();
}

module.exports = { authenticate, requireRole, optionalAuth };
