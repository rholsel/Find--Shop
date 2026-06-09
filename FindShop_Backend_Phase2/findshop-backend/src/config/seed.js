require('dotenv').config();
const bcrypt = require('bcryptjs');
const { runAsync, getAsync, initSchema } = require('./database');

const COMMERCES = [
  { nom: 'Marche Central', categorie: 'Alimentation', quartier: 'Centre-ville', description: 'Grand marche local.', telephone: '+243 999 000 111', adresse: '12 Rue du Marche', latitude: -4.325, longitude: 15.322, horaires: 'Lundi-Samedi 8h-19h', image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9', produits: [{ nom: 'Tomates', prix: 2, image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce' }, { nom: 'Pommes', prix: 3, image: 'https://images.unsplash.com/photo-1574226516831-e1dff420e12b' }] },
  { nom: 'Tech Store', categorie: 'Electronique', quartier: 'Golf', description: 'Boutique high-tech.', telephone: '+243 999 222 333', adresse: '54 Avenue des Technologies', latitude: -4.321, longitude: 15.334, horaires: 'Lundi-Vendredi 10h-19h30', image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c', produits: [{ nom: 'Samsung A55', prix: 350, image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9' }, { nom: 'Power Bank', prix: 25, image: 'https://images.unsplash.com/photo-1510557880182-3c5a6c9fada3' }] },
  { nom: 'Boutique Mode', categorie: 'Mode', quartier: 'Bel-Air', description: 'Vetements et accessoires.', telephone: '+243 999 444 555', adresse: '8 Boulevard de la Mode', latitude: -4.330, longitude: 15.318, horaires: 'Tous les jours 9h-20h', image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04', produits: [{ nom: 'Robe ete', prix: 45, image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446' }, { nom: 'Sac a main', prix: 30, image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa' }] },
];

async function seed() {
  await initSchema();
  const hash1 = bcrypt.hashSync('test1234', 10);
  const hash2 = bcrypt.hashSync('test1234', 10);
  await runAsync('INSERT OR IGNORE INTO users (email, password, role, shop_name) VALUES (?,?,?,?)', ['visitor@test.com', hash1, 'visitor', null]);
  await runAsync('INSERT OR IGNORE INTO users (email, password, role, shop_name) VALUES (?,?,?,?)', ['merchant@test.com', hash2, 'merchant', 'Marche Central']);
  const merchant = await getAsync('SELECT id FROM users WHERE email = ?', ['merchant@test.com']);
  const existing = await getAsync('SELECT COUNT(*) as c FROM commerces');
  if (existing.c === 0) {
    for (const c of COMMERCES) {
      const res = await runAsync('INSERT INTO commerces (nom, categorie, quartier, description, telephone, adresse, latitude, longitude, horaires, image, created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)', [c.nom, c.categorie, c.quartier, c.description, c.telephone, c.adresse, c.latitude, c.longitude, c.horaires, c.image, merchant.id]);
      for (const p of c.produits) {
        await runAsync('INSERT INTO products (nom, prix, image, categorie, commerce_id, created_by) VALUES (?,?,?,?,?,?)', [p.nom, p.prix, p.image, c.categorie, res.lastInsertRowid, merchant.id]);
      }
    }
    console.log('3 commerces inseres avec succes.');
  } else { console.log('Base deja peuplee.'); }
  console.log('Seed termine.');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
