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
  const spec = { options: {} };
  
  // 1. Extraction des spécifications techniques standard
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
    'conso. mixte': 'conso_mixte',
    'conso mixte': 'conso_mixte',
    'conso. urbaine': 'conso_urbaine',
    'conso urbaine': 'conso_urbaine',
    'conso. extra': 'conso_extra',
    'conso extra': 'conso_extra',
    'co2': 'emission_co2',
    'co₂': 'emission_co2',
    'réservoir': 'reservoir',
    'roues': 'roues',
    'pneus': 'pneus',
  };

  // Parcourir toutes les lignes de tableau ou définitions
  $('tr, li, .param, .spec-row').each((_, el) => {
    const text = $(el).text().trim();
    if (!text || !text.includes(':') && !text.includes('\t')) return;

    // Séparateur clé-valeur
    let parts = text.split(':');
    if (parts.length < 2) {
      parts = text.split('\t');
    }
    if (parts.length < 2) return;

    const label = parts[0].trim().toLowerCase();
    const value = parts.slice(1).join(':').trim();

    for (const [keyword, field] of Object.entries(specMap)) {
      if (label === keyword || label.includes(keyword)) {
        if (!spec[field] && value && value.length > 0) {
          spec[field] = value.replace(/\s+/g, ' ');
        }
      }
    }
  });

  // 2. Extraction des options (Sécurité, Confort, Esthétique, etc.)
  // On cherche les listes à puces avec oui/non ou coches verts sur Wandaloo
  let currentCategory = 'Général';
  
  $('h2, h3, .title-info, .category-title, .options-group h4').each((_, titleEl) => {
    const $title = $(titleEl);
    const titleText = $title.text().trim();
    
    // Identifier les catégories d'options
    if (/sécurité/i.test(titleText)) currentCategory = 'Sécurité';
    else if (/confort/i.test(titleText)) currentCategory = 'Confort';
    else if (/esthétique|design/i.test(titleText)) currentCategory = 'Esthétique';
    else if (/moteur|technique/i.test(titleText)) currentCategory = 'Moteur & Infos techniques';
    else return;

    if (!spec.options[currentCategory]) {
      spec.options[currentCategory] = [];
    }

    // Trouver le bloc de liste d'options qui suit immédiatement le titre
    let $next = $title.next();
    // Parcourir jusqu'au prochain titre de catégorie
    while ($next.length && !$next.is('h2, h3, .title-info, .category-title')) {
      // Si c'est une liste d'options
      $next.find('li, .option-item, tr').each((_, optionEl) => {
        const $opt = $(optionEl);
        const optText = $opt.text().replace(/\s+/g, ' ').trim();
        
        if (optText && optText.length > 2) {
          // Sur Wandaloo, les options ont parfois des indicateurs "Oui" (coche verte) ou "Non" (croix rouge)
          // Si le texte contient un statut (ex: "Airbags : Oui" ou "Airbags (6)"), on l'extrait
          const hasCheck = $opt.find('.checked, .oui, .yes, img[src*="check"], img[src*="oui"]').length > 0;
          const hasCross = $opt.find('.unchecked, .non, .no, img[src*="cross"], img[src*="non"]').length > 0;
          
          let name = optText;
          let status = 'Disponible';
          
          if (optText.includes(':')) {
            const optParts = optText.split(':');
            name = optParts[0].trim();
            status = optParts[1].trim();
          } else if (hasCheck) {
            status = 'Oui';
          } else if (hasCross) {
            status = 'Non';
          }

          // Éviter les doublons
          if (!spec.options[currentCategory].some(o => o.nom === name)) {
            spec.options[currentCategory].push({ nom: name, valeur: status });
          }
        }
      });
      $next = $next.next();
    }
  });

  // Nettoyage final : s'assurer qu'au moins la structure de base existe
  if (Object.keys(spec.options).length === 0) {
    // Si la structure HTML est différente (ex: liste d'options à plat), on extrait tous les éléments contenant une coche oui/non
    spec.options = { 'Équipements': [] };
    $('li').each((_, liEl) => {
      const text = $(liEl).text().trim();
      if (text && text.length > 3 && text.length < 100) {
        const hasCheck = $(liEl).find('.checked, .oui, img[src*="check"], img[src*="oui"]').length > 0;
        if (hasCheck || text.toLowerCase().includes('oui') || text.toLowerCase().includes('disponible')) {
          spec.options['Équipements'].push({ nom: text.replace(/:.*/, '').trim(), valeur: 'Oui' });
        }
      }
    });
  }

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
  
  // Limiter à 40 modèles en exécution rapide si l'argument --quick est passé
  const isQuick = process.argv.includes('--quick');
  const modelsToProcess = isQuick ? models.slice(0, 40) : models;
  
  console.log(`Found ${models.length} models to detail (Processing ${modelsToProcess.length})\n`);
  
  for (let i = 0; i < modelsToProcess.length; i++) {
    const model = modelsToProcess[i];
    console.log(`[${i + 1}/${modelsToProcess.length}] ${model.marque} ${model.nom}`);
    await scrapeModelDetails(model);
    await new Promise(r => setTimeout(r, 800)); // Petit délai de sécurité
  }
  
  console.log('\n✅ Détails scraping terminé!');
}

module.exports = {
  scrapeAllDetails,
  scrapeModelDetails
};

if (require.main === module) {
  scrapeAllDetails().catch(console.error);
}
