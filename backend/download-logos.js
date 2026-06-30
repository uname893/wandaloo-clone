const fs = require('fs');
const path = require('path');
const dns = require('dns');
const axios = require('axios');
const { initDB, getAllBrands } = require('./db');

// Fix DNS resolution issues on Windows for Node.js
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const LOGO_DIR = path.join(__dirname, '../frontend/images/logos');

// Ensure directory exists
if (!fs.existsSync(LOGO_DIR)) {
  fs.mkdirSync(LOGO_DIR, { recursive: true });
}

// Brand mapping overrides for keys in vehicle-logotypes.json
const keyMappings = {
  'alfa-romeo': 'alfa-romeo',
  'audi': 'audi',
  'bmw': 'bmw',
  'byd': 'byd',
  'changan': 'changan',
  'chery': 'chery',
  'citroen': 'citroen',
  'cupra': 'cupra',
  'dacia': 'dacia',
  'deepal': 'deepal',
  'dfsk': 'dfsk',
  'ds': 'ds',
  'fiat': 'fiat',
  'ford': 'ford',
  'geely': 'geely',
  'gwm': 'great-wall',
  'honda': 'honda',
  'hyundai': 'hyundai',
  'jac': 'jac',
  'jaecoo': 'jaecoo',
  'jaguar': 'jaguar',
  'jeep': 'jeep',
  'kia': 'kia',
  'land-rover': 'land-rover',
  'lexus': 'lexus',
  'lynk-et-co': 'lynk-co',
  'mg': 'mg',
  'mahindra': 'mahindra',
  'maserati': 'maserati',
  'mazda': 'mazda',
  'mercedes': 'mercedes-benz',
  'mini': 'mini',
  'mitsubishi': 'mitsubishi',
  'nissan': 'nissan',
  'opel': 'opel',
  'peugeot': 'peugeot',
  'porsche': 'porsche',
  'renault': 'renault',
  'seat': 'seat',
  'skoda': 'skoda',
  'suzuki': 'suzuki',
  'toyota': 'toyota',
  'volkswagen': 'volkswagen',
  'volvo': 'volvo',
  'zeekr': 'zeekr'
};

async function downloadImage(url, outputPath) {
  const writer = fs.createWriteStream(outputPath);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    timeout: 15000
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function run() {
  console.log('🚀 Chargement du dictionnaire de logos vehicle-logotypes...');
  let logotypesDict = {};
  
  try {
    const res = await axios.get('https://cdn.jsdelivr.net/gh/avto-dev/vehicle-logotypes@2.x/src/vehicle-logotypes.json', {
      timeout: 10000
    });
    logotypesDict = res.data;
    console.log(`✅ Dictionnaire de logos chargé. ${Object.keys(logotypesDict).length} logos disponibles.`);
  } catch (e) {
    console.error('⚠️ Impossible de charger le dictionnaire de logos, utilisation de fallbacks uniquement.', e.message);
  }

  initDB();

  getAllBrands(async (err, brands) => {
    if (err) {
      console.error('Erreur lors de la récupération des marques:', err.message);
      return;
    }

    console.log(`Trouvé ${brands.length} marques dans la base de données.`);

    for (const brand of brands) {
      const id = brand.id;
      const outputPath = path.join(LOGO_DIR, `${id}.jpg`); // Garder .jpg pour la compatibilité

      console.log(`\nProcède pour : ${brand.nom} (ID: ${id})...`);
      let success = false;

      // 1. Tenter avec la clé mappée dans le dictionnaire logotypesDict
      const dictKey = keyMappings[id] || id.toLowerCase();
      const entry = logotypesDict[dictKey];
      
      if (entry && entry.logotype && entry.logotype.uri) {
        let uri = entry.logotype.uri;
        // On peut dimensionner via imgix si besoin (ex: w=160&h=160&fit=fill&bg=0FFF)
        // Mais l'image par défaut est parfaite.
        try {
          console.log(`  🔗 Téléchargement depuis la base de logos (Imgix CDN) : ${uri}`);
          await downloadImage(uri, outputPath);
          console.log(`  ✅ Logo téléchargé avec succès (Imgix CDN) !`);
          success = true;
        } catch (e) {
          console.log(`  ❌ Échec Imgix CDN : ${e.message}`);
        }
      }

      // 2. Tenter Clearbit API comme fallback
      if (!success) {
        const domain = `${id}.com`;
        const clearbitUrl = `https://logo.clearbit.com/${domain}`;
        try {
          console.log(`  🔗 Essai de téléchargement (Clearbit API) : ${clearbitUrl}`);
          await downloadImage(clearbitUrl, outputPath);
          console.log(`  ✅ Logo téléchargé avec succès (Clearbit) !`);
          success = true;
        } catch (e) {
          console.log(`  ❌ Échec Clearbit : ${e.message}`);
        }
      }

      // 3. Fallback final de secours (avatar de couleur avec le nom de la marque)
      if (!success) {
        const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(brand.nom)}&background=E31837&color=fff&size=128&bold=true`;
        try {
          console.log(`  🔗 Génération d'un logo de secours : ${fallbackUrl}`);
          await downloadImage(fallbackUrl, outputPath);
          console.log(`  ✅ Logo de secours généré.`);
        } catch (e) {
          console.error(`  ❌ Échec total pour ${brand.nom} :`, e.message);
        }
      }

      // Attendre un peu
      await new Promise(r => setTimeout(r, 300));
    }

    console.log('\n🎉 Téléchargement de tous les logos de marques terminé !');
  });
}

run().catch(console.error);
