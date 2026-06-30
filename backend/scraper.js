const axios = require('axios');
const cheerio = require('cheerio');
const { initDB, insertBrand, insertModel } = require('./db');

const BASE_URL = 'https://www.wandaloo.com';

// Mapping modèle -> catégorie basé sur les connaissances automobiles
const MODEL_CATEGORIES = {
  // Citadines
  'clio': 'Citadine', '208': 'Citadine', 'sandero': 'Citadine', 'polo': 'Citadine',
  'ibiza': 'Citadine', 'fabia': 'Citadine', 'picanto': 'Citadine', 'swift': 'Citadine',
  'yaris': 'Citadine', 'corolla': 'Citadine', 'i20': 'Citadine', 'rio': 'Citadine',
  'mg3': 'Citadine', 'mg-3': 'Citadine', 'fiesta': 'Citadine', 'micra': 'Citadine',
  'c3': 'Citadine', 'aygo': 'Citadine', 'up': 'Citadine', 'c1': 'Citadine', '108': 'Citadine',
  // SUV
  'tiguan': 'SUV', 'qashqai': 'SUV', 'captur': 'SUV', 'kuga': 'SUV', 'sportage': 'SUV',
  'tucson': 'SUV', 'cr-v': 'SUV', 'rav4': 'SUV', 'x-trail': 'SUV', 'mokka': 'SUV',
  '2008': 'SUV', '3008': 'SUV', '5008': 'SUV', 'c5 aircross': 'SUV', 'c4 cactus': 'SUV',
  'kodiaq': 'SUV', 'karok': 'SUV', 'ateca': 'SUV', 'tarraco': 'SUV', 'macan': 'SUV',
  'cayenne': 'SUV', 'x1': 'SUV', 'x3': 'SUV', 'x5': 'SUV', 'x7': 'SUV', 'gla': 'SUV',
  'glc': 'SUV', 'gle': 'SUV', 'gls': 'SUV', 'ux': 'SUV', 'nx': 'SUV', 'rx': 'SUV',
  'xc40': 'SUV', 'xc60': 'SUV', 'xc90': 'SUV', 'defender': 'SUV', 'discovery': 'SUV',
  'range rover': 'SUV', 'evoque': 'SUV', 'velar': 'SUV', 'renegade': 'SUV', 'compass': 'SUV',
  'cherokee': 'SUV', 'grand cherokee': 'SUV', 'wrangler': 'SUV', 'panda': 'SUV',
  'duster': 'SUV', 'jogger': 'SUV', 'arkana': 'SUV', 'kadjar': 'SUV', 'koleos': 'SUV',
  'espace': 'SUV', 'scenic': 'SUV', 'grand scenic': 'SUV', 'xsara picasso': 'SUV',
  'santa fe': 'SUV', 'sorento': 'SUV', 'carens': 'SUV', 'ceed': 'SUV', 'pro ceed': 'SUV',
  'mazda cx': 'SUV', 'hr-v': 'SUV', 'juke': 'SUV', 'q3': 'SUV', 'q5': 'SUV', 'q7': 'SUV',
  'zs': 'SUV', 'hs': 'SUV', 'marvel-r': 'SUV', 'atto 3': 'SUV', 'tang': 'SUV', 'seal': 'SUV',
  'h6': 'SUV', 'jolion': 'SUV', 'tank': 'SUV', 'cannon': 'SUV', 'ora': 'SUV',
  'jaecoo 7': 'SUV', 'jaecoo 8': 'SUV', 'omoda 5': 'SUV', 'omoda c5': 'SUV',
  'chery tiggo': 'SUV', 'changan uni': 'SUV', 'cs': 'SUV', 'deepal s07': 'SUV',
  'geely atlas': 'SUV', 'geely monjaro': 'SUV', 'coolray': 'SUV', 'emgrand x7': 'SUV',
  'dfsk glory': 'SUV', 'soueast s07': 'SUV', 'baic x35': 'SUV', 'baic x55': 'SUV',
  'jac s': 'SUV', 'jac js': 'SUV', 'denza n7': 'SUV', 'lynk': 'SUV',
  // Berlines
  'passat': 'Berline', 'arteon': 'Berline', 'superb': 'Berline', 'octavia': 'Berline',
  'rapid': 'Berline', 'jetta': 'Berline', 'megan': 'Berline', 'talisman': 'Berline',
  'laguna': 'Berline', 'espace': 'Monospace', '508': 'Berline', '407': 'Berline',
  'c5': 'Berline', 'c6': 'Berline', '3 series': 'Berline', '5 series': 'Berline',
  'a4': 'Berline', 'a6': 'Berline', 'a8': 'Berline', 'c-class': 'Berline', 'e-class': 'Berline',
  's-class': 'Berline', 'is': 'Berline', 'es': 'Berline', 'gs': 'Berline', 'ls': 'Berline',
  's60': 'Berline', 's90': 'Berline', 'xf': 'Berline', 'xe': 'Berline', 'giulia': 'Berline',
  'tonale': 'SUV', 'stelvio': 'SUV', 'ghibli': 'Berline', 'levante': 'SUV', 'quattroporte': 'Berline',
  // Breaks
  'sw': 'Break', 'touran': 'Break', 'sharan': 'Monospace', 'alhambra': 'Monospace',
  'station': 'Break', 'variant': 'Break', 'break': 'Break',
  // Monospaces
  'berlingo': 'Monospace', 'partner': 'Monospace', 'rifter': 'Monospace',
  'combo': 'Monospace', 'caddy': 'Monospace', 'tourneo': 'Monospace',
  'transit': 'Utilitaire', 'ducato': 'Utilitaire', 'boxer': 'Utilitaire',
  'jumper': 'Utilitaire', 'master': 'Utilitaire', 'trafic': 'Utilitaire',
  // Coupés / Cabriolets / Sport
  'mustang': 'Coupé', 'camaro': 'Coupé', '911': 'Coupé', '718': 'Cabriolet',
  'boxster': 'Cabriolet', 'cayman': 'Coupé', 'tt': 'Coupé', 'z4': 'Cabriolet',
  'sl': 'Cabriolet', 'slc': 'Cabriolet', 'rc': 'Coupé', 'lc': 'Coupé',
  'mx-5': 'Cabriolet', '124 spider': 'Cabriolet', 'supra': 'Coupé',
  'gt-r': 'Coupé', '370z': 'Coupé', '86': 'Coupé', 'brz': 'Coupé',
  'cyberster': 'Cabriolet', 'a5': 'Coupé', '4 series': 'Coupé',
  'c-coupé': 'Coupé', 'e-coupé': 'Coupé', 's-coupé': 'Coupé',
  // 4x4 / Pick-up
  'amarok': 'Pick-up', 'ranger': 'Pick-up', 'hilux': 'Pick-up', 'navara': 'Pick-up',
  'l200': 'Pick-up', 'd-max': 'Pick-up', 'bt-50': 'Pick-up',
  'pajero': '4x4', 'prado': '4x4', 'land cruiser': '4x4', 'patrol': '4x4',
  'jimny': '4x4', 'g-class': '4x4',
};

function detectCategory(name) {
  const lower = name.toLowerCase();
  for (const [key, cat] of Object.entries(MODEL_CATEGORIES)) {
    if (lower.includes(key)) return cat;
  }
  // Default based on price
  return 'Non spécifiée';
}

function detectCarrosserie(categorie) {
  if (['SUV', '4x4'].includes(categorie)) return 'SUV';
  if (categorie === 'Citadine') return 'Berline';
  if (categorie === 'Break') return 'Break';
  if (categorie === 'Cabriolet') return 'Cabriolet';
  if (categorie === 'Coupé') return 'Coupé';
  if (categorie === 'Monospace') return 'Monospace';
  if (categorie === 'Pick-up') return 'Pick-up';
  if (categorie === 'Utilitaire') return 'Utilitaire';
  return 'Berline';
}

const BRAND_LIST = [
  { id: 'mg', name: 'MG' },
  { id: 'renault', name: 'Renault' },
  { id: 'dacia', name: 'Dacia' },
  { id: 'peugeot', name: 'Peugeot' },
  { id: 'citroen', name: 'Citroën' },
  { id: 'volkswagen', name: 'Volkswagen' },
  { id: 'audi', name: 'Audi' },
  { id: 'bmw', name: 'BMW' },
  { id: 'mercedes', name: 'Mercedes-Benz' },
  { id: 'toyota', name: 'Toyota' },
  { id: 'hyundai', name: 'Hyundai' },
  { id: 'kia', name: 'Kia' },
  { id: 'ford', name: 'Ford' },
  { id: 'nissan', name: 'Nissan' },
  { id: 'opel', name: 'Opel' },
  { id: 'seat', name: 'Seat' },
  { id: 'skoda', name: 'Skoda' },
  { id: 'fiat', name: 'Fiat' },
  { id: 'jeep', name: 'Jeep' },
  { id: 'land-rover', name: 'Land Rover' },
  { id: 'porsche', name: 'Porsche' },
  { id: 'mini', name: 'Mini' },
  { id: 'lexus', name: 'Lexus' },
  { id: 'honda', name: 'Honda' },
  { id: 'suzuki', name: 'Suzuki' },
  { id: 'mazda', name: 'Mazda' },
  { id: 'mitsubishi', name: 'Mitsubishi' },
  { id: 'byd', name: 'BYD' },
  { id: 'chery', name: 'Chery' },
  { id: 'geely', name: 'Geely' },
  { id: 'changan', name: 'Changan' },
  { id: 'gwm', name: 'GWM' },
  { id: 'jaecoo', name: 'Jaecoo' },
  { id: 'omoda', name: 'Omoda' },
  { id: 'dfsk', name: 'DFSK' },
  { id: 'cupra', name: 'Cupra' },
  { id: 'ds', name: 'DS' },
  { id: 'jaguar', name: 'Jaguar' },
  { id: 'alfa-romeo', name: 'Alfa Romeo' },
  { id: 'volvo', name: 'Volvo' },
  { id: 'mahindra', name: 'Mahindra' },
  { id: 'maserati', name: 'Maserati' },
  { id: 'dongfeng', name: 'Dongfeng' },
  { id: 'baic', name: 'BAIC' },
  { id: 'zeekr', name: 'Zeekr' },
  { id: 'deepal', name: 'Deepal' },
  { id: 'soueast', name: 'Soueast' },
  { id: 'jac', name: 'JAC' },
  { id: 'denza', name: 'Denza' },
  { id: 'lynk-et-co', name: 'Lynk & Co' },
];

const axiosInstance = axios.create({
  timeout: 20000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept-Language': 'fr-FR',
  },
});

async function fetchHTML(url) {
  const res = await axiosInstance.get(url);
  return res.data;
}

function extractModelsFromHTML(html, brandId, brandName) {
  const $ = cheerio.load(html);
  const models = [];
  const seen = new Set();
  
  $('h3').each((_, el) => {
    const $h3 = $(el);
    const $link = $h3.find('a[href*="/neuf/"]').first();
    if (!$link.length) return;
    
    const href = $link.attr('href');
    if (!href || href.includes('#') || href.includes('/comparer/')) return;
    
    const slugMatch = href.match(/\/neuf\/[^/]+\/([^/]+)\/?$/);
    if (!slugMatch) return;
    const slug = slugMatch[1];
    
    const key = `${brandId}-${slug}`;
    if (seen.has(key)) return;
    seen.add(key);
    
    const name = $link.text().trim() || $link.attr('title') || '';
    if (!name) return;
    
    let $priceEl = $h3.next('.prix');
    if (!$priceEl.length) {
      $priceEl = $h3.parent().find('.prix').first();
    }
    
    const priceText = ($priceEl.text() || '').trim();
    const cleanPrice = priceText.replace(/\s*DH\s*\*?\s*$/, '').trim();
    
    const priceMatch = cleanPrice.match(/([\d\s\.]+)\s*-\s*([\d\s\.]+)/);
    const singlePriceMatch = cleanPrice.match(/([\d\s\.]+)/);
    
    let prixMin = 0, prixMax = 0;
    if (priceMatch) {
      prixMin = parseInt(priceMatch[1].replace(/[\s\.]/g, ''));
      prixMax = parseInt(priceMatch[2].replace(/[\s\.]/g, ''));
    } else if (singlePriceMatch) {
      prixMin = prixMax = parseInt(singlePriceMatch[1].replace(/[\s\.]/g, ''));
    }
    
    if (prixMin <= 0 || !name || !slug) return;
    
    // Detect category from model name
    const categorie = detectCategory(name);
    const carrosserie = detectCarrosserie(categorie);
    
    // Detect fuel type
    const lowerName = name.toLowerCase();
    let carburant = 'Essence';
    if (lowerName.includes('ev') || lowerName.includes('electrique') || lowerName.includes('électrique') || lowerName.includes(' e-') || lowerName.includes(' eq') || lowerName.includes('atto') || lowerName.includes('seal') || lowerName.includes('tang') || lowerName.includes('dolphin') || lowerName.includes('mg4') || lowerName.includes('id.3') || lowerName.includes('id.4') || lowerName.includes('id.5') || lowerName.includes('enyaq') || lowerName.includes('etron')) carburant = 'Électrique';
    else if (lowerName.includes('hybride') || lowerName.includes('hev') || lowerName.includes('phev') || lowerName.includes('e-tech') || lowerName.includes('hybrid') || lowerName.includes('mild') || lowerName.includes(' rechargeable')) carburant = 'Hybride';
    else if (lowerName.includes('diesel') || lowerName.includes('dci') || lowerName.includes('tdi') || lowerName.includes('hdi') || lowerName.includes('cdi') || lowerName.includes('blue d')) carburant = 'Diesel';
    
    // Find image
    const $li = $h3.closest('li, .modele-item, .car-item, .voiture-item');
    const $img = $li.find('img, .pic img, .pics img').first();
    let image = '';
    if ($img.length) {
      image = $img.attr('data-src') || $img.attr('data-original') || $img.attr('src') || '';
      if (image && !image.startsWith('http')) {
        image = BASE_URL + (image.startsWith('/') ? '' : '/') + image;
      }
    }
    if (!image || image.includes('lazy') || image.includes('loading') || image.includes('placeholder')) {
      image = `${BASE_URL}/files/Voiture-Neuve/${brandId}/${slug}.jpg`;
    }
    
    models.push({
      id: key,
      marque: brandName,
      nom: name,
      slug: slug,
      annee: 2025,
      categorie: categorie,
      carrosserie: carrosserie,
      prix_min: prixMin,
      prix_max: prixMax,
      motorisations: [{
        version: name,
        moteur: 'À préciser',
        puissance: 'À préciser',
        transmission: 'À préciser',
        carburant: carburant
      }],
      image: image,
      fiche_url: `/neuf/${brandId}/${slug}/`
    });
  });
  
  return models;
}

async function scrapeBrand(brand) {
  const url = `${BASE_URL}/neuf/${brand.id}/`;
  console.log(`🔍 ${brand.name}...`);
  try {
    const html = await fetchHTML(url);
    const $ = cheerio.load(html);
    
    // Essayer de trouver le logo de la marque sur sa propre page
    let logoUrl = '';
    const $logoImg = $('.logo-constructeur img, .constructeur-info img, img[src*="/constructeur/logo/"], img[src*="/constructeurs/logo/"], img[src*="/logo-"], img[src*="/logo/"]').first();
    if ($logoImg.length) {
      const parsedUrl = $logoImg.attr('data-src') || $logoImg.attr('src') || '';
      if (parsedUrl && !parsedUrl.includes('wandaloo.com-blanc.png')) {
        logoUrl = parsedUrl;
        if (!logoUrl.startsWith('http')) {
          logoUrl = BASE_URL + (logoUrl.startsWith('/') ? '' : '/') + logoUrl;
        }
      }
    }
    
    // Essayer de trouver le pays d'origine
    let pays = 'Non spécifié';
    const infoText = $('.constructeur-info, .brand-desc, .desc').text() || '';
    if (infoText) {
      const paysMatch = infoText.match(/(Origine|Pays|Nationalité)\s*:\s*([^\n\.,]+)/i);
      if (paysMatch) pays = paysMatch[2].trim();
    }

    const models = extractModelsFromHTML(html, brand.id, brand.name);
    console.log(`  ✅ ${models.length} modèles`);
    return { 
      brand: { 
        ...brand, 
        logo: logoUrl || brand.logo, 
        pays: pays 
      }, 
      models 
    };
  } catch (e) {
    console.log(`  ❌ ${e.message}`);
    return { brand, models: [] };
  }
}

async function scrapeAllBrands() {
  console.log('🚀 Scraping Wandaloo...\n');
  initDB();
  
  const allBrands = [];
  const allModels = [];
  
  for (const brand of BRAND_LIST) {
    const { brand: b, models } = await scrapeBrand(brand);
    
    if (models.length > 0) {
      const prices = models.map(m => m.prix_min);
      const brandData = {
        id: b.id,
        nom: b.name,
        pays: b.pays || 'Non spécifié',
        logo: b.logo || `${BASE_URL}/imgs/logo-${b.name.replace(/\s+/g, '-')}-b.png`,
        nb_modeles: models.length,
        prix_min: Math.min(...prices),
        prix_max: Math.max(...models.map(m => m.prix_max)),
      };
      
      await new Promise((resolve, reject) => {
        insertBrand(brandData, (err) => { if (err) reject(err); else resolve(); });
      });
      
      for (const model of models) {
        await new Promise((resolve, reject) => {
          insertModel(model, (err) => { if (err) reject(err); else resolve(); });
        });
      }
      
      allBrands.push(brandData);
      allModels.push(...models);
    }
    
    await new Promise(r => setTimeout(r, 1500));
  }
  
  console.log(`\n✅ Terminé! ${allBrands.length} marques, ${allModels.length} modèles`);
}

module.exports = {
  scrapeAllBrands,
  scrapeBrand
};

if (require.main === module) {
  scrapeAllBrands().catch(console.error);
}
