const fs = require('fs');
const path = require('path');
const axios = require('axios');

const TARGET_FILE = path.join(__dirname, '../data/wallpapers.json');

async function fetchGlobalWallpapers() {
  console.log('📡 Récupération des meilleurs wallpapers auto mondiaux (Wallhaven)...');
  const allWallpapers = [];
  
  // Récupérer 5 pages (5 * 24 = 120 wallpapers)
  for (let page = 1; page <= 5; page++) {
    const url = `https://wallhaven.cc/api/v1/search?q=cars&categories=110&purity=100&sorting=views&order=desc&page=${page}`;
    console.log(`   📄 Page ${page}...`);
    try {
      const response = await axios.get(url);
      const items = response.data.data || [];
      for (const p of items) {
        allWallpapers.push({
          url: p.path,
          title: 'Wallpaper Sport Car',
          author: 'Wallhaven ' + (p.uploader ? p.uploader.username : 'Contributor'),
          license: 'Free CC'
        });
      }
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.error(`   ❌ Erreur de chargement page ${page}:`, e.message);
    }
  }

  if (allWallpapers.length > 0) {
    const dir = path.dirname(TARGET_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(TARGET_FILE, JSON.stringify(allWallpapers, null, 2));
    console.log(`✅ ${allWallpapers.length} wallpapers mondiaux enregistrés dans ${TARGET_FILE} !`);
  } else {
    console.warn('⚠️ Aucun wallpaper n\'a pu être récupéré.');
  }
}

fetchGlobalWallpapers();
