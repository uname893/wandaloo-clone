const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { initDB, getAllBrands, getBrandById, getAllModels, getModelById, getCategories, getCarburants, getModelsByIds, insertBrand, insertModel, insertImages, insertSpec, getPromos } = require('./db');

// Init database
initDB();

const app = express();
const PORT = process.env.PORT || 3001;

// Admin config (in production, use env vars)
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'autoguide-admin-secret-2026';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD || bcrypt.hashSync('admin123', 10);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Servir le frontend statique
app.use(express.static(path.join(__dirname, '../frontend')));

// ========== AUTH MIDDLEWARE ==========
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Non authentifié' });
  try {
    jwt.verify(token, ADMIN_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: 'Token invalide' });
  }
}

// ========== ADMIN AUTH ROUTES ==========
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Mot de passe requis' });
  if (bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
    const token = jwt.sign({ role: 'admin' }, ADMIN_SECRET, { expiresIn: '24h' });
    res.json({ token, success: true });
  } else {
    res.status(401).json({ error: 'Mot de passe incorrect' });
  }
});

app.get('/api/admin/check', requireAuth, (req, res) => {
  res.json({ authenticated: true });
});

// ========== ADMIN CRUD ==========

// List all brands (admin)
app.get('/api/admin/brands', requireAuth, (req, res) => {
  getAllBrands((err, brands) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(brands);
  });
});

// Update brand
app.put('/api/admin/brands/:id', requireAuth, (req, res) => {
  const brand = { ...req.body, id: req.params.id };
  insertBrand(brand, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// List all models (admin)
app.get('/api/admin/models', requireAuth, (req, res) => {
  getAllModels({}, (err, models) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(models);
  });
});

// Update model
app.put('/api/admin/models/:id', requireAuth, (req, res) => {
  const model = { ...req.body, id: req.params.id };
  insertModel(model, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Delete model
app.delete('/api/admin/models/:id', requireAuth, (req, res) => {
  const db = require('./db').getDB();
  db.serialize(() => {
    db.run('DELETE FROM motorisations WHERE model_id = ?', [req.params.id]);
    db.run('DELETE FROM images WHERE model_id = ?', [req.params.id]);
    db.run('DELETE FROM specifications WHERE model_id = ?', [req.params.id]);
    db.run('DELETE FROM models WHERE id = ?', [req.params.id], function(err) {
      db.close();
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

// Add images to model
app.post('/api/admin/models/:id/images', requireAuth, (req, res) => {
  const { images } = req.body;
  if (!images || !images.length) return res.status(400).json({ error: 'Images requises' });
  insertImages(req.params.id, images, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Update specs
app.put('/api/admin/models/:id/specs', requireAuth, (req, res) => {
  const spec = req.body;
  insertSpec(req.params.id, spec, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ========== THEME CONFIG ==========
app.get('/api/admin/theme', (req, res) => {
  res.json({
    primary: '#E31837',
    primaryDark: '#b8122c',
    secondary: '#0f172a',
    accent: '#10b981',
    bg: '#f1f5f9',
    bgCard: '#ffffff',
    text: '#0f172a',
    textLight: '#64748b',
    border: '#e2e8f0'
  });
});

app.put('/api/admin/theme', requireAuth, (req, res) => {
  // In production, save to database or config file
  res.json({ success: true, theme: req.body });
});

// ========== ADS / ANNOUNCEMENTS ==========
app.get('/api/ads', (req, res) => {
  // Return active ads
  res.json([]);
});

app.get('/api/admin/ads', requireAuth, (req, res) => {
  res.json([]);
});

app.post('/api/admin/ads', requireAuth, (req, res) => {
  res.json({ success: true });
});

app.delete('/api/admin/ads/:id', requireAuth, (req, res) => {
  res.json({ success: true });
});

// ========== SCRAPER CONTROL ==========
app.post('/api/admin/scraper/run', requireAuth, (req, res) => {
  const { source, brand } = req.body;
  res.json({ success: true, message: 'Scraper started', source, brand });
});

// ========== PUBLIC API (existing) ==========

app.get('/api/brands', (req, res) => {
  getAllBrands((err, brands) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(brands);
  });
});

app.get('/api/brands/:id', (req, res) => {
  getBrandById(req.params.id, (err, brand) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!brand) return res.status(404).json({ error: 'Marque non trouvée' });
    res.json(brand);
  });
});

app.get('/api/models', (req, res) => {
  const filters = {};
  if (req.query.marque) filters.marque = req.query.marque;
  if (req.query.categorie) filters.categorie = req.query.categorie;
  if (req.query.budget_min) filters.budget_min = req.query.budget_min;
  if (req.query.budget_max) filters.budget_max = req.query.budget_max;
  if (req.query.carburant) filters.carburant = req.query.carburant;
  if (req.query.search) filters.search = req.query.search;
  
  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 0; // 0 = pas de limite (rétrocompatible)

  getAllModels(filters, (err, models) => {
    if (err) return res.status(500).json({ error: err.message });
    if (limit > 0) {
      const total = models.length;
      const start = (page - 1) * limit;
      const paginated = models.slice(start, start + limit);
      return res.json({
        data: paginated,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      });
    }
    res.json(models);
  });
});

app.get('/api/models/:id', (req, res) => {
  getModelById(req.params.id, (err, model) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!model) return res.status(404).json({ error: 'Modèle non trouvé' });
    res.json(model);
  });
});

app.get('/api/categories', (req, res) => {
  getCategories((err, categories) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(categories);
  });
});

app.get('/api/carburants', (req, res) => {
  getCarburants((err, carburants) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(carburants);
  });
});

app.get('/api/promos', (req, res) => {
  getPromos((err, promos) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(promos);
  });
});

app.get('/api/compare', (req, res) => {
  if (!req.query.ids) return res.status(400).json({ error: 'ids requis' });
  const ids = req.query.ids.split(',');
  getModelsByIds(ids, (err, models) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(models);
  });
});

app.get('/api/health', (req, res) => {
  const { getDB } = require('./db');
  const db = getDB();
  db.get('SELECT COUNT(*) as nb_models FROM models', [], (err, row) => {
    db.close();
    if (err) {
      return res.status(500).json({ status: 'error', database: 'disconnected', error: err.message });
    }
    res.json({
      status: 'ok',
      database: 'connected',
      models: row ? row.nb_models : 0,
      timestamp: new Date().toISOString()
    });
  });
});

// Fallback SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚗 AutoGuide API running on http://localhost:${PORT}`);
  console.log(`   DB: SQLite (data/autoguide.db)`);
  console.log(`   Admin: POST /api/admin/login (password: admin123)`);
});
