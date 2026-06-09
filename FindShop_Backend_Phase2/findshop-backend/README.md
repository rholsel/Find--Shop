# FindShop – Backend API REST (Phase 2)

> Suite du MVP Front-End réalisé par le Groupe 10 (UDBL – Projet Tutoré 2026)

---

## 📁 Structure du projet

```
findshop-backend/
├── src/
│   ├── server.js                  ← Point d'entrée Express
│   ├── config/
│   │   ├── database.js            ← SQLite + schéma auto-créé
│   │   └── seed.js                ← Données initiales (commerces.json)
│   ├── middleware/
│   │   ├── auth.js                ← JWT (authenticate, requireRole)
│   │   └── upload.js              ← Multer (images jpeg/png/webp, max 2MB)
│   ├── controllers/
│   │   ├── authController.js      ← register / login / me
│   │   ├── commerceController.js  ← CRUD commerces
│   │   └── productController.js   ← CRUD produits
│   └── routes/
│       ├── auth.js
│       ├── commerces.js
│       └── products.js
├── uploads/                       ← Images uploadées (créé automatiquement)
├── FRONTEND_api.js                ← À copier dans Findshop/js/api.js
├── .env.example
└── package.json
```

---

## 🚀 Installation & Démarrage

### 1. Prérequis
- Node.js ≥ 18
- npm

### 2. Installation
```bash
cd findshop-backend
cp .env.example .env       # Copier et configurer les variables
npm install
```

### 3. Peupler la base de données
```bash
node src/config/seed.js
```
Ce script crée la base SQLite (`findshop.db`) et insère :
- Les 3 commerces du fichier `commerces.json` original
- Les comptes de démonstration :
  - Visiteur  : `visitor@test.com` / `test1234`
  - Marchand  : `merchant@test.com` / `test1234`

### 4. Démarrer le serveur
```bash
npm start          # Production
npm run dev        # Développement (rechargement auto avec nodemon)
```
API disponible sur → **http://localhost:3000**

---

## 🔌 Connexion avec le Frontend

### Étape 1 – Copier le fichier de connexion
```bash
cp FRONTEND_api.js ../Findshop/js/api.js
```

### Étape 2 – Ajouter le script dans chaque page HTML
Dans `index.html`, `login.html`, `register.html`, `commerçant.html` etc.,
ajouter **avant** les autres scripts :
```html
<script src="js/api.js"></script>
```

### Étape 3 – Modifier loadCommerces() dans app.js
Remplacer `loadCommerces()` par `loadCommercesFromAPI()` :
```js
// Avant (MVP) :
// loadCommerces();

// Après (Phase 2) :
loadCommercesFromAPI();
```

---

## 📡 Routes API

### Authentification
| Méthode | Route              | Corps                                      | Auth |
|---------|--------------------|--------------------------------------------|------|
| POST    | /api/auth/register | `{email, password, role, shop_name?}`      | ✗    |
| POST    | /api/auth/login    | `{email, password}`                        | ✗    |
| GET     | /api/auth/me       | —                                          | ✓    |

### Commerces
| Méthode | Route               | Paramètres / Corps                         | Auth    |
|---------|---------------------|--------------------------------------------|---------|
| GET     | /api/commerces      | `?q=&categorie=&quartier=`                 | ✗       |
| GET     | /api/commerces/:id  | —                                          | ✗       |
| POST    | /api/commerces      | FormData (nom, categorie, quartier, image…)| Marchand|
| PUT     | /api/commerces/:id  | FormData (champs à modifier)               | Marchand|
| DELETE  | /api/commerces/:id  | —                                          | Marchand|

### Produits
| Méthode | Route              | Paramètres / Corps                              | Auth    |
|---------|--------------------|--------------------------------------------------|---------|
| GET     | /api/products      | `?commerce_id=&categorie=&q=`                   | ✗       |
| GET     | /api/products/:id  | —                                               | ✗       |
| POST    | /api/products      | FormData (nom, prix, categorie, commerce_id, image…)| Marchand|
| PUT     | /api/products/:id  | FormData (champs à modifier)                    | Marchand|
| DELETE  | /api/products/:id  | —                                               | Marchand|

### Santé
```
GET /api/health  →  { status: "ok", timestamp: "...", version: "1.0.0" }
```

---

## 🔐 Authentification JWT

Le token est retourné à la connexion/inscription :
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": 1, "email": "merchant@test.com", "role": "merchant" }
}
```
À envoyer dans chaque requête protégée :
```
Authorization: Bearer <token>
```

---

## 🗄️ Base de données (SQLite)

### Table `users`
| Colonne    | Type    | Description              |
|------------|---------|--------------------------|
| id         | INTEGER | Clé primaire             |
| email      | TEXT    | Unique                   |
| password   | TEXT    | Hash bcrypt              |
| role       | TEXT    | `visitor` ou `merchant`  |
| shop_name  | TEXT    | Nom du commerce (marchand)|
| created_at | TEXT    | Date de création         |

### Table `commerces`
| Colonne    | Type    | Description              |
|------------|---------|--------------------------|
| id         | INTEGER | Clé primaire             |
| nom        | TEXT    | Nom du commerce          |
| categorie  | TEXT    | Ex : Alimentation, Mode  |
| quartier   | TEXT    | Ex : Centre-ville        |
| latitude   | REAL    | Coordonnée GPS           |
| longitude  | REAL    | Coordonnée GPS           |
| image      | TEXT    | Nom de fichier ou URL    |
| created_by | INTEGER | FK → users.id            |

### Table `products`
| Colonne     | Type    | Description              |
|-------------|---------|--------------------------|
| id          | INTEGER | Clé primaire             |
| nom         | TEXT    | Nom du produit           |
| prix        | REAL    | > 0                      |
| commerce_id | INTEGER | FK → commerces.id        |
| image       | TEXT    | Nom de fichier ou URL    |
| created_by  | INTEGER | FK → users.id            |

---

## 🛣️ Feuille de route

| Phase | Statut     | Description                              |
|-------|------------|------------------------------------------|
| 1     | ✅ Terminé  | MVP Front-End (localStorage + JSON)      |
| 2     | ✅ **Livré** | API REST + SQLite + JWT + Multer        |
| 3     | 🔜 À faire  | Upload Cloudinary, Dashboard avancé      |
| 4     | 🔜 À faire  | Déploiement (Railway / Render + Vercel)  |

---

## 👥 Groupe 10 – UDBL 2026
Joyce · David · Imelda · Grady · Rholsel · Plamedi · Didier · Anaïs · Armel · Sarah
