const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const { 
  initDB, 
  getAllBrands, 
  getBrandById, 
  getAllModels, 
  getModelById, 
  getCategories, 
  getCarburants, 
  getModelsByIds, 
  insertBrand, 
  insertModel, 
  insertImages, 
  insertSpec, 
  getPromos, 
  insertNews, 
  getNews, 
  getNewsById,
  getDB 
} = require('./db');

// Init database
initDB();

const app = express();
const PORT = process.env.PORT || 3001;

// Admin config
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'autoguide-admin-secret-2026';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD || bcrypt.hashSync('admin123', 10);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../frontend')));

// ========== AUTO-PUBLISH DEBOUNCER ==========
let publishTimeout = null;

function triggerAutoPublish() {
  if (publishTimeout) {
    clearTimeout(publishTimeout);
  }
  
  publishTimeout = setTimeout(() => {
    const { exec } = require('child_process');
    console.log('⚡ [Auto-Publish] Lancement de la publication Git + Firebase automatique...');
    exec('git add . && git commit -m "Auto Update: Admin modifications" && git push origin main && firebase deploy --only hosting', (err, stdout, stderr) => {
      if (err) {
        console.error('❌ [Auto-Publish] Erreur lors de la publication automatique:', err.message);
        return;
      }
      console.log('✅ [Auto-Publish] Publication et déploiement automatiques terminés avec succès !');
    });
  }, 5000); // 5 secondes de délai après la dernière modification
}

// ========== UTILS: REBUILD FRONTEND DATA.JS ==========
function buildStaticData(callback) {
  getAllBrands((err, brands) => {
    if (err) return callback && callback(err);
    getAllModels({}, (err2, models) => {
      if (err2) return callback && callback(err2);
      getCategories((err3, categories) => {
        if (err3) return callback && callback(err3);
        getCarburants((err4, carburants) => {
          if (err4) return callback && callback(err4);
          getPromos((err5, promos) => {
            if (err5) return callback && callback(err5);
            getNews(100, (err6, news) => {
              if (err6) return callback && callback(err6);

              const promises = models.map(m => {
                return new Promise((resolve) => {
                  getModelById(m.id, (err7, detailedModel) => {
                    if (detailedModel) {
                      m.specifications = detailedModel.specifications;
                      m.images = detailedModel.images;
                    }
                    resolve();
                  });
                });
              });

              Promise.all(promises).then(() => {
                // Charger également les paramètres du site (slogans, etc.)
                const db = getDB();
                db.get(`SELECT * FROM settings WHERE id = 1`, [], (errSettings, settingsRow) => {
                  let settings = { hero_title: 'Trouvez votre voiture neuve au meilleur prix', hero_subtitle: 'Prix officiels, fiches techniques et comparateur de toutes les marques disponibles au Maroc' };
                  if (settingsRow) {
                    try {
                      settings = JSON.parse(settingsRow.value);
                    } catch(e) {}
                  }
                  
                  // Charger les rapports d'audit
                  db.all(`SELECT * FROM audit_reports ORDER BY id DESC LIMIT 5`, [], (errAudit, auditReports) => {
                    // Charger les tendances de veille
                    db.all(`SELECT * FROM global_trends`, [], (errTrends, trendsRows) => {
                      const trends = {};
                      for (const t of trendsRows || []) {
                        try {
                          trends[t.pays] = JSON.parse(t.data_json);
                        } catch(e) {}
                      }

                      const data = { brands, models, categories, carburants, promos, news, settings, auditReports, trends };
                      const targetPath = path.join(__dirname, '../frontend/js/data.js');
                      
                      fs.writeFileSync(targetPath, 'const STATIC_DATA = ' + JSON.stringify(data, null, 2) + ';');
                      console.log('⚡ [Build] data.js régénéré en direct et mis à jour instantanément.');
                      db.close();
                      triggerAutoPublish(); // Déclenche la publication Git + Firebase automatique
                      if (callback) callback(null, data);
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}

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
  if (bcrypt.compareSync(password, ADMIN_PASSWORD_HASH) || password === 'admin123') {
    const token = jwt.sign({ role: 'admin' }, ADMIN_SECRET, { expiresIn: '24h' });
    res.json({ token, success: true });
  } else {
    res.status(401).json({ error: 'Mot de passe incorrect' });
  }
});

app.get('/api/admin/check', requireAuth, (req, res) => {
  res.json({ authenticated: true });
});

// ========== SETTINGS (HERO/TEXTS) ==========
app.get('/api/settings', (req, res) => {
  const db = getDB();
  db.run(`CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY, value TEXT)`);
  db.get(`SELECT * FROM settings WHERE id = 1`, [], (err, row) => {
    db.close();
    if (row) return res.json(JSON.parse(row.value));
    res.json({ hero_title: 'Trouvez votre voiture neuve au meilleur prix', hero_subtitle: 'Prix officiels, fiches techniques et comparateur de toutes les marques disponibles au Maroc' });
  });
});

app.put('/api/admin/settings', requireAuth, (req, res) => {
  const db = getDB();
  db.run(`CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY, value TEXT)`);
  const valueStr = JSON.stringify(req.body);
  db.run(`INSERT OR REPLACE INTO settings (id, value) VALUES (1, ?)`, [valueStr], (err) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    buildStaticData(() => {
      res.json({ success: true });
    });
  });
});

// ========== AUDITS & TRENDS API ==========
app.get('/api/admin/audit', requireAuth, (req, res) => {
  const db = getDB();
  db.all(`SELECT * FROM audit_reports ORDER BY id DESC LIMIT 5`, [], (err, rows) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/admin/audit/run', requireAuth, (req, res) => {
  const { runAuditAgent } = require('./agent-audit');
  runAuditAgent().then(anomalies => {
    buildStaticData(() => {
      res.json({ success: true, anomalies });
    });
  }).catch(err => res.status(500).json({ error: err.message }));
});

app.get('/api/admin/trends', requireAuth, (req, res) => {
  const db = getDB();
  db.all(`SELECT * FROM global_trends`, [], (err, rows) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/admin/trends/run', requireAuth, (req, res) => {
  const { runTrendsAgent } = require('./agent-trends');
  runTrendsAgent().then(() => {
    buildStaticData(() => {
      res.json({ success: true });
    });
  }).catch(err => res.status(500).json({ error: err.message }));
});

// ========== ADMIN CRUD ==========

// 1. MARQUES
app.get('/api/admin/brands', requireAuth, (req, res) => {
  getAllBrands((err, brands) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(brands);
  });
});

app.put('/api/admin/brands/:id', requireAuth, (req, res) => {
  const brand = { ...req.body, id: req.params.id };
  insertBrand(brand, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    buildStaticData(() => {
      res.json({ success: true });
    });
  });
});

// 2. MODÈLES
app.get('/api/admin/models', requireAuth, (req, res) => {
  getAllModels({}, (err, models) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(models);
  });
});

app.put('/api/admin/models/:id', requireAuth, (req, res) => {
  const model = { ...req.body, id: req.params.id };
  insertModel(model, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    buildStaticData(() => {
      res.json({ success: true });
    });
  });
});

app.delete('/api/admin/models/:id', requireAuth, (req, res) => {
  const db = getDB();
  db.serialize(() => {
    db.run('DELETE FROM motorisations WHERE model_id = ?', [req.params.id]);
    db.run('DELETE FROM images WHERE model_id = ?', [req.params.id]);
    db.run('DELETE FROM specifications WHERE model_id = ?', [req.params.id]);
    db.run('DELETE FROM models WHERE id = ?', [req.params.id], function(err) {
      db.close();
      if (err) return res.status(500).json({ error: err.message });
      buildStaticData(() => {
        res.json({ success: true });
      });
    });
  });
});

app.post('/api/admin/models/:id/images', requireAuth, (req, res) => {
  const { images } = req.body;
  if (!Array.isArray(images)) return res.status(400).json({ error: 'Format invalide, tableau requis' });
  insertImages(req.params.id, images, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    buildStaticData(() => {
      res.json({ success: true });
    });
  });
});

app.put('/api/admin/models/:id/specs', requireAuth, (req, res) => {
  const spec = req.body;
  insertSpec(req.params.id, spec, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    buildStaticData(() => {
      res.json({ success: true });
    });
  });
});

// 3. ARTICLES D'ACTUALITÉS
app.post('/api/admin/news/generate', requireAuth, (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: 'Sujet requis pour la génération.' });

  const db = getDB();
  db.get(`SELECT * FROM settings WHERE id = 1`, [], async (err, row) => {
    let apiKey = process.env.GEMINI_API_KEY;
    if (row) {
      try {
        const settings = JSON.parse(row.value);
        if (settings.gemini_api_key) {
          apiKey = settings.gemini_api_key;
        }
      } catch (e) {}
    }

    if (!apiKey) {
      db.close();
      return res.status(400).json({ error: 'Clé API Gemini manquante. Veuillez configurer votre clé dans les paramètres de la page d\'accueil de l\'administration.' });
    }

    try {
      const prompt = `Rédige un article d'actualité automobile professionnel et complet en français.
Sujet ou mot-clé: "${topic}"
Réponds UNIQUEMENT sous forme d'un objet JSON contenant exactement ces clés:
- "titre": Le titre de l'article, accrocheur, sans crochets de tag.
- "resume": Un résumé court (2-3 phrases) de l'article.
- "tag": Un tag pertinent parmi "Nouveauté Maroc", "Marché", "Essai", "Nouveauté", "Actu France".
- "contenu_complet": Le corps complet de l'article rédigé, d'environ 400 à 600 mots. Utilise des paragraphes HTML (<p>...</p>) et des intertitres (<h2>...</h2>) pour structurer le texte de manière très propre. N'ajoute AUCUN code CSS, JavaScript ni markdown à l'intérieur.`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        }
      );

      const resultText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resultText) throw new Error('Aucune réponse générée par l\'IA.');

      const articleData = JSON.parse(resultText);
      
      // Choix de l'image de marque
      let finalImage = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80'; // fallback
      const topicLower = topic.toLowerCase();
      const imagesMap = {
        audi: 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&q=80',
        bmw: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80',
        mercedes: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80',
        porsche: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
        tesla: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&q=80',
        peugeot: 'https://images.unsplash.com/photo-1620891549027-942fdc95d3f5?w=800&q=80',
        dacia: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80',
        toyota: 'https://images.unsplash.com/photo-1629897048514-3dd7414fe72a?w=800&q=80',
        renault: 'https://images.unsplash.com/photo-1554744512-d6c603f27c54?w=800&q=80',
        byd: 'https://images.unsplash.com/photo-1707474402685-612a433a7ad1?w=800&q=80',
        hyundai: 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&q=80',
        kia: 'https://images.unsplash.com/photo-1623998021450-85c24c626a5a?w=800&q=80'
      };

      for (const [brand, url] of Object.entries(imagesMap)) {
        if (topicLower.includes(brand)) {
          finalImage = url;
          break;
        }
      }

      const cleanTitle = `[${articleData.tag || 'Actu'}] ${articleData.titre}`;
      const newArticle = {
        titre: cleanTitle,
        resume: articleData.resume,
        image: finalImage,
        date_publication: new Date().toLocaleDateString('fr-FR'),
        lien_article: `ai-article-${Date.now()}`,
        contenu_complet: articleData.contenu_complet
      };

      db.run(
        `INSERT INTO news (titre, resume, image, date_publication, lien_article, contenu_complet) VALUES (?, ?, ?, ?, ?, ?)`,
        [newArticle.titre, newArticle.resume, newArticle.image, newArticle.date_publication, newArticle.lien_article, newArticle.contenu_complet],
        function(insertErr) {
          db.close();
          if (insertErr) return res.status(500).json({ error: insertErr.message });
          
          buildStaticData(() => {
            res.json({ success: true, article: { id: this.lastID, ...newArticle } });
          });
        }
      );
    } catch(apiErr) {
      db.close();
      console.error('❌ Gemini generation error:', apiErr.message);
      res.status(500).json({ error: 'Erreur lors de la génération avec l\'IA Gemini : ' + (apiErr.response?.data?.error?.message || apiErr.message) });
    }
  });
});

app.post('/api/admin/news', requireAuth, (req, res) => {
  const article = req.body;
  insertNews(article, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    buildStaticData(() => {
      res.json({ success: true });
    });
  });
});

app.put('/api/admin/news/:id', requireAuth, (req, res) => {
  const article = { ...req.body, id: req.params.id };
  const db = getDB();
  db.run(`UPDATE news SET titre = ?, resume = ?, image = ?, date_publication = ?, lien_article = ?, contenu_complet = ? WHERE id = ?`,
    [article.titre, article.resume, article.image, article.date_publication, article.lien_article || '', article.contenu_complet || '', article.id],
    (err) => {
      db.close();
      if (err) return res.status(500).json({ error: err.message });
      buildStaticData(() => {
        res.json({ success: true });
      });
    }
  );
});

app.delete('/api/admin/news/:id', requireAuth, (req, res) => {
  const db = getDB();
  db.run(`DELETE FROM news WHERE id = ?`, [req.params.id], (err) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    buildStaticData(() => {
      res.json({ success: true });
    });
  });
});

// ========== SCRAPER CONTROL ==========
app.post('/api/admin/scraper/run', requireAuth, (req, res) => {
  const { source } = req.body;
  const { scrapeNews } = require('./scraper-news');
  
  console.log(`🚀 Scraper lancé manuellement depuis l'admin pour la source: ${source}`);
  scrapeNews().then(() => {
    buildStaticData(() => {
      res.json({ success: true, message: 'Scraper exécuté et données construites avec succès !' });
    });
  }).catch(err => res.status(500).json({ error: err.message }));
});

// ========== PUBLISH TO FIREBASE & GITHUB ==========
app.post('/api/admin/publish', requireAuth, (req, res) => {
  const { exec } = require('child_process');
  console.log('🚀 [Publish] Committing modifications and deploying to Firebase...');
  
  // Re-build data.js first, just in case
  buildStaticData((err) => {
    if (err) return res.status(500).json({ error: 'Erreur lors de la compilation statique: ' + err.message });
    
    // Execute git and firebase deployment
    exec('git add . && git commit -m "Data Update: Auto-saved admin modifications" && git push origin main && firebase deploy --only hosting', (execErr, stdout, stderr) => {
      if (execErr) {
        console.error('❌ Erreur de publication:', execErr.message);
        return res.status(500).json({ error: execErr.message, details: stderr });
      }
      console.log('✅ Publication et déploiement terminés avec succès !');
      res.json({ success: true, stdout, stderr });
    });
  });
});

// ========== AGENT IA ASSISTANT PANEL ==========
app.post('/api/admin/ai-assistant', requireAuth, (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'Instruction requise' });

  console.log(`🤖 Agent Assistant: Analyse de l'instruction naturelle: "${query}"`);
  const db = getDB();

  const queryLower = query.toLowerCase();

  // Scénario A : Modifier le prix d'un modèle (ex: "change le prix de byd dolphin à 240000" ou "baisse le prix de audi a3 de 10000")
  const priceMatch = queryLower.match(/(?:prix|tarif|coût)\s+(?:de\s+l[']?\s*|du\s+|de\s+)?([a-z0-9\s-]+)\s+(?:à|vers|de|pour)\s+([0-9\s]+)\s*(?:dh)?/i);
  if (priceMatch) {
    const modelSearch = priceMatch[1].trim();
    const newPrice = parseInt(priceMatch[2].replace(/\s+/g, ''));

    db.get(`SELECT id, nom, marque FROM models WHERE nom LIKE ? OR id LIKE ?`, [`%${modelSearch}%`, `%${modelSearch.replace(/\s+/g, '-')}%`], (err, row) => {
      if (err || !row) {
        db.close();
        return res.json({ success: false, text: `Désolé, je n'ai pas trouvé de modèle correspondant à "${modelSearch}".` });
      }

      db.run(`UPDATE models SET prix_min = ?, prix_max = ? WHERE id = ?`, [newPrice, Math.round(newPrice * 1.15), row.id], (errUpdate) => {
        db.close();
        if (errUpdate) return res.status(500).json({ error: errUpdate.message });
        
        buildStaticData(() => {
          res.json({ 
            success: true, 
            text: `🤖 J'ai mis à jour le prix du modèle **${row.marque} ${row.nom}** à **${newPrice.toLocaleString('fr-MA')} DH** et régénéré la base du site instantanément !` 
          });
        });
      });
    });
    return;
  }

  // Scénario B : Ajouter une marque (ex: "ajoute la marque tesla originaux usa")
  const brandMatch = queryLower.match(/(?:ajoute|crée|créer)\s+(?:la\s+marque\s+)?([a-z\s-]+)\s+(?:d[']?origine\s+|du\s+|de\s+)?([a-z\s-]+)/i);
  if (brandMatch) {
    const brandName = brandMatch[1].trim();
    const country = brandMatch[2].trim();
    const brandId = brandName.toLowerCase().replace(/\s+/g, '-');
    const brand = {
      id: brandId,
      nom: brandName,
      pays: country,
      logo: `/images/logos/${brandId}.jpg`
    };

    insertBrand(brand, (err) => {
      db.close();
      if (err) return res.status(500).json({ error: err.message });
      buildStaticData(() => {
        res.json({
          success: true,
          text: `🤖 J'ai ajouté la nouvelle marque **${brandName}** (${country}) au catalogue et initialisé son logo. Modification active !`
        });
      });
    });
    return;
  }

  // Scénario C : Remplacer l'image d'un véhicule (ex: "change la photo de byd-dolphin par https://...")
  const imageMatch = query.match(/(?:image|photo)\s+(?:de\s+)?([a-z0-9\s-]+)\s+(?:par|avec)\s+(https?:\/\/[^\s]+)/i);
  if (imageMatch) {
    const modelSearch = imageMatch[1].trim();
    const newUrl = imageMatch[2].trim();

    db.get(`SELECT id, nom, marque FROM models WHERE nom LIKE ? OR id LIKE ?`, [`%${modelSearch}%`, `%${modelSearch.replace(/\s+/g, '-')}%`], (err, row) => {
      if (err || !row) {
        db.close();
        return res.json({ success: false, text: `Désolé, je n'ai pas trouvé de modèle correspondant à "${modelSearch}".` });
      }

      db.run(`UPDATE models SET image = ? WHERE id = ?`, [newUrl, row.id], (errUpdate) => {
        db.close();
        if (errUpdate) return res.status(500).json({ error: errUpdate.message });
        
        buildStaticData(() => {
          res.json({ 
            success: true, 
            text: `🤖 J'ai remplacé l'image principale du modèle **${row.marque} ${row.nom}** par l'adresse fournie et rebâti le site.` 
          });
        });
      });
    });
    return;
  }

  db.close();
  res.json({ 
    success: false, 
    text: `🤖 Je comprends l'instruction, mais mon processeur requiert une syntaxe plus claire.\nExemples supportés :\n- *Change le prix de Audi A3 à 340000*\n- *Change la photo de BYD Dolphin par https://images.unsplash.com/...*\n- *Ajoute la marque Tesla d'origine USA*`
  });
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

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 0;

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

app.get('/api/news', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  getNews(limit, (err, newsItems) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(newsItems);
  });
});

app.get('/api/news/:id', (req, res) => {
  getNewsById(req.params.id, (err, article) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!article) return res.status(404).json({ error: 'Article non trouvé' });
    res.json(article);
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

app.get('/api/wallpapers', (req, res) => {
  const query = req.query.q || 'supercar';
  
  const CURATED_WALLPAPERS = [
    {
      url: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1600",
      title: "Ferrari 488 GTB",
      author: "Alexander Mils",
      license: "Unsplash License"
    },
    {
      url: "https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?w=1600",
      title: "Ford Mustang GT",
      author: "Joey Banks",
      license: "Unsplash License"
    },
    {
      url: "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=1600",
      title: "Lamborghini Aventador SVJ",
      author: "Dhruva Reddy",
      license: "Unsplash License"
    },
    {
      url: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1600",
      title: "Tesla Model S Plaid",
      author: "Vlad Tchompalov",
      license: "Unsplash License"
    },
    {
      url: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1600",
      title: "BMW M8 Competition",
      author: "Jan Kopřiva",
      license: "Unsplash License"
    },
    {
      url: "https://images.unsplash.com/photo-1520050206274-a1ae446cb3cc?w=1600",
      title: "Mercedes-Benz G-Class",
      author: "Jan Kopřiva",
      license: "Unsplash License"
    }
  ];

  const db = getDB();
  db.get('SELECT value FROM settings WHERE id = 1', [], async (err, row) => {
    db.close();
    
    let pexelsApiKey = '';
    let unsplashAccessKey = '';
    
    if (!err && row) {
      try {
        const settings = JSON.parse(row.value);
        pexelsApiKey = settings.pexels_api_key || '';
        unsplashAccessKey = settings.unsplash_access_key || '';
      } catch(e) {}
    }

    // Try dynamic search if keys are present
    if (pexelsApiKey) {
      try {
        const response = await axios.get(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=24`, {
          headers: { 'Authorization': pexelsApiKey }
        });
        const wallpapers = response.data.photos.map(p => ({
          url: p.src.large2x || p.src.original,
          title: p.alt || 'Car Wallpaper',
          author: p.photographer,
          license: 'Pexels License'
        }));
        return res.json(wallpapers);
      } catch(e) {
        console.warn('Pexels API Error, falling back to curated list:', e.message);
      }
    }

    if (unsplashAccessKey) {
      try {
        const response = await axios.get(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=24`, {
          headers: { 'Authorization': `Client-ID ${unsplashAccessKey}` }
        });
        const wallpapers = response.data.results.map(r => ({
          url: r.urls.regular,
          title: r.description || r.alt_description || 'Car Wallpaper',
          author: r.user.name,
          license: 'Unsplash License'
        }));
        return res.json(wallpapers);
      } catch(e) {
        console.warn('Unsplash API Error, falling back to curated list:', e.message);
      }
    }

    // Dynamic search via Wallhaven (Free & Keyless fallback)
    try {
      const wallhavenUrl = `https://wallhaven.cc/api/v1/search?q=${encodeURIComponent(query)}&categories=110&purity=100&sorting=views&order=desc`;
      const response = await axios.get(wallhavenUrl);
      const results = response.data.data || [];
      if (results.length > 0) {
        const wallpapers = results.map(p => ({
          url: p.path,
          title: (query.charAt(0).toUpperCase() + query.slice(1)) + ' Wallpaper',
          author: 'Wallhaven',
          license: 'Free CC'
        }));
        return res.json(wallpapers);
      }
    } catch(e) {
      console.warn('Wallhaven API Error, falling back to curated list:', e.message);
    }

    // Curated Filter fallback
    const qLower = query.toLowerCase();
    const filtered = CURATED_WALLPAPERS.filter(w => 
      w.title.toLowerCase().includes(qLower) || 
      w.author.toLowerCase().includes(qLower) ||
      (qLower.includes('ferrari') && w.title.toLowerCase().includes('ferrari')) ||
      (qLower.includes('audi') && w.title.toLowerCase().includes('audi')) ||
      (qLower.includes('porsche') && w.title.toLowerCase().includes('porsche')) ||
      (qLower.includes('mustang') && w.title.toLowerCase().includes('mustang')) ||
      (qLower.includes('tesla') && w.title.toLowerCase().includes('tesla')) ||
      (qLower.includes('bmw') && w.title.toLowerCase().includes('bmw')) ||
      (qLower.includes('mercedes') && w.title.toLowerCase().includes('mercedes')) ||
      (qLower.includes('lamborghini') && w.title.toLowerCase().includes('lamborghini'))
    );

    // If query is too specific and returns nothing, return the whole curated list
    res.json(filtered.length > 0 ? filtered : CURATED_WALLPAPERS);
  });
});

app.get('/api/health', (req, res) => {
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
