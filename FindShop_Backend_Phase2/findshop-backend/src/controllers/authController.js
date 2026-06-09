const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { runAsync, getAsync, initSchema } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'findshop_secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

function makeToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role, shop_name: user.shop_name }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

async function register(req, res) {
  try {
    const { email, password, role, shop_name } = req.body;
    if (!email || !password || !role) return res.status(400).json({ error: 'Champs manquants.' });
    await initSchema();
    const existing = await getAsync('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return res.status(409).json({ error: 'Email deja utilise.' });
    const hash = bcrypt.hashSync(password, 10);
    const result = await runAsync('INSERT INTO users (email, password, role, shop_name) VALUES (?,?,?,?)', [email, hash, role, shop_name || null]);
    const user = await getAsync('SELECT id, email, role, shop_name, created_at FROM users WHERE id = ?', [result.lastInsertRowid]);
    return res.status(201).json({ token: makeToken(user), user });
  } catch(e) { return res.status(500).json({ error: e.message }); }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Champs manquants.' });
    await initSchema();
    const user = await getAsync('SELECT * FROM users WHERE email = ?', [email]);
    if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    const { password: _, ...safeUser } = user;
    return res.json({ token: makeToken(user), user: safeUser });
  } catch(e) { return res.status(500).json({ error: e.message }); }
}

async function me(req, res) {
  try {
    await initSchema();
    const user = await getAsync('SELECT id, email, role, shop_name, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    return res.json({ user });
  } catch(e) { return res.status(500).json({ error: e.message }); }
}

module.exports = { register, login, me };
