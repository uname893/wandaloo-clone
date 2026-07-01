const fs = require('fs');
const path = require('path');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '../data/autoguide.db');

// Helper to sleep
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function getGeminiKey() {
  return new Promise((resolve) => {
    const db = new sqlite3.Database(dbPath);
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

async function fetchCarImage(brand, model) {
  const query = `${brand} ${model}`;
  
  // 1. Try Wallhaven
  try {
    const wallUrl = `https://wallhaven.cc/api/v1/search?q=${encodeURIComponent(query)}&categories=110&purity=100&sorting=relevance`;
    const res = await axios.get(wallUrl, { timeout: 5000 });
    const items = res.data?.data || [];
    if (items.length > 0) {
      return items[0].path;
    }
  } catch(e) {
    // Fail silently to next fallback
  }

  // 2. Try Openverse (Flickr/Others without Wikimedia)
  try {
    const openUrl = `https://api.openverse.engineering/v1/images/?q=${encodeURIComponent(query)}`;
    const res = await axios.get(openUrl, { timeout: 5000 });
    const items = res.data?.results || [];
    
    // Strict exclusion of Wikimedia/Wikipedia
    const cleanItems = items.filter(img => img.url && !img.url.includes('wikimedia') && !img.url.includes('wikipedia'));
    
    if (cleanItems.length > 0) {
      const flickrImg = cleanItems.find(img => img.url && img.url.includes('flickr'));
      if (flickrImg) return flickrImg.url;
      return cleanItems[0].url;
    }
  } catch(e) {
    // Fail silently
  }

  // Fallback to beautiful stock car
  return 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800';
}

async function enrichSingleModel(db, model, apiKey) {
  console.log(`\n🚙 Enrichissement de : ${model.marque} ${model.nom} (${model.annee})...`);
  
  // 1. Fetch clean global HD image
  const hdImage = await fetchCarImage(model.marque, model.nom);
  console.log(`   🖼️ Image HD trouvée : ${hdImage}`);

  // Update model cover image in SQLite (preserve price!)
  await new Promise((resolve) => {
    db.run('UPDATE models SET image = ? WHERE id = ?', [hdImage, model.id], (err) => {
      if (err) console.error('   ❌ Erreur de mise à jour de l\'image:', err.message);
      else console.log('   ✅ Image mise à jour dans la table models.');
      resolve();
    });
  });

  // Add the HD image as primary in the images table if not exists
  await new Promise((resolve) => {
    db.get('SELECT id FROM images WHERE model_id = ? AND url = ?', [model.id, hdImage], (err, row) => {
      if (!err && !row) {
        db.run('INSERT INTO images (model_id, url, is_primary) VALUES (?, ?, 1)', [model.id, hdImage], () => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  });

  // 2. Fetch technical specifications from Gemini if API key is available
  if (!apiKey) {
    console.log('   ⚠️ Clé API Gemini manquante. Fiche technique passée.');
    return;
  }

  try {
    const prompt = `Génère la fiche technique complète et structurée au format JSON pour le véhicule suivant:
Marque: "${model.marque}"
Modèle: "${model.nom}"
Année: ${model.annee || 2026}
Catégorie: "${model.categorie}"

Réponds UNIQUEMENT sous forme d'un objet JSON contenant exactement ces clés:
- "longueur": Longueur en mm (ex: "4620 mm").
- "largeur": Largeur en mm (ex: "1810 mm").
- "hauteur": Hauteur en mm (ex: "1454 mm").
- "empattement": Empattement en mm (ex: "2730 mm").
- "poids": Poids en kg (ex: "1450 kg").
- "coffre": Volume du coffre en litres (ex: "480 L").
- "cylindree": Cylindrée du moteur (ex: "1998 cm³" ou "N/A" si électrique).
- "cylindres": Architecture moteur (ex: "4 cylindres en ligne" ou "Moteur Électrique").
- "turbo": "Oui" ou "Non".
- "vitesse_max": Vitesse maximale (ex: "210 km/h").
- "acceleration": Accélération 0-100 km/h (ex: "7.8 s").
- "conso_urbaine": Consommation urbaine (ex: "6.2 L/100 km" ou "N/A" si électrique).
- "conso_extra": Consommation extra-urbaine (ex: "4.5 L/100 km" ou "N/A" si électrique).
- "conso_mixte": Consommation mixte (ex: "5.1 L/100 km" ou "16.8 kWh/100 km" si électrique).
- "emission_co2": Émissions de CO2 (ex: "118 g/km" ou "0 g/km").
- "reservoir": Capacité du réservoir (ex: "50 L" ou "N/A" si électrique).
- "roues": Dimensions de roues (ex: "17 pouces").
- "pneus": Dimensions de pneus (ex: "225/45 R17").
- "options": Un objet JSON contenant des clés d'options avec la valeur "Oui" ou "Non" parmi: "Airbags", "Climatisation", "ABS", "ESP", "Radar de recul", "Caméra de recul", "Régulateur de vitesse", "Limiteur de vitesse", "Écran tactile", "Apple CarPlay / Android Auto", "Jantes alliage", "Phares LED", "Toit ouvrant". Indique la présence standard réelle de ces équipements.`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      },
      { timeout: 15000 }
    );

    const resultText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (resultText) {
      const specs = JSON.parse(resultText);
      const optionsJson = JSON.stringify(specs.options || {});
      
      // Update specifications table
      await new Promise((resolve) => {
        db.run(`INSERT OR REPLACE INTO specifications (
          model_id, longueur, largeur, hauteur, empattement, poids, coffre, 
          cylindree, cylindres, turbo, vitesse_max, acceleration, 
          conso_urbaine, conso_extra, conso_mixte, emission_co2, reservoir, roues, pneus, options
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
          model.id, specs.longueur, specs.largeur, specs.hauteur, specs.empattement, specs.poids, specs.coffre,
          specs.cylindree, specs.cylindres, specs.turbo, specs.vitesse_max, specs.acceleration,
          specs.conso_urbaine, specs.conso_extra, specs.conso_mixte, specs.emission_co2, specs.reservoir, specs.roues, specs.pneus,
          optionsJson
        ], (err) => {
          if (err) console.error('   ❌ Erreur d\'écriture des specs:', err.message);
          else console.log('   ✅ Spécifications et options enregistrées avec succès !');
          resolve();
        });
      });
    }
  } catch(e) {
    console.error('   ❌ Échec de la génération Gemini:', e.message);
  }
}

async function runEnrichment(options = {}) {
  const apiKey = await getGeminiKey();
  const db = new sqlite3.Database(dbPath);

  let query = 'SELECT * FROM models';
  const params = [];

  if (options.modelId) {
    query += ' WHERE id = ?';
    params.push(options.modelId);
  } else if (options.limit) {
    query += ' LIMIT ?';
    params.push(options.limit);
  }

  db.all(query, params, async (err, models) => {
    if (err) {
      console.error('Erreur SQL:', err);
      db.close();
      return;
    }

    console.log(`🚀 Démarrage de l'enrichissement premium pour ${models.length} modèles...`);
    
    for (let i = 0; i < models.length; i++) {
      await enrichSingleModel(db, models[i], apiKey);
      
      // Delay to avoid Gemini API Rate Limits (15 Requests per Minute)
      if (apiKey && i < models.length - 1) {
        console.log('⏳ Attente de 4.5 secondes (limite de taux API)...');
        await sleep(4500);
      }
    }

    db.close();
    console.log('\n🎉 Enrichissement premium terminé avec succès !');
  });
}

// Support CLI execution
if (require.main === module) {
  const limit = process.argv[2] ? parseInt(process.argv[2]) : null;
  runEnrichment({ limit });
}

module.exports = { runEnrichment, enrichSingleModel };
