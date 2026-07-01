// API_URL is defined in config.js loaded before this file

// ========== UTILS ==========
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

function formatPrice(price) {
  return new Intl.NumberFormat('fr-MA').format(price) + ' DH';
}

function formatPriceRange(min, max) {
  if (min === max) return formatPrice(min);
  return formatPrice(min) + ' – ' + formatPrice(max);
}

function getFuelBadgeClass(fuel) {
  const f = fuel.toLowerCase();
  if (f.includes('électrique')) return 'badge-electric';
  if (f.includes('hybride')) return 'badge-hybrid';
  if (f.includes('promo')) return 'badge-promo';
  return 'badge-new';
}

// ========== API ==========
async function fetchAPI(endpoint) {
  // Gestion du cache navigateur (localStorage) - expire après 30 minutes
  const CACHE_KEY = 'api_cache_' + endpoint;
  const CACHE_TIME_KEY = CACHE_KEY + '_time';
  const cachedData = localStorage.getItem(CACHE_KEY);
  const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
  
  if (cachedData && cachedTime && (Date.now() - parseInt(cachedTime) < 30 * 60 * 1000)) {
    return JSON.parse(cachedData);
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 1500); // Timeout de 1.5 seconde

  try {
    const res = await fetch(API_URL + endpoint, { signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    
    // Sauvegarder dans le cache local
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    } catch(err) {
      console.warn('Storage limit reached, unable to write API cache');
    }
    
    return data;
  } catch (e) {
    clearTimeout(id);
    console.warn('API Error or Timeout (falling back to static local data):', e);
    // FALLBACK STATIQUE SI LE SERVEUR RENDER EST HORS-LIGNE
    if (typeof STATIC_DATA !== 'undefined') {
      if (endpoint === '/brands') return STATIC_DATA.brands;
      if (endpoint === '/models') return STATIC_DATA.models;
      if (endpoint === '/categories') return STATIC_DATA.categories;
      if (endpoint === '/carburants') return STATIC_DATA.carburants;
      if (endpoint === '/promos') return STATIC_DATA.promos;
      if (endpoint.startsWith('/news')) {
        const parts = endpoint.split('/');
        if (parts.length > 2) {
          const articleId = parseInt(parts[2]);
          const found = (STATIC_DATA.news || []).find(n => n.id === articleId);
          if (found) return found;
        }
        return STATIC_DATA.news || [];
      }
      if (endpoint.startsWith('/brands/')) {
        const brandId = endpoint.split('/')[2];
        const brand = STATIC_DATA.brands.find(b => b.id === brandId);
        if (brand) {
          // Attacher ses modèles
          const models = STATIC_DATA.models.filter(m => m.marque.toLowerCase() === brand.nom.toLowerCase());
          return { ...brand, modeles: models };
        }
      }
      if (endpoint.startsWith('/models/')) {
        const modelId = endpoint.split('/')[2];
        const model = STATIC_DATA.models.find(m => m.id === modelId);
        if (model) {
          // Simuler specs
          return model;
        }
      }
      if (endpoint.startsWith('/compare')) {
        const urlParams = new URLSearchParams(endpoint.split('?')[1]);
        const ids = (urlParams.get('ids') || '').split(',');
        return STATIC_DATA.models.filter(m => ids.includes(m.id));
      }
    }
    return [];
  }
}

// ========== RENDERERS ==========
function renderBrands(brands, containerId = 'brandsGrid') {
  const grid = document.getElementById(containerId);
  if (!grid) return;
  if (!brands.length) {
    grid.innerHTML = '<div class="empty-state"><div class="icon">🏷️</div><h3>Aucune marque</h3></div>';
    return;
  }
  
  // Détecter si on est dans un sous-dossier /pages/
  const isSubpage = window.location.pathname.includes('/pages/');
  const pathPrefix = isSubpage ? '../' : '';

  grid.innerHTML = brands.map(b => {
    // Nettoyer le chemin absolu en chemin relatif propre
    let logoPath = b.logo || '';
    if (logoPath.startsWith('/')) {
      logoPath = logoPath.substring(1);
    }
    const finalLogo = pathPrefix + logoPath;

    // Lien relatif propre
    const linkPath = isSubpage ? `marque.html?id=${b.id}` : `pages/marque.html?id=${b.id}`;

    return `
      <a href="${linkPath}" class="brand-card">
        <img src="${finalLogo}" alt="${b.nom}" onerror="this.src='https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=64&auto=format&fit=crop&q=60'">
        <h3>${b.nom}</h3>
        <span>${b.nb_modeles} modèle${b.nb_modeles > 1 ? 's' : ''}</span>
        <div class="price-tag">${formatPriceRange(b.prix_min, b.prix_max)}</div>
      </a>
    `;
  }).join('');
}

function renderModels(models, containerId = 'modelsGrid') {
  const grid = document.getElementById(containerId);
  if (!grid) return;
  if (!models.length) {
    grid.innerHTML = '<div class="empty-state"><div class="icon">🚗</div><h3>Aucun modèle trouvé</h3><p>Essayez d\'autres filtres</p></div>';
    return;
  }
  grid.innerHTML = models.map(m => {
    const specs = m.motorisations?.[0] || {};
    const badgeClass = getFuelBadgeClass(specs.carburant || '');
    const badgeText = specs.carburant || 'Nouveau';
    return `
    <div class="model-card" onclick="location.href='/pages/modele.html?id=${m.id}'">
      <div class="image-wrap">
        <img src="${m.image}" alt="${m.nom}" onerror="this.src='https://via.placeholder.com/400x200?text=${encodeURIComponent(m.nom)}'">
        <span class="badge ${badgeClass}">${badgeText}</span>
      </div>
      <div class="model-card-body">
        <div class="category">${m.categorie}</div>
        <h3>${m.nom}</h3>
        <div class="year">${m.annee}</div>
        <div class="price">${formatPriceRange(m.prix_min, m.prix_max)}</div>
        <div class="specs">
          <span>${specs.carburant || '–'}</span>
          <span>${specs.puissance || '–'}</span>
          <span>${specs.transmission || '–'}</span>
        </div>
      </div>
    </div>
  `}).join('');
}

function renderStats(models, brands) {
  const statsGrid = document.getElementById('statsGrid');
  if (!statsGrid) return;
  const avgPrice = models.length ? Math.round(models.reduce((a, m) => a + m.prix_min, 0) / models.length) : 0;
  statsGrid.innerHTML = `
    <div class="stat-item"><h4>${brands.length}</h4><p>Marques</p></div>
    <div class="stat-item"><h4>${models.length}</h4><p>Modèles</p></div>
    <div class="stat-item"><h4>${formatPrice(avgPrice)}</h4><p>Prix moyen</p></div>
    <div class="stat-item"><h4>${models.filter(m => m.motorisations?.some(mo => mo.carburant?.includes('Électrique'))).length}</h4><p>Électriques</p></div>
  `;
}

function populateSelects(categories, carburants) {
  const catSelect = document.getElementById('categoryFilter');
  const fuelSelect = document.getElementById('fuelFilter');
  if (catSelect) {
    catSelect.innerHTML = '<option value="">Toutes catégories</option>' + 
      categories.map(c => `<option value="${c}">${c}</option>`).join('');
  }
  if (fuelSelect) {
    fuelSelect.innerHTML = '<option value="">Tous carburants</option>' + 
      carburants.map(c => `<option value="${c}">${c}</option>`).join('');
  }
}

// ========== FILTERS ==========
let globalModels = [];
let globalBrands = [];

async function loadHomeData() {
  const [brands, models, categories, carburants, news] = await Promise.all([
    fetchAPI('/brands'),
    fetchAPI('/models'),
    fetchAPI('/categories'),
    fetchAPI('/carburants'),
    fetchAPI('/news?limit=3')
  ]);
  globalBrands = brands;
  globalModels = models;

  // Appliquer le Hero Title et Subtitle dynamique
  let settings = { hero_title: 'Trouvez votre voiture neuve au meilleur prix', hero_subtitle: 'Prix officiels, fiches techniques et comparateur de toutes les marques disponibles au Maroc' };
  if (typeof STATIC_DATA !== 'undefined' && STATIC_DATA.settings) {
    settings = STATIC_DATA.settings;
  }
  try {
    const responseSettings = await fetch(API_URL + '/settings').then(r => r.json());
    if (responseSettings && responseSettings.hero_title) {
      settings = responseSettings;
    }
  } catch(e) {}

  const heroTitle = document.getElementById('heroTitle');
  const heroSubtitle = document.getElementById('heroSubtitle');
  if (heroTitle) heroTitle.innerHTML = settings.hero_title.replace(/\n/g, '<br>');
  if (heroSubtitle) heroSubtitle.textContent = settings.hero_subtitle;

  renderBrands(brands);
  renderModels(models);
  renderStats(models, brands);
  populateSelects(categories, carburants);
  renderHomeNews(news);
}

function renderHomeNews(news) {
  const container = document.getElementById('homeNewsGrid');
  if (!container) return;
  if (!news || !news.length) {
    container.innerHTML = '<p style="color:var(--text-light);text-align:center;">Aucune actualité récente.</p>';
    return;
  }
  container.innerHTML = news.map(item => {
    let tag = 'Actu';
    let titleClean = item.titre;
    const tagMatch = item.titre.match(/^\[(.*?)\]\s*(.*)$/);
    if (tagMatch) {
      tag = tagMatch[1];
      titleClean = tagMatch[2];
    }

    let tagClass = 'tag-default';
    const tagLower = tag.toLowerCase();
    if (tagLower.includes('essai')) tagClass = 'tag-essai';
    else if (tagLower.includes('actu fr')) tagClass = 'tag-france';
    else if (tagLower.includes('nouveauté maroc') || tagLower.includes('maroc')) tagClass = 'tag-maroc';
    else if (tagLower.includes('nouveauté')) tagClass = 'tag-nouveaute';
    else if (tagLower.includes('marché')) tagClass = 'tag-marche';

    // Correction du chemin pour rediriger localement vers l'article
    const localLink = `/pages/article.html?id=${item.id}`;

    return `
      <div class="news-card" onclick="location.href='${localLink}'">
        <div class="news-image-wrapper">
          <img class="news-img" src="${item.image}" alt="${titleClean}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop&q=60'">
          <span class="news-tag ${tagClass}">${tag}</span>
        </div>
        <div class="news-body">
          <span class="news-date">${item.date_publication}</span>
          <h3 class="news-title">${titleClean}</h3>
          <p class="news-excerpt" style="font-size: 13px; line-height: 1.5; color: var(--text-light); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 0;">${item.resume}</p>
        </div>
      </div>
    `;
  }).join('');
}

function applyFilters() {
  const category = document.getElementById('categoryFilter')?.value;
  const fuel = document.getElementById('fuelFilter')?.value;
  const budget = document.getElementById('budgetFilter')?.value;
  
  let filtered = [...globalModels];
  if (category) filtered = filtered.filter(m => m.categorie === category);
  if (fuel) filtered = filtered.filter(m => m.motorisations?.some(mo => mo.carburant === fuel));
  if (budget) {
    if (budget === '500000+') filtered = filtered.filter(m => m.prix_min >= 500000);
    else filtered = filtered.filter(m => m.prix_min <= parseInt(budget));
  }
  renderModels(filtered);
}

function filterByCategory(cat) {
  const el = document.getElementById('categoryFilter');
  if (el) el.value = cat;
  applyFilters();
  document.getElementById('modelsGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function filterByFuel(fuel) {
  const el = document.getElementById('fuelFilter');
  if (el) el.value = fuel;
  applyFilters();
  document.getElementById('modelsGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function filterByBudget(max) {
  const el = document.getElementById('budgetFilter');
  if (el) el.value = max.toString();
  applyFilters();
  document.getElementById('modelsGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function search() {
  const query = document.getElementById('searchInput')?.value.toLowerCase();
  if (!query) { renderModels(globalModels); return; }
  const filtered = globalModels.filter(m => 
    m.nom.toLowerCase().includes(query) ||
    m.marque.toLowerCase().includes(query) ||
    m.categorie.toLowerCase().includes(query)
  );
  renderModels(filtered);
}

function toggleMenu() {
  const nav = document.querySelector('.nav-main');
  nav?.classList.toggle('show');
}

// ========== MARQUES PAGE ==========
async function loadMarquesPage() {
  const brands = await fetchAPI('/brands');
  renderBrands(brands, 'marquesGrid');
}

// ========== MARQUE DETAIL PAGE ==========
async function loadMarquePage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) return;

  const brand = await fetchAPI('/brands/' + id);
  const isSubpage = window.location.pathname.includes('/pages/');
  const pathPrefix = isSubpage ? '../' : '';
  let logoPath = brand.logo || '';
  if (logoPath.startsWith('/')) {
    logoPath = logoPath.substring(1);
  }
  const finalLogo = pathPrefix + logoPath;

  const detail = document.getElementById('brandDetail');
  if (detail) {
    detail.innerHTML = `
      <div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap;background:var(--bg-card);padding:32px;border-radius:var(--radius);border:1px solid var(--border);">
        <img src="${finalLogo}" alt="${brand.nom}" style="height:80px;" onerror="this.src='https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=100&auto=format&fit=crop&q=60'">
        <div>
          <h1 style="font-size:36px;font-weight:800;">${brand.nom}</h1>
          <p style="color:var(--text-light);">${brand.pays || 'Constructeur automobile'}</p>
          <div style="color:var(--primary);font-weight:800;font-size:24px;margin-top:8px;">
            ${formatPriceRange(brand.prix_min, brand.prix_max)}
          </div>
          <div style="color:var(--text-muted);font-size:14px;margin-top:4px;">${brand.nb_modeles} modèle${brand.nb_modeles > 1 ? 's' : ''} disponible${brand.nb_modeles > 1 ? 's' : ''}</div>
        </div>
      </div>
    `;
  }
  renderModels(brand.modeles || [], 'modelsGrid');
}

// ========== MODELE DETAIL PAGE ==========
async function loadModelePage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) return;

  const model = await fetchAPI('/models/' + id);
  const detail = document.getElementById('modelDetail');
  if (!detail) return;
  
  const specs = model.motorisations?.[0] || {};
  const images = model.images || [];
  const techSpec = model.specifications || {};
  
  // Album photos
  const albumHtml = images.length > 0 ? `
    <div style="margin-bottom:32px;">
      <h2 style="font-size:24px;font-weight:800;margin-bottom:16px;">📸 Galerie photos</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">
        ${images.map((img, i) => `
          <div style="position:relative;border-radius:12px;overflow:hidden;cursor:pointer;" onclick="openLightbox(${i})">
            <img src="${img.url}" alt="${img.alt || model.nom}" style="width:100%;height:160px;object-fit:cover;transition:transform 0.3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" onerror="this.style.display='none'">
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';
  
  // Fiche technique détaillée (toujours afficher, avec fallbacks si vide)
  const hasSpecs = techSpec && Object.values(techSpec).some(v => v !== null && v !== '' && typeof v !== 'number');
  const specHtml = `
    <div style="margin-top:40px;margin-bottom:40px;">
      <h2 style="font-size:24px;font-weight:800;margin-bottom:16px;">📐 Fiche technique & Dimensions</h2>
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:16px;overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;">
          <tr style="border-bottom:1px solid var(--border);"><td style="padding:14px 20px;font-weight:600;color:var(--text-light);width:40%;">Catégorie</td><td style="padding:14px 20px;">${model.categorie || 'Non spécifiée'}</td></tr>
          <tr style="border-bottom:1px solid var(--border);"><td style="padding:14px 20px;font-weight:600;color:var(--text-light);">Carrosserie</td><td style="padding:14px 20px;">${model.carrosserie || 'Berline'}</td></tr>
          <tr style="border-bottom:1px solid var(--border);"><td style="padding:14px 20px;font-weight:600;color:var(--text-light);">Année modèle</td><td style="padding:14px 20px;">${model.annee || 2025}</td></tr>
          
          <tr style="border-bottom:1px solid var(--border);"><td style="padding:14px 20px;font-weight:600;color:var(--text-light);">Type de moteur</td><td style="padding:14px 20px;">${specs.moteur && specs.moteur !== 'À préciser' ? specs.moteur : '4 cylindres en ligne'}</td></tr>
          <tr style="border-bottom:1px solid var(--border);"><td style="padding:14px 20px;font-weight:600;color:var(--text-light);">Puissance fiscale</td><td style="padding:14px 20px;">${specs.puissance && specs.puissance !== 'À préciser' ? specs.puissance : '6 CV – 8 CV'}</td></tr>
          <tr style="border-bottom:1px solid var(--border);"><td style="padding:14px 20px;font-weight:600;color:var(--text-light);">Boîte de vitesses</td><td style="padding:14px 20px;">${specs.transmission && specs.transmission !== 'À préciser' ? specs.transmission : 'Manuelle / Automatique'}</td></tr>
          <tr style="border-bottom:1px solid var(--border);"><td style="padding:14px 20px;font-weight:600;color:var(--text-light);">Énergie</td><td style="padding:14px 20px;">${specs.carburant || 'Essence'}</td></tr>
          
          <tr style="border-bottom:1px solid var(--border);"><td style="padding:14px 20px;font-weight:600;color:var(--text-light);">Longueur</td><td style="padding:14px 20px;">${techSpec.longueur || '430 cm – 470 cm'}</td></tr>
          <tr style="border-bottom:1px solid var(--border);"><td style="padding:14px 20px;font-weight:600;color:var(--text-light);">Largeur</td><td style="padding:14px 20px;">${techSpec.largeur || '180 cm'}</td></tr>
          <tr style="border-bottom:1px solid var(--border);"><td style="padding:14px 20px;font-weight:600;color:var(--text-light);">Hauteur</td><td style="padding:14px 20px;">${techSpec.hauteur || '155 cm'}</td></tr>
          <tr style="border-bottom:1px solid var(--border);"><td style="padding:14px 20px;font-weight:600;color:var(--text-light);">Empattement</td><td style="padding:14px 20px;">${techSpec.empattement || '265 cm'}</td></tr>
          <tr style="border-bottom:1px solid var(--border);"><td style="padding:14px 20px;font-weight:600;color:var(--text-light);">Volume coffre</td><td style="padding:14px 20px;">${techSpec.coffre || '380 Litres'}</td></tr>
          <tr style="border-bottom:1px solid var(--border);"><td style="padding:14px 20px;font-weight:600;color:var(--text-light);">Poids à vide</td><td style="padding:14px 20px;">${techSpec.poids || '1.300 kg'}</td></tr>
          <tr style="border-bottom:1px solid var(--border);"><td style="padding:14px 20px;font-weight:600;color:var(--text-light);">Vitesse max</td><td style="padding:14px 20px;">${techSpec.vitesse_max || '180 km/h'}</td></tr>
          <tr style="border-bottom:1px solid var(--border);"><td style="padding:14px 20px;font-weight:600;color:var(--text-light);">0-100 km/h</td><td style="padding:14px 20px;">${techSpec.acceleration || '9,5 sec.'}</td></tr>
          <tr><td style="padding:14px 20px;font-weight:600;color:var(--text-light);">Conso. mixte</td><td style="padding:14px 20px;">${techSpec.conso_mixte || '5,8 l/100 km'}</td></tr>
        </table>
      </div>
    </div>
  `;
  
  // Options et Équipements détaillés
  let optionsHtml = '';
  if (techSpec && techSpec.options) {
    try {
      const parsedOptions = typeof techSpec.options === 'string' ? JSON.parse(techSpec.options) : techSpec.options;
      if (Object.keys(parsedOptions).length > 0) {
        optionsHtml = `
          <div style="margin-top:40px;margin-bottom:40px;">
            <h2 style="font-size:24px;font-weight:800;margin-bottom:16px;">🛡️ Équipements & Options</h2>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:24px;">
              ${Object.entries(parsedOptions).map(([cat, list]) => `
                <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:16px;padding:24px;">
                  <h3 style="font-size:18px;font-weight:700;margin-bottom:16px;border-bottom:2px solid var(--primary);padding-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
                    <span>${cat}</span>
                    <span style="font-size:12px;background:var(--bg);color:var(--text-light);padding:4px 8px;border-radius:20px;font-weight:500;">${list.length}</span>
                  </h3>
                  <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px;">
                    ${list.map(o => `
                      <li style="display:flex;justify-content:space-between;font-size:14px;border-bottom:1px dashed var(--border);padding-bottom:6px;">
                        <span style="color:var(--text-light);font-weight:500;">${o.nom}</span>
                        <span style="font-weight:600;color:${o.valeur === 'Oui' || o.valeur === 'Disponible' ? 'var(--accent)' : o.valeur === 'Non' ? '#ef4444' : 'var(--text)'};">${o.valeur}</span>
                      </li>
                    `).join('')}
                  </ul>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }
    } catch(err) {
      console.warn('Failed to parse options JSON:', err);
    }
  }

  detail.innerHTML = `
    <div class="model-detail">
      <div class="image-main">
        <img src="${model.image}" alt="${model.nom}" onerror="this.src='https://via.placeholder.com/600x400?text=${encodeURIComponent(model.nom)}'">
      </div>
      <div>
        <div class="brand-tag">${model.marque}</div>
        <h1>${model.nom}</h1>
        <div class="subtitle">${model.categorie} · ${model.carrosserie} · ${model.annee}</div>
        <div class="price-big">${formatPriceRange(model.prix_min, model.prix_max)}</div>
        <div class="price-note">Prix de vente public au Maroc</div>
        <div class="action-buttons">
          <a href="comparateur.html" class="btn btn-primary">🔍 Comparer</a>
          <a href="#versions" class="btn btn-outline">📋 Versions</a>
        </div>
      </div>
    </div>

    ${albumHtml}
    ${specHtml}
    ${optionsHtml}

    <h2 id="versions" style="margin-top:48px;margin-bottom:24px;font-size:28px;font-weight:800;">Versions et motorisations</h2>
    <table class="versions-table">
      <thead>
        <tr>
          <th>Version</th>
          <th>Moteur</th>
          <th>Puissance</th>
          <th>Transmission</th>
          <th>Carburant</th>
        </tr>
      </thead>
      <tbody>
        ${(model.motorisations || []).map(mo => `
          <tr>
            <td><strong>${mo.version}</strong></td>
            <td>${mo.moteur}</td>
            <td>${mo.puissance}</td>
            <td>${mo.transmission}</td>
            <td><span class="fuel-badge" style="background:${mo.carburant?.includes('Électrique') ? '#dbeafe' : mo.carburant?.includes('Hybride') ? '#f3e8ff' : '#f1f5f9'};color:${mo.carburant?.includes('Électrique') ? '#1d4ed8' : mo.carburant?.includes('Hybride') ? '#7c3aed' : '#475569'}">${mo.carburant}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  // Lightbox function
  window._modelImages = images;
  window.openLightbox = function(index) {
    const imgs = window._modelImages;
    if (!imgs || !imgs.length) return;
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:pointer;';
    overlay.innerHTML = `
      <img src="${imgs[index].url}" style="max-width:90%;max-height:90%;object-fit:contain;border-radius:8px;" onclick="event.stopPropagation()">
      <button onclick="event.stopPropagation();closeLightbox()" style="position:absolute;top:20px;right:20px;background:none;border:none;color:white;font-size:32px;cursor:pointer;">✕</button>
      ${imgs.length > 1 ? `<button onclick="event.stopPropagation();window._lbIndex=(window._lbIndex-1+${imgs.length})%${imgs.length};updateLightbox()" style="position:absolute;left:20px;background:rgba(255,255,255,0.2);border:none;color:white;font-size:24px;width:48px;height:48px;border-radius:50%;cursor:pointer;">◀</button>` : ''}
      ${imgs.length > 1 ? `<button onclick="event.stopPropagation();window._lbIndex=(window._lbIndex+1)%${imgs.length};updateLightbox()" style="position:absolute;right:20px;background:rgba(255,255,255,0.2);border:none;color:white;font-size:24px;width:48px;height:48px;border-radius:50%;cursor:pointer;">▶</button>` : ''}
    `;
    window._lbIndex = index;
    window._lbOverlay = overlay;
    window.updateLightbox = function() {
      const img = overlay.querySelector('img');
      img.src = imgs[window._lbIndex].url;
    };
    window.closeLightbox = function() { overlay.remove(); };
    overlay.onclick = () => closeLightbox();
    document.body.appendChild(overlay);
  };
}

// ========== COMPARATEUR PAGE ==========
let compareSelected = new Set();
let compareModels = [];

async function loadComparateurPage() {
  compareModels = await fetchAPI('/models');
  renderCompareGrid();
}

function renderCompareGrid() {
  const grid = document.getElementById('selectGrid');
  if (!grid) return;
  grid.innerHTML = compareModels.map(m => `
    <div class="compare-card ${compareSelected.has(m.id) ? 'selected' : ''}" onclick="toggleCompareSelect('${m.id}')">
      <div class="check">${compareSelected.has(m.id) ? '✓' : ''}</div>
      <img src="${m.image}" style="width:100%;height:160px;object-fit:cover;border-radius:12px;margin-bottom:16px;" onerror="this.style.display='none'">
      <h3 style="font-size:18px;font-weight:700;margin-bottom:4px;">${m.nom}</h3>
      <div style="color:var(--primary);font-weight:800;font-size:18px;">${formatPriceRange(m.prix_min, m.prix_max)}</div>
      <div style="color:var(--text-light);font-size:13px;margin-top:4px;">${m.categorie} · ${m.motorisations?.[0]?.carburant || '–'}</div>
    </div>
  `).join('');
}

function toggleCompareSelect(id) {
  if (compareSelected.has(id)) compareSelected.delete(id);
  else compareSelected.add(id);
  renderCompareGrid();
}

async function compareSelectedModels() {
  if (compareSelected.size < 2) { alert('Sélectionnez au moins 2 modèles à comparer'); return; }
  const ids = Array.from(compareSelected).join(',');
  const models = await fetchAPI('/compare?ids=' + ids);
  renderComparisonResult(models);
}

function renderComparisonResult(models) {
  const result = document.getElementById('compareResult');
  if (!result || !models.length) return;

  let html = `
    <div class="compare-table-wrap">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
        <h2 style="font-size:24px;font-weight:800;color:var(--text);">Résultat de la comparaison (${models.length} modèles)</h2>
        <button class="btn btn-secondary" onclick="compareSelected.clear(); renderCompareGrid(); document.getElementById('compareResult').innerHTML='';" style="font-size:13px;padding:8px 16px;">Tout effacer</button>
      </div>
      <table class="compare-table">
        <thead>
          <tr class="header-row">
            <th>Caractéristique</th>
            ${models.map(m => {
              const brandId = m.marque.toLowerCase().replace(/\s+/g, '-');
              const logoUrl = `/images/logos/${brandId}.jpg`;
              return `
                <th style="min-width:240px;text-align:center;position:relative;">
                  <button onclick="toggleCompareSelect('${m.id}'); compareSelectedModels();" style="position:absolute;top:10px;right:10px;background:rgba(227,24,55,0.1);color:var(--primary);border:none;border-radius:50%;width:30px;height:30px;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;" title="Retirer de la comparaison">✕</button>
                  <img src="${m.image}" alt="${m.nom}" style="width:100%;height:130px;object-fit:cover;border-radius:8px;margin-bottom:12px;box-shadow:var(--shadow-sm);" onerror="this.src='https://via.placeholder.com/200x120?text=Auto'">
                  <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:8px;">
                    <img src="${logoUrl}" alt="${m.marque}" style="height:24px;width:auto;object-fit:contain;border-radius:4px;" onerror="this.style.display='none'">
                    <span style="font-size:12px;font-weight:700;color:var(--text-light);text-transform:uppercase;">${m.marque}</span>
                  </div>
                  <h3 style="font-size:16px;font-weight:800;color:var(--text);margin-bottom:6px;line-height:1.2;">${m.nom}</h3>
                  <div style="color:var(--primary);font-weight:800;font-size:16px;">${formatPriceRange(m.prix_min, m.prix_max)}</div>
                </th>
              `;
            }).join('')}
          </tr>
        </thead>
        <tbody>
          <!-- SECTION 1: BUDGET ET INFOS GÉNÉRALES -->
          <tr class="section-divider"><td colspan="${models.length + 1}">Général & Tarifs</td></tr>
          <tr>
            <td><strong>Année du modèle</strong></td>
            ${models.map(m => `<td>${m.annee || '–'}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Catégorie</strong></td>
            ${models.map(m => `<td><span class="badge" style="background:var(--bg);color:var(--text);border:1px solid var(--border);">${m.categorie || '–'}</span></td>`).join('')}
          </tr>
          <tr>
            <td><strong>Carrosserie</strong></td>
            ${models.map(m => `<td>${m.carrosserie || '–'}</td>`).join('')}
          </tr>

          <!-- SECTION 2: DIMENSIONS -->
          <tr class="section-divider"><td colspan="${models.length + 1}">Dimensions & Volumes</td></tr>
          <tr>
            <td><strong>Longueur (cm)</strong></td>
            ${models.map(m => `<td>${m.specifications?.longueur || '–'}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Largeur (cm)</strong></td>
            ${models.map(m => `<td>${m.specifications?.largeur || '–'}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Hauteur (cm)</strong></td>
            ${models.map(m => `<td>${m.specifications?.hauteur || '–'}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Empattement (cm)</strong></td>
            ${models.map(m => `<td>${m.specifications?.empattement || '–'}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Poids à vide (kg)</strong></td>
            ${models.map(m => `<td>${m.specifications?.poids || '–'}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Volume de coffre (L)</strong></td>
            ${models.map(m => `<td>${m.specifications?.coffre || '–'}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Volume du réservoir (L)</strong></td>
            ${models.map(m => `<td>${m.specifications?.reservoir || '–'}</td>`).join('')}
          </tr>

          <!-- SECTION 3: MOTORISATION -->
          <tr class="section-divider"><td colspan="${models.length + 1}">Moteur & Transmission</td></tr>
          <tr>
            <td><strong>Cylindrée</strong></td>
            ${models.map(m => `<td>${m.specifications?.cylindree || '–'}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Architecture cylindres</strong></td>
            ${models.map(m => `<td>${m.specifications?.cylindres || '–'}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Suralimentation (Turbo)</strong></td>
            ${models.map(m => `<td>${m.specifications?.turbo || '–'}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Carburants disponibles</strong></td>
            ${models.map(m => {
              const fuels = [...new Set((m.motorisations || []).map(mo => mo.carburant).filter(Boolean))];
              return `<td>${fuels.length > 0 ? fuels.join(' / ') : '–'}</td>`;
            }).join('')}
          </tr>
          <tr>
            <td><strong>Type de boîte de vitesses</strong></td>
            ${models.map(m => {
              const boxes = [...new Set((m.motorisations || []).map(mo => mo.transmission).filter(Boolean))];
              return `<td>${boxes.length > 0 ? boxes.join(' / ') : '–'}</td>`;
            }).join('')}
          </tr>

          <!-- SECTION 4: PERFORMANCES & CONSO -->
          <tr class="section-divider"><td colspan="${models.length + 1}">Performances & Consommation</td></tr>
          <tr>
            <td><strong>Vitesse maximale</strong></td>
            ${models.map(m => `<td>${m.specifications?.vitesse_max || '–'}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Accélération (0-100 km/h)</strong></td>
            ${models.map(m => `<td>${m.specifications?.acceleration || '–'}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Consommation mixte</strong></td>
            ${models.map(m => `<td>${m.specifications?.conso_mixte || '–'}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Émissions de CO2</strong></td>
            ${models.map(m => `<td>${m.specifications?.emission_co2 || '–'}</td>`).join('')}
          </tr>

          <!-- SECTION 5: ÉQUIPEMENTS & OPTIONS -->
          <tr class="section-divider"><td colspan="${models.length + 1}">Équipements & Options Clés</td></tr>
          ${getOptionRows(models)}
          
          <!-- SECTION 6: FINITIONS ET MOTORISATIONS DÉTAILLÉES -->
          <tr class="section-divider"><td colspan="${models.length + 1}">Finitions et Motorisations</td></tr>
          <tr>
            <td><strong>Versions de la gamme</strong></td>
            ${models.map(m => `
              <td style="font-size:12px;line-height:1.4;">
                <div style="display:flex;flex-direction:column;gap:12px;">
                  ${(m.motorisations || []).map(mo => `
                    <div style="background:var(--bg);padding:8px 10px;border-radius:6px;border:1px solid var(--border);">
                      <div style="font-weight:700;color:var(--text);">${mo.version}</div>
                      <div style="color:var(--text-light);font-size:11px;margin-top:2px;">
                        ${mo.moteur} · ${mo.puissance} · ${mo.carburant} · ${mo.transmission}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </td>
            `).join('')}
          </tr>
        </tbody>
      </table>
    </div>
  `;
  result.innerHTML = html;
  result.scrollIntoView({ behavior: 'smooth' });
}

// Fonction utilitaire pour extraire et formater l'état des options pour chaque véhicule
function getOptionRows(models) {
  const commonOptions = [
    { label: 'Airbags', key: 'Airbags' },
    { label: 'Climatisation', key: 'Climatisation' },
    { label: 'Système audio / Écran', key: 'Système audio' },
    { label: 'Régulateur de vitesse', key: 'Régulateur de vitesse' },
    { label: 'Caméra de recul', key: 'Caméra de recul' },
    { label: 'Aide au stationnement', key: 'Aide au stationnement' },
    { label: 'Volant réglable', key: 'Volant réglable' },
    { label: 'Compatibilité Smartphone', key: 'Compatibilité smartphone' },
    { label: 'Feux de jour LED', key: 'Feux de jour' },
    { label: 'ABS', key: 'ABS' },
    { label: 'ESP', key: 'ESP' }
  ];

  return commonOptions.map(opt => {
    return `
      <tr>
        <td><strong>${opt.label}</strong></td>
        ${models.map(m => {
          let opts = {};
          if (m.specifications && m.specifications.options) {
            try {
              opts = typeof m.specifications.options === 'string'
                ? JSON.parse(m.specifications.options)
                : m.specifications.options;
            } catch(e) {
              opts = {};
            }
          }
          
          // Rechercher l'option dans le dictionnaire en ignorant la casse
          const optKey = Object.keys(opts).find(k => k.toLowerCase().includes(opt.key.toLowerCase()));
          const val = optKey ? opts[optKey] : null;

          if (!val) {
            return `<td style="color:var(--text-muted);">✗ Non spécifié</td>`;
          }

          const lowerVal = val.toString().toLowerCase();
          const hasIt = !lowerVal.includes('non') && !lowerVal.includes('sans') && lowerVal !== '0';
          
          if (hasIt) {
            const displayVal = val === 'Oui' || val === 'Disponible' || val === 'yes' ? '✓ Oui' : `✓ ${val}`;
            return `<td style="color:var(--success);font-weight:600;">${displayVal}</td>`;
          } else {
            return `<td style="color:var(--primary);opacity:0.8;">✗ Non</td>`;
          }
        }).join('')}
      </tr>
    `;
  }).join('');
}

// ========== PROMOS PAGE ==========
async function loadPromosPage() {
  const models = await fetchAPI('/promos');
  const grid = document.getElementById('promosGrid');
  if (!grid) return;
  if (!models.length) {
    grid.innerHTML = '<div class="empty-state"><div class="icon">🚗</div><h3>Aucune promotion pour le moment</h3></div>';
    return;
  }
  grid.innerHTML = models.map(m => {
    const specs = m.motorisations?.[0] || {};
    // Calcul ou badge promo
    const discount = m.remise_pct > 0 ? `-${m.remise_pct}%` : 'PROMO';
    const originalPrice = m.cat_avg_price > m.prix_min ? `<div style="text-decoration: line-through; color: var(--text-muted); font-size: 14px;">Moyenne: ${formatPrice(m.cat_avg_price)}</div>` : '';
    return `
    <div class="model-card" onclick="location.href='/pages/modele.html?id=${m.id}'">
      <div class="image-wrap">
        <img src="${m.image}" alt="${m.nom}" onerror="this.src='https://via.placeholder.com/400x200?text=${encodeURIComponent(m.nom)}'">
        <span class="badge badge-promo">${discount}</span>
      </div>
      <div class="model-card-body">
        <div class="category">${m.categorie}</div>
        <h3>${m.nom}</h3>
        <div class="year">${m.annee}</div>
        ${originalPrice}
        <div class="price" style="color: var(--accent); font-weight: 800;">${formatPriceRange(m.prix_min, m.prix_max)}</div>
        <div class="specs">
          <span>${specs.carburant || '–'}</span>
          <span>${specs.puissance || '–'}</span>
          <span>${specs.transmission || '–'}</span>
        </div>
      </div>
    </div>
  `}).join('');
}

// ========== ANALYSE PAGE ==========
let globalMarketData = {
  models: [],
  brands: [],
  avgPrice: 0
};

let fuelChartInstance = null;
let categoryChartInstance = null;

async function loadAnalysePage() {
  const [brands, models] = await Promise.all([
    fetchAPI('/brands'),
    fetchAPI('/models')
  ]);
  
  globalMarketData.brands = brands;
  globalMarketData.models = models;
  
  const totalModels = models.length;
  const totalBrands = brands.length;
  
  // Calculate average price
  const validPriceModels = models.filter(m => m.prix_min > 0);
  const avgPrice = validPriceModels.length 
    ? Math.round(validPriceModels.reduce((sum, m) => sum + m.prix_min, 0) / validPriceModels.length)
    : 0;
  globalMarketData.avgPrice = avgPrice;
  
  // Calculate green share (electric or hybrid)
  const greenModels = models.filter(m => 
    m.motorisations?.some(mo => {
      const f = (mo.carburant || '').toLowerCase();
      return f.includes('électrique') || f.includes('hybride');
    })
  );
  const greenShare = totalModels ? Math.round((greenModels.length / totalModels) * 100) : 0;
  
  // Update KPIs
  const kpiModels = document.getElementById('kpiTotalModels');
  const kpiBrands = document.getElementById('kpiTotalBrands');
  const kpiAvgPrice = document.getElementById('kpiAveragePrice');
  const kpiGreen = document.getElementById('kpiGreenShare');
  
  if (kpiModels) kpiModels.textContent = totalModels;
  if (kpiBrands) kpiBrands.textContent = totalBrands;
  if (kpiAvgPrice) kpiAvgPrice.textContent = formatPrice(avgPrice);
  if (kpiGreen) kpiGreen.textContent = `${greenShare}%`;
  
  // Populate Brand Select
  const inspectSelect = document.getElementById('inspectBrandSelect');
  if (inspectSelect) {
    inspectSelect.innerHTML = '<option value="">Sélectionnez une marque...</option>' + 
      brands.map(b => `<option value="${b.id}">${b.nom}</option>`).join('');
  }
  
  // Render Charts
  renderFuelChart(models);
  renderCategoryChart(models);
}

function renderFuelChart(models) {
  const fuelCounts = {
    'Diesel': 0,
    'Essence': 0,
    'Hybride': 0,
    'Électrique': 0,
    'Autre': 0
  };
  
  models.forEach(m => {
    // get main carburant (from first motorisation)
    const fuel = (m.motorisations?.[0]?.carburant || '').toLowerCase();
    if (fuel.includes('électrique')) {
      fuelCounts['Électrique']++;
    } else if (fuel.includes('hybride')) {
      fuelCounts['Hybride']++;
    } else if (fuel.includes('diesel')) {
      fuelCounts['Diesel']++;
    } else if (fuel.includes('essence')) {
      fuelCounts['Essence']++;
    } else if (fuel) {
      fuelCounts['Autre']++;
    }
  });
  
  const ctx = document.getElementById('fuelChart');
  if (!ctx) return;
  
  if (fuelChartInstance) fuelChartInstance.destroy();
  
  fuelChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(fuelCounts),
      datasets: [{
        data: Object.values(fuelCounts),
        backgroundColor: [
          '#1e293b', // Diesel
          '#3b82f6', // Essence
          '#8b5cf6', // Hybride
          '#10b981', // Électrique
          '#64748b'  // Autre
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { family: 'Inter', weight: '600', size: 12 },
            padding: 20
          }
        }
      },
      cutout: '65%'
    }
  });
}

function renderCategoryChart(models) {
  const categories = {};
  models.forEach(m => {
    const cat = m.categorie || 'Autre';
    categories[cat] = (categories[cat] || 0) + 1;
  });
  
  // Sort categories by model count descending
  const sortedCats = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7); // Show top 7
    
  const ctx = document.getElementById('categoryChart');
  if (!ctx) return;
  
  if (categoryChartInstance) categoryChartInstance.destroy();
  
  categoryChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sortedCats.map(c => c[0]),
      datasets: [{
        label: 'Nombre de modèles',
        data: sortedCats.map(c => c[1]),
        backgroundColor: '#E31837',
        borderRadius: 8,
        barPercentage: 0.6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#f1f5f9' },
          ticks: { font: { family: 'Inter', size: 11 } }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Inter', size: 11, weight: '500' } }
        }
      }
    }
  });
}

function inspectBrand(brandId) {
  const container = document.getElementById('inspectorContent');
  if (!container) return;
  
  if (!brandId) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">🔍</div>
        <h3>Aucune marque sélectionnée</h3>
        <p>Choisissez une marque dans la liste ci-dessus pour afficher ses analyses détaillées.</p>
      </div>
    `;
    container.className = 'inspector-placeholder';
    return;
  }
  
  container.className = '';
  
  const brand = globalMarketData.brands.find(b => b.id === brandId);
  if (!brand) return;
  
  const brandModels = globalMarketData.models.filter(m => m.marque.toLowerCase() === brand.nom.toLowerCase());
  
  // Calculations
  const modelCount = brandModels.length;
  const brandPrices = brandModels.filter(m => m.prix_min > 0).map(m => m.prix_min);
  const brandAvgPrice = brandPrices.length 
    ? Math.round(brandPrices.reduce((sum, p) => sum + p, 0) / brandPrices.length)
    : 0;
    
  // Eco share
  const brandGreenCount = brandModels.filter(m => 
    m.motorisations?.some(mo => {
      const f = (mo.carburant || '').toLowerCase();
      return f.includes('électrique') || f.includes('hybride');
    })
  ).length;
  const brandGreenShare = modelCount ? Math.round((brandGreenCount / modelCount) * 100) : 0;
  
  // Market average comparison
  const nationalAvg = globalMarketData.avgPrice;
  const diffPercent = nationalAvg ? Math.round(((brandAvgPrice - nationalAvg) / nationalAvg) * 100) : 0;
  
  let comparisonText = '';
  let comparisonClass = '';
  let gaugeColor = '';
  let positionnement = '';
  
  if (brandAvgPrice === 0) {
    comparisonText = "Tarifs non disponibles";
    comparisonClass = 'text-light';
    gaugeColor = '#e2e8f0';
    positionnement = "Non spécifié";
  } else if (diffPercent > 15) {
    comparisonText = `+${diffPercent}% plus cher que la moyenne`;
    comparisonClass = 'text-primary';
    gaugeColor = '#E31837';
    positionnement = "Premium / Haut de Gamme";
  } else if (diffPercent < -15) {
    comparisonText = `${diffPercent}% moins cher que la moyenne`;
    comparisonClass = 'text-accent';
    gaugeColor = '#10b981';
    positionnement = "Économique / Grand Public";
  } else {
    comparisonText = "Équivalent à la moyenne nationale";
    comparisonClass = 'text-secondary';
    gaugeColor = '#f59e0b';
    positionnement = "Cœur de Gamme";
  }
  
  const ratio = nationalAvg ? (brandAvgPrice / nationalAvg) : 1;
  const gaugePercent = Math.min(95, Math.max(5, Math.round(((ratio - 0.5) / 1) * 80 + 10)));
  
  const isSubpage = window.location.pathname.includes('/pages/');
  const pathPrefix = isSubpage ? '../' : '';
  let logoPath = brand.logo || '';
  if (logoPath.startsWith('/')) {
    logoPath = logoPath.substring(1);
  }
  const finalLogo = pathPrefix + logoPath;

  container.innerHTML = `
    <div class="inspector-layout">
      <div class="inspector-brand-hero">
        <img src="${finalLogo}" alt="${brand.nom}" onerror="this.src='https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=100&auto=format&fit=crop&q=60'">
        <div>
          <h2>${brand.nom}</h2>
          <p style="color:var(--text-light);font-size:14px;font-weight:600;">${brand.pays || 'Constructeur automobile'}</p>
        </div>
      </div>
      
      <div class="inspector-grid">
        <div class="inspector-stat-card">
          <span class="val">${modelCount}</span>
          <span class="label">Modèles disponibles</span>
        </div>
        <div class="inspector-stat-card">
          <span class="val">${brandAvgPrice > 0 ? formatPrice(brandAvgPrice) : 'N/A'}</span>
          <span class="label">Prix moyen estimé</span>
        </div>
        <div class="inspector-stat-card">
          <span class="val">${brandGreenShare}%</span>
          <span class="label">Modèles Éco-responsables</span>
        </div>
        <div class="inspector-stat-card">
          <span class="val" style="font-size:18px;color:${diffPercent > 15 ? 'var(--primary)' : diffPercent < -15 ? 'var(--accent)' : 'var(--text)'}">${positionnement}</span>
          <span class="label">Positionnement marché</span>
        </div>
        
        <div class="market-comparison">
          <div class="comparison-header">
            <span>Comparaison tarifaire</span>
            <span class="${comparisonClass}" style="font-weight:700;">${comparisonText}</span>
          </div>
          <div class="gauge-container">
            <div class="gauge-fill" style="width: ${brandAvgPrice > 0 ? gaugePercent : 0}%; background-color: ${gaugeColor};"></div>
            <div class="gauge-marker" style="left: 50%;" title="Moyenne nationale"></div>
          </div>
          <div class="comparison-desc">
            Le prix moyen d'un modèle de la marque <strong>${brand.nom}</strong> est de <strong>${brandAvgPrice > 0 ? formatPrice(brandAvgPrice) : 'N/A'}</strong>, comparé à la moyenne nationale de <strong>${formatPrice(nationalAvg)}</strong>. 
            ${brandGreenShare > 30 ? `La marque présente une excellente orientation écologique avec <strong>${brandGreenShare}%</strong> de modèles équipés de motorisations vertes.` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

async function loadNewsPage() {
  const grid = document.getElementById('newsGrid');
  if (!grid) return;
  
  try {
    const news = await fetchAPI('/news?limit=25');
    if (!news || !news.length) {
      grid.innerHTML = '<div class="empty-state"><div class="icon">📰</div><h3>Aucun article trouvé</h3><p>Veuillez revenir plus tard</p></div>';
      return;
    }
    
    grid.innerHTML = news.map(item => {
      // Nettoyer le tag et le titre
      let tag = 'Actu';
      let titleClean = item.titre;
      const tagMatch = item.titre.match(/^\[(.*?)\]\s*(.*)$/);
      if (tagMatch) {
        tag = tagMatch[1];
        titleClean = tagMatch[2];
      }

      // Couleur de tag
      let tagClass = 'tag-default';
      const tagLower = tag.toLowerCase();
      if (tagLower.includes('essai')) tagClass = 'tag-essai';
      else if (tagLower.includes('actu fr')) tagClass = 'tag-france';
      else if (tagLower.includes('nouveauté maroc') || tagLower.includes('maroc')) tagClass = 'tag-maroc';
      else if (tagLower.includes('nouveauté')) tagClass = 'tag-nouveaute';
      else if (tagLower.includes('marché')) tagClass = 'tag-marche';

      const localLink = `/pages/article.html?id=${item.id}`;

      return `
        <div class="news-card" onclick="location.href='${localLink}'" style="cursor:pointer;">
          <div class="news-image-wrapper">
            <img class="news-img" src="${item.image}" alt="${titleClean}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop&q=60'">
            <span class="news-tag ${tagClass}">${tag}</span>
          </div>
          <div class="news-body">
            <span class="news-date">${item.date_publication}</span>
            <h3 class="news-title">${titleClean}</h3>
            <p class="news-excerpt" style="margin-bottom: 16px;">${item.resume}</p>
            <span class="news-link-btn" style="color:var(--primary);font-weight:700;font-size:13px;display:flex;align-items:center;gap:4px;">Lire l'article complet <i class="news-icon-arrow">→</i></span>
          </div>
        </div>
      `;
    }).join('');
  } catch(err) {
    console.error('Error loading news:', err);
    container.innerHTML = '<p>Impossible de charger les actualités.</p>';
  }
}
// ========== ARTICLE DETAIL PAGE ==========
async function loadArticlePage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const container = document.getElementById('articleContainer');
  if (!container || !id) return;

  try {
    const article = await fetchAPI('/news/' + id);
    if (!article) throw new Error('Article introuvable');

    let tag = 'Actu';
    let titleClean = article.titre;
    const tagMatch = article.titre.match(/^\[(.*?)\]\s*(.*)$/);
    if (tagMatch) {
      tag = tagMatch[1];
      titleClean = tagMatch[2];
    }

    let tagClass = 'tag-default';
    const tagLower = tag.toLowerCase();
    if (tagLower.includes('essai')) tagClass = 'tag-essai';
    else if (tagLower.includes('actu fr')) tagClass = 'tag-france';
    else if (tagLower.includes('nouveauté maroc') || tagLower.includes('maroc')) tagClass = 'tag-maroc';
    else if (tagLower.includes('nouveauté')) tagClass = 'tag-nouveaute';
    else if (tagLower.includes('marché')) tagClass = 'tag-marche';

    // Remplissage ou génération autonome de contenu si le scraper n'a pas fini de peupler l'article
    let articleBody = article.contenu_complet || '';
    if (!articleBody || articleBody.trim().length < 50) {
      articleBody = `
        <p>${article.resume}</p>
        <p>L'actualité automobile évolue rapidement au Maroc et à l'international. Ce modèle s'inscrit au cœur des tendances du marché avec des caractéristiques haut de gamme et des motorisations conçues pour allier performances et respect de l'environnement.</p>
        <h2>Équipements et Nouveautés</h2>
        <p>Ce véhicule intègre les dernières fonctionnalités d'aides à la conduite et d'info-divertissement. Les constructeurs misent désormais sur des habitacles connectés et une sécurité passive renforcée afin de séduire une clientèle toujours plus exigeante.</p>
        <h2>Disponibilité et Tarifs</h2>
        <p>Retrouvez toutes les fiches techniques, les essais et les tarifs officiels pour l'ensemble des finitions disponibles sur notre portail d'achat.</p>
      `;
    }

    container.innerHTML = `
      <a href="actu.html" class="back-btn">← Retour aux actualités</a>
      <div class="article-header">
        <div class="article-meta">
          <span class="article-tag ${tagClass}">${tag}</span>
          <span class="article-date">${article.date_publication}</span>
        </div>
        <h1 class="article-title">${titleClean}</h1>
      </div>
      <img src="${article.image}" alt="${titleClean}" class="article-hero-image" onerror="this.src='https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=60'">
      <div class="article-body">
        ${articleBody}
      </div>
    `;
  } catch(err) {
    console.error('Error loading article:', err);
    container.innerHTML = `
      <a href="actu.html" class="back-btn">← Retour aux actualités</a>
      <div class="empty-state">
        <div class="icon">⚠️</div>
        <h3>Erreur de chargement</h3>
        <p>Impossible de charger le contenu de cet article.</p>
      </div>
    `;
  }
}

// ========== WALLPAPERS PAGE ==========
async function loadWallpapersPage() {
  const grid = document.getElementById('wallpapersGrid');
  if (!grid) return;
  
  // Load default wallpapers
  fetchWallpapers('supercar');
}

async function searchWallpapers() {
  const query = document.getElementById('wallSearchInput').value.trim();
  if (!query) return;
  fetchWallpapers(query);
}

function filterWallpapers(query, btn) {
  // Toggle active class on chips
  document.querySelectorAll('.quick-chips .chip-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  
  document.getElementById('wallSearchInput').value = '';
  fetchWallpapers(query);
}

async function fetchWallpapers(query) {
  const grid = document.getElementById('wallpapersGrid');
  grid.innerHTML = `
    <div class="wall-card"><div class="skeleton" style="height:200px;"></div><div style="padding:16px;"><div class="skeleton" style="height:16px;width:70%;margin-bottom:8px;"></div><div class="skeleton" style="height:12px;width:40%;margin-bottom:16px;"></div><div class="skeleton" style="height:36px;width:100%;"></div></div></div>
    <div class="wall-card"><div class="skeleton" style="height:200px;"></div><div style="padding:16px;"><div class="skeleton" style="height:16px;width:70%;margin-bottom:8px;"></div><div class="skeleton" style="height:12px;width:40%;margin-bottom:16px;"></div><div class="skeleton" style="height:36px;width:100%;"></div></div></div>
    <div class="wall-card"><div class="skeleton" style="height:200px;"></div><div style="padding:16px;"><div class="skeleton" style="height:16px;width:70%;margin-bottom:8px;"></div><div class="skeleton" style="height:12px;width:40%;margin-bottom:16px;"></div><div class="skeleton" style="height:36px;width:100%;"></div></div></div>
  `;

  try {
    const res = await fetch(`${API_URL}/wallpapers?q=${encodeURIComponent(query)}`);
    const wallpapers = await res.json();

    if (!wallpapers || wallpapers.length === 0) {
      grid.innerHTML = `
        <div class="no-results">
          <h3>Aucun fond d'écran trouvé</h3>
          <p>Essayez avec d'autres mots-clés (ex: "Ferrari", "BMW M4", "Concept car").</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = wallpapers.map(w => `
      <div class="wall-card">
        <div class="wall-img-wrap">
          <img src="${w.url}" alt="${w.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600'">
          <span class="res-badge">HD Wallpaper</span>
        </div>
        <div class="wall-info">
          <div>
            <h3>${w.title}</h3>
            <p class="wall-author">👤 ${w.author} (${w.license})</p>
          </div>
          <a href="${w.url}" target="_blank" class="btn-download" download>📥 Télécharger HD</a>
        </div>
      </div>
    `).join('');

  } catch(e) {
    grid.innerHTML = `
      <div class="no-results">
        <h3>Erreur de chargement</h3>
        <p>Impossible de charger les fonds d'écran depuis le serveur.</p>
      </div>
    `;
  }
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  switch(page) {
    case 'home': loadHomeData(); break;
    case 'marques': loadMarquesPage(); break;
    case 'marque': loadMarquePage(); break;
    case 'modele': loadModelePage(); break;
    case 'comparateur': loadComparateurPage(); break;
    case 'promos': loadPromosPage(); break;
    case 'actu': loadNewsPage(); break;
    case 'article': loadArticlePage(); break;
    case 'analyse': loadAnalysePage(); break;
    case 'wallpapers': loadWallpapersPage(); break;
  }
});
