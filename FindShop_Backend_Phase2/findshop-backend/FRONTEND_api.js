/**
 * api.js – Couche de connexion FindShop Frontend ↔ Backend API REST
 * 
 * Ajouter ce fichier dans Findshop/js/api.js
 * Puis l'inclure dans chaque page HTML avant les autres scripts :
 *   <script src="js/api.js"></script>
 */

const API_BASE = 'http://localhost:3000/api';

// ── Gestion du token JWT ──────────────────────────────────────────────────────

const TOKEN_KEY = 'findshop_jwt';

function getToken()          { return localStorage.getItem(TOKEN_KEY); }
function setToken(t)         { localStorage.setItem(TOKEN_KEY, t); }
function removeToken()       { localStorage.removeItem(TOKEN_KEY); }

function authHeaders() {
  const t = getToken();
  return t ? { 'Authorization': `Bearer ${t}` } : {};
}

// ── Requête générique ─────────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Erreur ${res.status}`);
  }
  return data;
}

// FormData (upload image) – pas de Content-Type manuel (browser le gère)
async function apiFetchForm(path, formData, method = 'POST') {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { ...authHeaders() },
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data;
}

// ── AUTH ──────────────────────────────────────────────────────────────────────

const Auth = {
  async register(email, password, role, shop_name = null) {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, role, shop_name }),
    });
    setToken(data.token);
    localStorage.setItem('findshop_auth', JSON.stringify(data.user));
    return data;
  },

  async login(email, password) {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    localStorage.setItem('findshop_auth', JSON.stringify(data.user));
    return data;
  },

  async me() {
    return apiFetch('/auth/me');
  },

  logout() {
    removeToken();
    localStorage.removeItem('findshop_auth');
    window.location.href = 'index.html';
  },
};

// ── COMMERCES ─────────────────────────────────────────────────────────────────

const Commerces = {
  list(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiFetch('/commerces' + (qs ? '?' + qs : ''));
  },

  get(id) {
    return apiFetch(`/commerces/${id}`);
  },

  create(formData) {
    // formData = FormData (avec image optionnelle)
    return apiFetchForm('/commerces', formData, 'POST');
  },

  update(id, formData) {
    return apiFetchForm(`/commerces/${id}`, formData, 'PUT');
  },

  delete(id) {
    return apiFetch(`/commerces/${id}`, { method: 'DELETE' });
  },
};

// ── PRODUITS ──────────────────────────────────────────────────────────────────

const Products = {
  list(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiFetch('/products' + (qs ? '?' + qs : ''));
  },

  get(id) {
    return apiFetch(`/products/${id}`);
  },

  create(formData) {
    return apiFetchForm('/products', formData, 'POST');
  },

  update(id, formData) {
    return apiFetchForm(`/products/${id}`, formData, 'PUT');
  },

  delete(id) {
    return apiFetch(`/products/${id}`, { method: 'DELETE' });
  },
};

// ── Remplacement de loadCommerces() ──────────────────────────────────────────
// Cette fonction remplace fetch('./data/commerces.json') par l'API réelle.
// Elle est compatible avec app.js existant (même format de données).

async function loadCommercesFromAPI() {
  try {
    showLoader();
    const params = {};
    const searchVal   = document.getElementById('searchInput')?.value?.trim();
    const categorieVal = document.getElementById('categoryFilter')?.value;
    const quartierVal  = document.getElementById('districtFilter')?.value;
    if (searchVal)    params.q         = searchVal;
    if (categorieVal) params.categorie  = categorieVal;
    if (quartierVal)  params.quartier   = quartierVal;

    const data = await Commerces.list(params);
    commerces  = data; // variable globale de app.js
    hideLoader();
    renderCommerces(commerces);
  } catch (err) {
    hideLoader();
    showAlert('Erreur de chargement : ' + err.message, 'error');
    console.error(err);
  }
}

// ── Remplacement de la soumission produit ────────────────────────────────────
// Compatible avec products.js existant – intercepte la soumission du formulaire

function initProductFormAPI() {
  const form = document.getElementById('productForm');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const btn = form.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.innerText = 'Envoi...'; }

    try {
      const fd = new FormData(form);
      // S'assurer que commerce_id est bien dans le FormData
      const cid = document.getElementById('commerceSelect')?.value;
      if (cid) fd.set('commerce_id', cid);

      const product = await Products.create(fd);

      showAlert('Produit ajouté avec succès !', 'success');
      form.reset();
      if (document.getElementById('imagePreview'))
        document.getElementById('imagePreview').src = 'assets/images/default-product.svg';

      window.dispatchEvent(new CustomEvent('product:added', { detail: product }));
    } catch (err) {
      showAlert(err.message, 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.innerText = 'Ajouter'; }
    }
  }, { once: true }); // once:true pour ne pas doubler le listener de products.js
}

// ── Remplacement login/register ───────────────────────────────────────────────

function initLoginFormAPI() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const email    = document.getElementById('email')?.value?.trim();
    const password = document.getElementById('password')?.value;
    const btn      = form.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.innerText = 'Connexion...'; }

    try {
      const data = await Auth.login(email, password);
      showAlert('Connexion réussie !', 'success');
      setTimeout(() => {
        window.location.href = data.user.role === 'merchant' ? 'commerçant.html' : 'visiteur.html';
      }, 800);
    } catch (err) {
      showAlert(err.message, 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.innerText = 'Se connecter'; }
    }
  }, { once: true });
}

function initRegisterFormAPI() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const email     = document.getElementById('email')?.value?.trim();
    const password  = document.getElementById('password')?.value;
    const role      = document.getElementById('role')?.value || 'visitor';
    const shop_name = document.getElementById('shop_name')?.value?.trim() || null;
    const btn       = form.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.innerText = 'Inscription...'; }

    try {
      const data = await Auth.register(email, password, role, shop_name);
      showAlert('Compte créé avec succès !', 'success');
      setTimeout(() => {
        window.location.href = data.user.role === 'merchant' ? 'commerçant.html' : 'visiteur.html';
      }, 800);
    } catch (err) {
      showAlert(err.message, 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.innerText = "S'inscrire"; }
    }
  }, { once: true });
}

// ── Auto-init au chargement de la page ────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initLoginFormAPI();
  initRegisterFormAPI();
  initProductFormAPI();
});
