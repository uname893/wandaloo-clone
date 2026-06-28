const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'autoguide.db');

function getDB() {
  return new sqlite3.Database(DB_PATH);
}

function initDB() {
  const db = getDB();
  
  db.serialize(() => {
    // Brands table
    db.run(`CREATE TABLE IF NOT EXISTS brands (
      id TEXT PRIMARY KEY,
      nom TEXT NOT NULL,
      pays TEXT,
      logo TEXT,
      site_officiel TEXT,
      nb_modeles INTEGER DEFAULT 0,
      prix_min INTEGER DEFAULT 0,
      prix_max INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Models table
    db.run(`CREATE TABLE IF NOT EXISTS models (
      id TEXT PRIMARY KEY,
      marque TEXT NOT NULL,
      nom TEXT NOT NULL,
      slug TEXT,
      annee INTEGER,
      categorie TEXT,
      carrosserie TEXT,
      prix_min INTEGER DEFAULT 0,
      prix_max INTEGER DEFAULT 0,
      image TEXT,
      fiche_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Motorizations table
    db.run(`CREATE TABLE IF NOT EXISTS motorisations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model_id TEXT NOT NULL,
      version TEXT,
      moteur TEXT,
      puissance TEXT,
      transmission TEXT,
      carburant TEXT,
      FOREIGN KEY (model_id) REFERENCES models(id)
    )`);

    // Images table (album photo)
    db.run(`CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model_id TEXT NOT NULL,
      url TEXT NOT NULL,
      alt TEXT,
      is_primary INTEGER DEFAULT 0,
      FOREIGN KEY (model_id) REFERENCES models(id)
    )`);

    // Specifications table (fiche technique détaillée)
    db.run(`CREATE TABLE IF NOT EXISTS specifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model_id TEXT NOT NULL,
      motorisation_id INTEGER,
      -- Dimensions
      longueur TEXT,
      largeur TEXT,
      hauteur TEXT,
      empattement TEXT,
      poids TEXT,
      coffre TEXT,
      -- Motorisation
      cylindree TEXT,
      cylindres TEXT,
      turbo TEXT,
      -- Performance
      vitesse_max TEXT,
      acceleration TEXT,
      -- Consommation
      conso_urbaine TEXT,
      conso_extra TEXT,
      conso_mixte TEXT,
      emission_co2 TEXT,
      -- Autres
      reservoir TEXT,
      roues TEXT,
      pneus TEXT,
      FOREIGN KEY (model_id) REFERENCES models(id)
    )`);

    // Create indexes
    db.run(`CREATE INDEX IF NOT EXISTS idx_models_marque ON models(marque)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_models_categorie ON models(categorie)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_models_prix ON models(prix_min)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_motorisations_model ON motorisations(model_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_motorisations_carburant ON motorisations(carburant)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_images_model ON images(model_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_specifications_model ON specifications(model_id)`);
  });

  db.close();
  console.log('✅ Database initialized with images + specs tables');
}

// CRUD helpers
function insertBrand(brand, callback) {
  const db = getDB();
  const stmt = db.prepare(`INSERT OR REPLACE INTO brands 
    (id, nom, pays, logo, site_officiel, nb_modeles, prix_min, prix_max)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  stmt.run(brand.id, brand.nom, brand.pays || '', brand.logo || '', brand.site_officiel || '',
    brand.nb_modeles || 0, brand.prix_min || 0, brand.prix_max || 0, callback);
  stmt.finalize();
  db.close();
}

function insertModel(model, callback) {
  const db = getDB();
  
  // Check if model already exists
  db.get(`SELECT * FROM models WHERE id = ?`, [model.id], (err, existing) => {
    if (err) { db.close(); callback(err); return; }
    
    if (existing) {
      // Model exists: update it but preserve fields if the incoming ones are empty
      const stmt = db.prepare(`UPDATE models SET 
        marque = ?, 
        nom = ?, 
        slug = ?, 
        annee = COALESCE(NULLIF(?, 0), annee), 
        categorie = COALESCE(NULLIF(?, ''), categorie), 
        carrosserie = COALESCE(NULLIF(?, ''), carrosserie), 
        prix_min = COALESCE(NULLIF(?, 0), prix_min), 
        prix_max = COALESCE(NULLIF(?, 0), prix_max), 
        image = COALESCE(NULLIF(?, ''), image), 
        fiche_url = COALESCE(NULLIF(?, ''), fiche_url)
        WHERE id = ?`);
      
      stmt.run(
        model.marque, 
        model.nom, 
        model.slug || existing.slug, 
        model.annee || 0,
        model.categorie || '', 
        model.carrosserie || '', 
        model.prix_min || 0, 
        model.prix_max || 0,
        model.image || '', 
        model.fiche_url || '',
        model.id,
        function(err2) {
          stmt.finalize();
          if (err2) { db.close(); callback(err2); return; }
          
          // Only overwrite motorisations if new ones are richer
          if (model.motorisations && model.motorisations.length > 0) {
            // Check if existing motorisations are detailed
            db.get(`SELECT COUNT(*) as cnt FROM motorisations WHERE model_id = ? AND moteur != 'À préciser'`, [model.id], (err3, countRow) => {
              // If incoming motorisation has detailed info, or we have no detailed info, update it
              const incomingIsDetailed = model.motorisations.some(m => m.moteur && m.moteur !== 'À préciser');
              if (incomingIsDetailed || !countRow || countRow.cnt === 0) {
                db.run(`DELETE FROM motorisations WHERE model_id = ?`, [model.id], (err4) => {
                  const motStmt = db.prepare(`INSERT INTO motorisations 
                    (model_id, version, moteur, puissance, transmission, carburant)
                    VALUES (?, ?, ?, ?, ?, ?)`);
                  for (const mot of model.motorisations) {
                    motStmt.run(model.id, mot.version || '', mot.moteur || '', mot.puissance || '',
                      mot.transmission || '', mot.carburant || '');
                  }
                  motStmt.finalize();
                  db.close();
                  callback(null);
                });
              } else {
                db.close();
                callback(null);
              }
            });
          } else {
            db.close();
            callback(null);
          }
        }
      );
    } else {
      // Model doesn't exist: insert it
      const stmt = db.prepare(`INSERT INTO models 
        (id, marque, nom, slug, annee, categorie, carrosserie, prix_min, prix_max, image, fiche_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      stmt.run(model.id, model.marque, model.nom, model.slug || '', model.annee || 2025,
        model.categorie || '', model.carrosserie || '', model.prix_min || 0, model.prix_max || 0,
        model.image || '', model.fiche_url || '', function(err2) {
          stmt.finalize();
          if (err2) { db.close(); callback(err2); return; }
          
          if (model.motorisations && model.motorisations.length > 0) {
            const motStmt = db.prepare(`INSERT INTO motorisations 
              (model_id, version, moteur, puissance, transmission, carburant)
              VALUES (?, ?, ?, ?, ?, ?)`);
            for (const mot of model.motorisations) {
              motStmt.run(model.id, mot.version || '', mot.moteur || '', mot.puissance || '',
                mot.transmission || '', mot.carburant || '');
            }
            motStmt.finalize();
          }
          db.close();
          callback(null);
        });
    }
  });
}

function insertImages(modelId, images, callback) {
  const db = getDB();
  db.run(`DELETE FROM images WHERE model_id = ?`, [modelId], () => {
    const stmt = db.prepare(`INSERT INTO images (model_id, url, alt, is_primary) VALUES (?, ?, ?, ?)`);
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      stmt.run(modelId, img.url, img.alt || '', img.is_primary ? 1 : 0);
    }
    stmt.finalize();
    db.close();
    callback(null);
  });
}

function insertSpec(modelId, spec, callback) {
  const db = getDB();
  db.run(`DELETE FROM specifications WHERE model_id = ?`, [modelId], () => {
    const stmt = db.prepare(`INSERT INTO specifications 
      (model_id, longueur, largeur, hauteur, empattement, poids, coffre,
       cylindree, cylindres, turbo, vitesse_max, acceleration,
       conso_urbaine, conso_extra, conso_mixte, emission_co2, reservoir, roues, pneus)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    stmt.run(modelId, 
      spec.longueur || '', spec.largeur || '', spec.hauteur || '', spec.empattement || '',
      spec.poids || '', spec.coffre || '', spec.cylindree || '', spec.cylindres || '',
      spec.turbo || '', spec.vitesse_max || '', spec.acceleration || '',
      spec.conso_urbaine || '', spec.conso_extra || '', spec.conso_mixte || '',
      spec.emission_co2 || '', spec.reservoir || '', spec.roues || '', spec.pneus || '',
      (err) => { stmt.finalize(); db.close(); callback(err); }
    );
  });
}

function getAllBrands(callback) {
  const db = getDB();
  db.all(`SELECT * FROM brands ORDER BY nom`, [], (err, rows) => {
    db.close();
    callback(err, rows || []);
  });
}

function getBrandById(id, callback) {
  const db = getDB();
  db.get(`SELECT * FROM brands WHERE id = ?`, [id], (err, brand) => {
    if (err || !brand) { db.close(); callback(err, null); return; }
    db.all(`SELECT * FROM models WHERE marque = ?`, [brand.nom], (err2, models) => {
      if (err2 || !models.length) { db.close(); brand.modeles = models || []; callback(null, brand); return; }
      
      const modelIds = models.map(m => m.id);
      const placeholders = modelIds.map(() => '?').join(',');
      db.all(`SELECT * FROM motorisations WHERE model_id IN (${placeholders})`, modelIds, (err3, motors) => {
        const motorMap = {};
        for (const m of motors || []) {
          if (!motorMap[m.model_id]) motorMap[m.model_id] = [];
          motorMap[m.model_id].push(m);
        }
        for (const m of models) {
          m.motorisations = motorMap[m.id] || [];
        }
        brand.modeles = models;
        db.close();
        callback(null, brand);
      });
    });
  });
}

function getAllModels(filters = {}, callback) {
  const db = getDB();
  let sql = `SELECT m.*, GROUP_CONCAT(mot.carburant) as fuels 
    FROM models m 
    LEFT JOIN motorisations mot ON m.id = mot.model_id`;
  const conditions = [];
  const params = [];
  
  if (filters.marque) { conditions.push('m.marque = ?'); params.push(filters.marque); }
  if (filters.categorie) { conditions.push('m.categorie = ?'); params.push(filters.categorie); }
  if (filters.budget_min) { conditions.push('m.prix_min >= ?'); params.push(parseInt(filters.budget_min)); }
  if (filters.budget_max) { conditions.push('m.prix_max <= ?'); params.push(parseInt(filters.budget_max)); }
  if (filters.carburant) { conditions.push('mot.carburant = ?'); params.push(filters.carburant); }
  if (filters.search) {
    conditions.push('(m.nom LIKE ? OR m.marque LIKE ?)');
    params.push('%' + filters.search + '%', '%' + filters.search + '%');
  }
  
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' GROUP BY m.id';
  
  db.all(sql, params, (err, rows) => {
    if (err) { db.close(); callback(err, []); return; }
    
    const modelIds = rows.map(r => r.id);
    if (modelIds.length === 0) { db.close(); callback(null, rows); return; }
    
    const placeholders = modelIds.map(() => '?').join(',');
    db.all(`SELECT * FROM motorisations WHERE model_id IN (${placeholders})`, modelIds, (err2, motors) => {
      const motorMap = {};
      for (const m of motors || []) {
        if (!motorMap[m.model_id]) motorMap[m.model_id] = [];
        motorMap[m.model_id].push(m);
      }
      for (const row of rows) {
        row.motorisations = motorMap[row.id] || [];
      }
      db.close();
      callback(null, rows);
    });
  });
}

function getModelById(id, callback) {
  const db = getDB();
  db.get(`SELECT * FROM models WHERE id = ?`, [id], (err, model) => {
    if (err || !model) { db.close(); callback(err, null); return; }
    
    db.all(`SELECT * FROM motorisations WHERE model_id = ?`, [id], (err2, motors) => {
      model.motorisations = motors || [];
      
      db.all(`SELECT * FROM images WHERE model_id = ? ORDER BY is_primary DESC`, [id], (err3, images) => {
        model.images = images || [];
        
        db.get(`SELECT * FROM specifications WHERE model_id = ?`, [id], (err4, spec) => {
          model.specifications = spec || null;
          db.close();
          callback(null, model);
        });
      });
    });
  });
}

function getCategories(callback) {
  const db = getDB();
  // Exclure 'Non spécifiée' et les catégories vides
  db.all(`SELECT DISTINCT categorie FROM models WHERE categorie != '' AND categorie != 'Non spécifiée' AND categorie IS NOT NULL ORDER BY categorie`, [], (err, rows) => {
    db.close();
    callback(err, (rows || []).map(r => r.categorie));
  });
}

function getCarburants(callback) {
  const db = getDB();
  // Récupérer les carburants distincts depuis la table motorisations
  db.all(`SELECT DISTINCT carburant FROM motorisations WHERE carburant IS NOT NULL AND carburant != '' ORDER BY carburant`, [], (err, rows) => {
    db.close();
    const carbs = (rows || []).map(r => r.carburant);
    // Toujours inclure les 4 types de base si au moins un modèle les utilise
    callback(err, carbs);
  });
}

function getModelsByIds(ids, callback) {
  const db = getDB();
  const placeholders = ids.map(() => '?').join(',');
  db.all(`SELECT * FROM models WHERE id IN (${placeholders})`, ids, (err, rows) => {
    if (err) { db.close(); callback(err, []); return; }
    const modelIds = rows.map(r => r.id);
    if (modelIds.length === 0) { db.close(); callback(null, rows); return; }
    const motPlaceholders = modelIds.map(() => '?').join(',');
    db.all(`SELECT * FROM motorisations WHERE model_id IN (${motPlaceholders})`, modelIds, (err2, motors) => {
      const motorMap = {};
      for (const m of motors || []) {
        if (!motorMap[m.model_id]) motorMap[m.model_id] = [];
        motorMap[m.model_id].push(m);
      }
      for (const row of rows) {
        row.motorisations = motorMap[row.id] || [];
      }
      db.close();
      callback(null, rows);
    });
  });
}

function getPromos(callback) {
  const db = getDB();
  // Sélectionner les modèles avec les meilleurs rapports qualité/prix :
  // Hybrides et électriques récents, ou prix compétitifs dans leur catégorie
  const sql = `
    SELECT m.*, 
      ROUND(AVG(cat_avg.avg_price)) as cat_avg_price,
      ROUND((cat_avg.avg_price - m.prix_min) * 100.0 / cat_avg.avg_price) as remise_pct,
      GROUP_CONCAT(DISTINCT mot.carburant) as fuels
    FROM models m
    LEFT JOIN motorisations mot ON m.id = mot.model_id
    LEFT JOIN (
      SELECT categorie, AVG(prix_min) as avg_price 
      FROM models 
      WHERE categorie NOT IN ('', 'Non spécifiée') 
      GROUP BY categorie
    ) cat_avg ON m.categorie = cat_avg.categorie
    WHERE m.prix_min > 0
      AND m.categorie NOT IN ('', 'Non spécifiée')
    GROUP BY m.id
    HAVING (
      -- Modèles hybrides/électriques (tendance éco)
      (fuels LIKE '%Hybride%' OR fuels LIKE '%Électrique%')
      -- OU modèles sous la moyenne de leur catégorie (bonne affaire / promo)
      OR (cat_avg.avg_price > 0 AND m.prix_min < cat_avg.avg_price * 0.85)
      -- OU modèles récents (2025/2026)
      OR m.annee >= 2025
    )
    ORDER BY remise_pct DESC, m.prix_min ASC
    LIMIT 40
  `;
  db.all(sql, [], (err, rows) => {
    if (err) { db.close(); callback(err, []); return; }
    const modelIds = rows.map(r => r.id);
    if (!modelIds.length) { db.close(); callback(null, []); return; }
    const ph = modelIds.map(() => '?').join(',');
    db.all(`SELECT * FROM motorisations WHERE model_id IN (${ph})`, modelIds, (err2, motors) => {
      const mmap = {};
      for (const m of motors || []) {
        if (!mmap[m.model_id]) mmap[m.model_id] = [];
        mmap[m.model_id].push(m);
      }
      for (const r of rows) r.motorisations = mmap[r.id] || [];
      db.close();
      callback(null, rows);
    });
  });
}

module.exports = {
  initDB,
  insertBrand,
  insertModel,
  insertImages,
  insertSpec,
  getAllBrands,
  getBrandById,
  getAllModels,
  getModelById,
  getCategories,
  getCarburants,
  getModelsByIds,
  getPromos,
  getDB,
};
