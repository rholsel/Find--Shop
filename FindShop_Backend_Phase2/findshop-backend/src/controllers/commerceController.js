const { z }  = require('zod');
const { runAsync, getAsync, allAsync, initSchema } = require('../config/database');

const CommerceSchema = z.object({
  nom:         z.string().min(2),
  description: z.string().optional().nullable(),
  categorie:   z.string().optional().nullable(),
  quartier:    z.string().optional().nullable(),
  adresse:     z.string().optional().nullable(),
  telephone:   z.string().optional().nullable(),
  horaires:    z.string().optional().nullable(),
  latitude:    z.coerce.number().optional().nullable(),
  longitude:   z.coerce.number().optional().nullable(),
});

function buildImageUrl(req, filename) {
  if (!filename) return null;
  if (filename.startsWith('http')) return filename;
  return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
}

async function listCommerces(req, res) {
  await initSchema();
  const { categorie, quartier, q } = req.query;
  let sql = 'SELECT * FROM commerces WHERE 1=1';
  const args = [];
  if (categorie) { sql += ' AND categorie = ?'; args.push(categorie); }
  if (quartier)  { sql += ' AND quartier  = ?'; args.push(quartier);  }
  if (q)         { sql += ' AND (nom LIKE ? OR description LIKE ?)'; args.push(`%${q}%`, `%${q}%`); }
  sql += ' ORDER BY created_at DESC';

  const commerces = await allAsync(sql, args);
  const result = await Promise.all(commerces.map(async c => {
    const produits = await allAsync('SELECT * FROM products WHERE commerce_id = ?', [c.id]);
    return {
      ...c, lat: c.latitude, lon: c.longitude,
      image: buildImageUrl(req, c.image),
      produits: produits.map(p => ({ ...p, image: buildImageUrl(req, p.image) })),
    };
  }));
  return res.json(result);
}

async function getCommerce(req, res) {
  await initSchema();
  const c = await getAsync('SELECT * FROM commerces WHERE id = ?', [req.params.id]);
  if (!c) return res.status(404).json({ error: 'Commerce introuvable.' });
  const produits = await allAsync('SELECT * FROM products WHERE commerce_id = ?', [c.id]);
  return res.json({
    ...c, lat: c.latitude, lon: c.longitude,
    image: buildImageUrl(req, c.image),
    produits: produits.map(p => ({ ...p, image: buildImageUrl(req, p.image) })),
  });
}

async function createCommerce(req, res) {
  const parsed = CommerceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
  await initSchema();
  const d = parsed.data;
  const imageFile = req.file ? req.file.filename : null;
  const result = await runAsync(
    `INSERT INTO commerces (nom, description, categorie, quartier, adresse, telephone, horaires, latitude, longitude, image, created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [d.nom, d.description||null, d.categorie||null, d.quartier||null, d.adresse||null,
     d.telephone||null, d.horaires||null, d.latitude||null, d.longitude||null, imageFile, req.user.id]
  );
  const c = await getAsync('SELECT * FROM commerces WHERE id = ?', [result.lastInsertRowid]);
  return res.status(201).json({ ...c, lat: c.latitude, lon: c.longitude, image: buildImageUrl(req, c.image), produits: [] });
}

async function updateCommerce(req, res) {
  await initSchema();
  const c = await getAsync('SELECT * FROM commerces WHERE id = ?', [req.params.id]);
  if (!c) return res.status(404).json({ error: 'Commerce introuvable.' });
  if (c.created_by !== req.user.id) return res.status(403).json({ error: 'Non autorisé.' });

  const parsed = CommerceSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
  const d = parsed.data;
  if (req.file) d.image = req.file.filename;
  d.updated_at = new Date().toISOString();

  const sets = Object.keys(d).map(k => `${k} = ?`).join(', ');
  await runAsync(`UPDATE commerces SET ${sets} WHERE id = ?`, [...Object.values(d), req.params.id]);
  const updated = await getAsync('SELECT * FROM commerces WHERE id = ?', [req.params.id]);
  const produits = await allAsync('SELECT * FROM products WHERE commerce_id = ?', [req.params.id]);
  return res.json({ ...updated, lat: updated.latitude, lon: updated.longitude, image: buildImageUrl(req, updated.image), produits });
}

async function deleteCommerce(req, res) {
  await initSchema();
  const c = await getAsync('SELECT * FROM commerces WHERE id = ?', [req.params.id]);
  if (!c) return res.status(404).json({ error: 'Commerce introuvable.' });
  if (c.created_by !== req.user.id) return res.status(403).json({ error: 'Non autorisé.' });
  await runAsync('DELETE FROM commerces WHERE id = ?', [req.params.id]);
  return res.json({ message: 'Commerce supprimé.' });
}

module.exports = { listCommerces, getCommerce, createCommerce, updateCommerce, deleteCommerce };