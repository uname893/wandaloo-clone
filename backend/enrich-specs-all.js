const axios = require('axios');
const cheerio = require('cheerio');
const dns = require('dns');
const { initDB, getAllModels, insertSpec } = require('./db');

// Fix DNS resolution issues on Windows for Node.js
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const BASE_URL = 'https://www.wandaloo.com';

const axiosInstance = axios.create({
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'fr-FR'
  }
});

async function fetchHTML(url) {
  const res = await axiosInstance.get(url);
  return res.data;
}

// Maps labels to database fields
const fieldMap = {
  'longueur': 'longueur',
  'largeur': 'largeur',
  'hauteur': 'hauteur',
  'empattement': 'empattement',
  'poids à vide': 'poids',
  'poids': 'poids',
  'volume de coffre': 'coffre',
  'volume du coffre': 'coffre',
  'coffre': 'coffre',
  'cylindrée': 'cylindree',
  'cylindres': 'cylindres',
  'architecture': 'cylindres',
  'turbo': 'turbo',
  'vitesse maxi.': 'vitesse_max',
  'vitesse max': 'vitesse_max',
  'accélération 0-100 km/h': 'acceleration',
  'accélération': 'acceleration',
  '0-100': 'acceleration',
  'conso. urbaine': 'conso_urbaine',
  'conso. extra': 'conso_extra',
  'conso. mixte': 'conso_mixte',
  'emission co2': 'emission_co2',
  'émission co2': 'emission_co2',
  'volume du réservoir': 'reservoir',
  'réservoir': 'reservoir',
  'roues': 'roues',
  'pneus': 'pneus'
};

async function scrapeSpecsForModel(model) {
  const rangeUrl = model.fiche_url.startsWith('http') ? model.fiche_url : BASE_URL + model.fiche_url;
  
  try {
    console.log(`  📄 Chargement de la gamme pour : ${model.nom} -> ${rangeUrl}`);
    const rangeHtml = await fetchHTML(rangeUrl);
    const $range = cheerio.load(rangeHtml);
    
    // Trouver le premier lien de fiche technique detaillée
    let versionUrl = '';
    $range('a').each((_, el) => {
      const href = $range(el).attr('href') || '';
      if (href.includes('/fiche-technique/') && !versionUrl) {
        versionUrl = href.startsWith('http') ? href : BASE_URL + href;
      }
    });

    if (!versionUrl) {
      console.log(`    ⚠️ Aucun lien de fiche technique trouvé pour ${model.nom}.`);
      return false;
    }

    console.log(`    🔗 Chargement de la version : ${versionUrl}`);
    const versionHtml = await fetchHTML(versionUrl);
    const $version = cheerio.load(versionHtml);

    const spec = { options: {} };
    
    // Parser les specifications de type li > .param + .value
    $version('li').each((_, el) => {
      const paramText = $version(el).find('.param').text().trim();
      const valueText = $version(el).find('.value').text().trim();
      
      if (paramText && valueText) {
        const paramLower = paramText.toLowerCase();
        
        let mapped = false;
        for (const [key, field] of Object.entries(fieldMap)) {
          if (paramLower === key || paramLower.includes(key)) {
            spec[field] = valueText.replace(/\s+/g, ' ');
            mapped = true;
            break;
          }
        }
        
        // Si ce n'est pas une spec technique principale, c'est une option/équipement
        if (!mapped) {
          spec.options[paramText] = valueText;
        }
      }
    });

    // Enregistrer dans la base de données
    await new Promise((resolve, reject) => {
      insertSpec(model.id, spec, (err) => {
        if (err) reject(err); else resolve();
      });
    });

    console.log(`    ✅ Fiche technique importée (${Object.keys(spec).length - 1} specs, ${Object.keys(spec.options).length} options)`);
    return true;
  } catch (e) {
    console.log(`    ❌ Erreur lors du scraping de ${model.nom} : ${e.message}`);
    return false;
  }
}

async function run() {
  console.log('🚀 Démarrage de l\'enrichissement des fiches techniques...');
  initDB();

  const models = await new Promise((resolve, reject) => {
    getAllModels({}, (err, rows) => {
      if (err) reject(err); else resolve(rows || []);
    });
  });

  // Filtrer les modèles qui n'ont pas encore de spécifications remplies
  const modelsToProcess = [];
  const db = require('./db').getDB();
  
  await new Promise((resolve) => {
    db.all("SELECT model_id FROM specifications WHERE longueur != '' OR coffre != ''", [], (err, rows) => {
      const filledIds = new Set((rows || []).map(r => r.model_id));
      for (const m of models) {
        if (!filledIds.has(m.id) && m.fiche_url) {
          modelsToProcess.push(m);
        }
      }
      db.close();
      resolve();
    });
  });

  console.log(`Trouvé ${models.length} modèles au total. Reste ${modelsToProcess.length} à traiter.`);

  // Traiter par lots de 4 pour être rapide mais ne pas surcharger le serveur wandaloo
  const batchSize = 4;
  for (let i = 0; i < modelsToProcess.length; i += batchSize) {
    const batch = modelsToProcess.slice(i, i + batchSize);
    console.log(`\nLot ${Math.floor(i / batchSize) + 1} / ${Math.ceil(modelsToProcess.length / batchSize)} :`);
    
    await Promise.all(batch.map(async (model) => {
      await scrapeSpecsForModel(model);
      // Petit délai individuel
      await new Promise(r => setTimeout(r, 600));
    }));
  }

  console.log('\n🎉 Enrichissement des fiches techniques terminé !');
}

run().catch(console.error);
