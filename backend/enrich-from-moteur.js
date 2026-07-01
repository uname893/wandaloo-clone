const fs = require('fs');
const path = require('path');
module.paths.push(path.join(__dirname, 'node_modules'));
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const cheerio = require('cheerio');
const { getModelById, insertSpec } = require('./db');
const { enrichSingleModel } = require('./scripts/enrich-premium');

const DB_PATH = path.join(__dirname, 'data', 'autoguide.db');
const BASE_URL = 'https://www.moteur.ma';

// Helper to get DB connection
function getDB() {
  return new sqlite3.Database(DB_PATH);
}

// Sleep helper
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Get Gemini Key
async function getGeminiKey() {
  return new Promise((resolve) => {
    const db = getDB();
    db.get('SELECT value FROM settings WHERE id = 1', [], (err, row) => {
      db.close();
      if (err || !row) return resolve(process.env.GEMINI_API_KEY || '');
      try {
        const settings = JSON.parse(row.value);
        resolve(settings.gemini_api_key || process.env.GEMINI_API_KEY || '');
      } catch(e) {
        resolve(process.env.GEMINI_API_KEY || '');
      }
    });
  });
}

// Brand mapping helper
function mapBrand(brandSlug) {
  const b = brandSlug.toLowerCase().trim();
  if (b === 'lynk-et-co' || b === 'lynk & co') return 'lynk-co';
  return b;
}

// Model mapping helper
function mapModel(brand, modelSlug) {
  const m = modelSlug.toLowerCase().trim();
  if (brand === 'land-rover' && m.startsWith('defender')) return 'defender';
  if (brand === 'byd' && m === 'atto-3') return 'atto3';
  return m;
}

// Scrape specs from Moteur.ma version page
async function scrapeMoteurVersion(versionUrl) {
  console.log(`    🔗 Récupération de la version Moteur.ma : ${versionUrl}`);
  const res = await axios.get(versionUrl, {
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'fr-FR',
    }
  });

  const $ = cheerio.load(res.data);
  const spec = { options: {} };

  const fieldMap = {
    'longueur': 'longueur',
    'largeur': 'largeur',
    'hauteur': 'hauteur',
    'empattement': 'empattement',
    'poids à vide': 'poids',
    'poids': 'poids',
    'volume de coffre': 'coffre',
    'volume du coffre': 'coffre',
    'cylindrée': 'cylindree',
    'cylindres': 'cylindres',
    'architecture': 'cylindres',
    'turbo': 'turbo',
    'vitesse maximale': 'vitesse_max',
    'vitesse max': 'vitesse_max',
    'accélération': 'acceleration',
    '0–100': 'acceleration',
    'consommation urbaine': 'conso_urbaine',
    'consommation extra-urbaine': 'conso_extra',
    'consommation mixte': 'conso_mixte',
    'émissions de co2': 'emission_co2',
    'capacité du réservoir': 'reservoir',
    'jantes': 'roues',
    'taille des jantes': 'roues',
    'pneus': 'pneus'
  };

  $('tr').each((_, el) => {
    const key = $(el).find('td').first().text().trim().toLowerCase();
    const valText = $(el).find('td').last().text().trim();
    
    if (!key) return;

    let mapped = false;
    for (const [keyword, field] of Object.entries(fieldMap)) {
      if (key === keyword || key.includes(keyword)) {
        if (valText && valText !== '-') {
          spec[field] = valText.replace(/\s+/g, ' ');
          mapped = true;
        }
        break;
      }
    }

    if (!mapped) {
      const hasCheck = $(el).find('.text-success, .fa-check').length > 0;
      const hasCross = $(el).find('.text-danger, .fa-times').length > 0;
      
      const optionKey = key.charAt(0).toUpperCase() + key.slice(1);
      if (hasCheck) {
        spec.options[optionKey] = 'Oui';
      } else if (hasCross) {
        spec.options[optionKey] = 'Non';
      }
    }
  });

  return spec;
}

// Scrape model from Moteur.ma
async function scrapeMoteurModel(model) {
  let brandSlug = '';
  let modelSlug = '';

  // Extract from fiche_url if present
  if (model.fiche_url && model.fiche_url.startsWith('/neuf/')) {
    const parts = model.fiche_url.split('/').filter(Boolean);
    if (parts.length >= 3) {
      brandSlug = mapBrand(parts[1]);
      modelSlug = mapModel(brandSlug, parts[2]);
    }
  }

  if (!brandSlug || !modelSlug) {
    brandSlug = mapBrand(model.marque);
    modelSlug = mapModel(brandSlug, model.nom.replace(/\s+/g, '-').toLowerCase());
  }

  const modelUrl = `${BASE_URL}/fr/neuf/voiture/${brandSlug}/${modelSlug}/`;
  console.log(`  🔍 Recherche sur Moteur.ma pour : ${model.marque} ${model.nom} -> ${modelUrl}`);

  try {
    const res = await axios.get(modelUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });

    const finalUrl = res.request.res.responseUrl;
    if (finalUrl.includes('status=modele_introuvable')) {
      console.log(`    ⚠️ Modèle non trouvé sur Moteur.ma (redirection vers page d'accueil)`);
      return null;
    }

    const $ = cheerio.load(res.data);
    let versionUrl = '';

    $('a').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (href.includes(`/neuf/voiture/${brandSlug}/${modelSlug}/`) && href.endsWith('.html') && !versionUrl) {
        versionUrl = href.startsWith('http') ? href : BASE_URL + href;
      }
    });

    if (!versionUrl) {
      console.log(`    ⚠️ Aucune version disponible trouvée pour ${model.nom} sur Moteur.ma.`);
      return null;
    }

    const spec = await scrapeMoteurVersion(versionUrl);
    return spec;

  } catch (e) {
    console.log(`    ❌ Erreur lors du scraping Moteur.ma pour ${model.nom} : ${e.message}`);
    return null;
  }
}

async function runEnrichment() {
  console.log('🚀 Démarrage de l\'enrichissement hybride (Moteur.ma + IA Gemini)...');
  const db = getDB();
  const apiKey = await getGeminiKey();

  // Query empty models
  const emptyModels = await new Promise((resolve, reject) => {
    db.all(`
      SELECT m.id, m.nom, m.marque, m.fiche_url, m.annee, m.categorie 
      FROM models m 
      LEFT JOIN specifications s ON m.id = s.model_id 
      WHERE s.model_id IS NULL OR s.longueur = '' OR s.longueur IS NULL OR s.coffre = '' OR s.coffre IS NULL
    `, [], (err, rows) => {
      if (err) reject(err); else resolve(rows || []);
    });
  });

  console.log(`Trouvé ${emptyModels.length} modèles avec fiches techniques manquantes.`);
  db.close();

  let countMoteur = 0;
  let countGemini = 0;

  for (let i = 0; i < emptyModels.length; i++) {
    const model = emptyModels[i];
    console.log(`\n[${i + 1}/${emptyModels.length}] Traitement de : ${model.marque} ${model.nom} (ID: ${model.id})`);

    // 1. Try Moteur.ma first
    const spec = await scrapeMoteurModel(model);

    if (spec && Object.keys(spec).length > 1) {
      // Success! Insert spec into DB
      await new Promise((resolve) => {
        const activeDB = getDB();
        insertSpec(model.id, spec, (err) => {
          activeDB.close();
          if (err) console.error(`    ❌ Erreur SQL insert specs pour ${model.nom}:`, err.message);
          else console.log(`    ✅ Fiche technique importée avec succès de Moteur.ma (${Object.keys(spec).length - 1} specs, ${Object.keys(spec.options).length} options)`);
          resolve();
        });
      });
      countMoteur++;
    } else {
      // 2. Fallback to Gemini AI
      if (apiKey) {
        console.log(`    💡 Modèle non disponible sur Moteur.ma. Lancement du fallback IA Gemini...`);
        const activeDB = getDB();
        await enrichSingleModel(activeDB, model, apiKey);
        activeDB.close();
        countGemini++;
        // Wait to respect API limits
        await sleep(4500);
      } else {
        console.log(`    ⚠️ Modèle non disponible sur Moteur.ma et clé API Gemini manquante. Passé.`);
      }
    }

    // Small delay between requests to be gentle
    await sleep(1500);
  }

  console.log('\n==================================================');
  console.log('🎉 Enrichissement hybride terminé !');
  console.log(`  - Importés depuis Moteur.ma : ${countMoteur}`);
  console.log(`  - Générés par IA Gemini (fallback) : ${countGemini}`);
  console.log('==================================================\n');
}

if (require.main === module) {
  runEnrichment().catch(console.error);
}
