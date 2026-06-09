const { runAsync, getAsync, allAsync, initSchema } = require('../config/database');

function img(req, f) { if (!f) return null; if (f.startsWith('http')) return f; return req.protocol+'://'+req.get('host')+'/uploads/'+f; }

async function listProducts(req, res) {
  try {
    await initSchema();
    const { commerce_id, categorie, q } = req.query;
    let sql = 'SELECT p.*, c.nom as commerce_nom, c.quartier as commerce_quartier FROM products p LEFT JOIN commerces c ON c.id = p.commerce_id WHERE 1=1'; const args = [];
    if (commerce_id) { sql += ' AND p.commerce_id = ?'; args.push(commerce_id); }
    if (categorie)   { sql += ' AND p.categorie = ?';   args.push(categorie);   }
    if (q)           { sql += ' AND (p.nom LIKE ? OR p.description LIKE ?)'; args.push('%'+q+'%','%'+q+'%'); }
    sql += ' ORDER BY p.created_at DESC';
    const products = await allAsync(sql, args);
    return res.json(products.map(p => ({ ...p, image: img(req, p.image) })));
  } catch(e) { return res.status(500).json({ error: e.message }); }
}

async function getProduct(req, res) {
  try {
    await initSchema();
    const p = await getAsync('SELECT p.*, c.nom as commerce_nom FROM products p LEFT JOIN commerces c ON c.id = p.commerce_id WHERE p.id = ?', [req.params.id]);
    if (!p) return res.status(404).json({ error: 'Produit introuvable.' });
    return res.json({ ...p, image: img(req, p.image) });
  } catch(e) { return res.status(500).json({ error: e.message }); }
}

async function createProduct(req, res) {
  try {
    await initSchema();
    const { nom, description, prix, categorie, commerce_id } = req.body;
    if (!nom || !prix || !commerce_id) return res.status(400).json({ error: 'Champs manquants.' });
    if (parseFloat(prix) <= 0) return res.status(400).json({ error: 'Prix invalide.' });
    const commerce = await getAsync('SELECT * FROM commerces WHERE id = ?', [commerce_id]);
    if (!commerce) return res.status(404).json({ error: 'Commerce introuvable.' });
    if (commerce.created_by !== req.user.id) return res.status(403).json({ error: 'Non autorise.' });
    const imageFile = req.file ? req.file.filename : null;
    const result = await runAsync('INSERT INTO products (nom, description, prix, categorie, image, commerce_id, created_by) VALUES (?,?,?,?,?,?,?)', [nom, description||null, parseFloat(prix), categorie||null, imageFile, parseInt(commerce_id), req.user.id]);
    const p = await getAsync('SELECT * FROM products WHERE id = ?', [result.lastInsertRowid]);
    return res.status(201).json({ ...p, image: img(req, p.image) });
  } catch(e) { return res.status(500).json({ error: e.message }); }
}

async function updateProduct(req, res) {
  try {
    await initSchema();
    const p = await getAsync('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!p) return res.status(404).json({ error: 'Produit introuvable.' });
    if (p.created_by !== req.user.id) return res.status(403).json({ error: 'Non autorise.' });
    const fields = { ...req.body, updated_at: new Date().toISOString() };
    delete fields.commerce_id;
    if (req.file) fields.image = req.file.filename;
    const sets = Object.keys(fields).map(k => k+' = ?').join(', ');
    await runAsync('UPDATE products SET '+sets+' WHERE id = ?', [...Object.values(fields), req.params.id]);
    const updated = await getAsync('SELECT * FROM products WHERE id = ?', [req.params.id]);
    return res.json({ ...updated, image: img(req, updated.image) });
  } catch(e) { return res.status(500).json({ error: e.message }); }
}

async function deleteProduct(req, res) {
  try {
    await initSchema();
    const p = await getAsync('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!p) return res.status(404).json({ error: 'Produit introuvable.' });
    if (p.created_by !== req.user.id) return res.status(403).json({ error: 'Non autorise.' });
    await runAsync('DELETE FROM products WHERE id = ?', [req.params.id]);
    return res.json({ message: 'Produit supprime.' });
  } catch(e) { return res.status(500).json({ error: e.message }); }
}

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct };
