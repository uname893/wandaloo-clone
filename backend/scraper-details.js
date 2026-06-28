const axios = require('axios');
const cheerio = require('cheerio');
const { initDB, getAllModels, insertImages, insertSpec } = require('./db');

const BASE_URL = 'https://www.wandaloo.com';

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

function extractImages($, modelId, brandId, slug) {
  const images = [];
  const seen = new Set();
  
  // Look for images that contain the model slug or brand in the URL
  const slugParts = slug.split('-');
  const brandName = brandId.toLowerCase();
  
  $('img').each((_, el) => {
    const src = $(el).attr('data-src') || $(el).attr('src') || '';
    const alt = $(el).attr('alt') || '';
    const lowerSrc = src.toLowerCase();
    const lowerAlt = alt.toLowerCase();
    
    // Only include images that match the model or brand
    const matchesModel = slugParts.some(p => lowerSrc.includes(p) || lowerAlt.includes(p));
    const matchesBrand = lowerSrc.includes(brandName) || lowerAlt.includes(brandName);
    
    if (src && (matchesModel || matchesBrand) && 
        !src.includes('logo') && !src.includes('pub') && !src.includes('banner') &&
        !src.includes('wandaloo') && src.length > 20) {
      const cleanUrl = src.startsWith('http') ? src : BASE_URL + (src.startsWith('/') ? '' : '/') + src;
      if (!seen.has(cleanUrl)) {
        seen.add(cleanUrl);
        images.push({ url: cleanUrl, alt: alt, is_primary: images.length === 0 });
      }
    }
  });
  
  return images.slice(0, 10);
}

function extractSpecs($) {
  const spec = {};
  
  // Look for technical specs table or sections
  // Wandaloo uses various class names for specs
  const specMap = {
    'longueur': 'longueur',
    'largeur': 'largeur', 
    'hauteur': 'hauteur',
    'empattement': 'empattement',
    'poids': 'poids',
    'coffre': 'coffre',
    'cylindrée': 'cylindree',
    'cylindres': 'cylindres',
    'turbo': 'turbo',
    'vitesse max': 'vitesse_max',
    'accélération': 'acceleration',
    '0-100': 'acceleration',
    '0 à 100': 'acceleration',
    'conso urbaine': 'conso_urbaine',
    'conso extra': 'conso_extra',
    'conso mixte': 'conso_mixte',
    'co2': 'emission_co2',
    'co₂': 'emission_co2',
    'réservoir': 'reservoir',
    'roues': 'roues',
    'pneus': 'pneus',
  };
  
  // Try to find spec tables or lists
  $('table, dl, ul, div').each((_, el) => {
    const $el = $(el);
    const text = $el.text().toLowerCase();
    
    for (const [keyword, field] of Object.entries(specMap)) {
      if (text.includes(keyword) && !spec[field]) {
        // Try to find the value near the label
        const $rows = $el.find('tr, dt, dd, li, div');
        $rows.each((_, row) => {
          const rowText = $(row).text().toLowerCase();
          if (rowText.includes(keyword)) {
            const value = $(row).text().replace(/.*?:\s*/, '').replace(keyword, '').trim().substring(0, 50);
            if (value && value.length > 1 && value !== keyword) {
              spec[field] = value;
            }
          }
        });
      }
    }
  });
  
  return spec;
}

async function scrapeModelDetails(model) {
  const url = `${BASE_URL}${model.fiche_url}`;
  const brandId = model.marque.toLowerCase().replace(/\s+/g, '-');
  const slug = model.slug || '';
  console.log(`  📄 ${model.nom}...`);
  
  try {
    const html = await fetchHTML(url);
    const $ = cheerio.load(html);
    
    // Extract images
    const images = extractImages($, model.id, brandId, slug);
    if (images.length > 0) {
      await new Promise((resolve, reject) => {
        insertImages(model.id, images, (err) => {
          if (err) reject(err); else resolve();
        });
      });
      console.log(`    📸 ${images.length} images`);
    }
    
    // Extract specs
    const spec = extractSpecs($);
    if (Object.keys(spec).length > 0) {
      await new Promise((resolve, reject) => {
        insertSpec(model.id, spec, (err) => {
          if (err) reject(err); else resolve();
        });
      });
      console.log(`    📋 ${Object.keys(spec).length} specs`);
    }
    
  } catch (e) {
    console.log(`    ❌ ${e.message}`);
  }
}

async function scrapeAllDetails() {
  console.log('🚀 Scraping détails fiches techniques...\n');
  initDB();
  
  const models = await new Promise((resolve, reject) => {
    getAllModels({}, (err, rows) => {
      if (err) reject(err); else resolve(rows || []);
    });
  });
  
  console.log(`Found ${models.length} models to detail\n`);
  
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    console.log(`[${i + 1}/${models.length}] ${model.marque} ${model.nom}`);
    await scrapeModelDetails(model);
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log('\n✅ Détails scraping terminé!');
}

const quick = process.argv.includes('--quick');
scrapeAllDetails().catch(console.error);
