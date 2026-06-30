const axios = require('axios');
const cheerio = require('cheerio');
const { initDB, insertNews } = require('./db');

const axiosInstance = axios.create({
  timeout: 20000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  }
});

// SOURCE 1 : Wandaloo Autonews (Maroc) - Pages 1 à 6
async function scrapeSourceWandaloo(articles) {
  console.log('📰 SOURCE 1 : Scraping Wandaloo Autonews (Pages 1 à 6)...');
  const BASE_URL = 'https://www.wandaloo.com';
  
  for (let page = 1; page <= 6; page++) {
    const ACTU_URL = page === 1 
      ? 'https://www.wandaloo.com/autonews/' 
      : `https://www.wandaloo.com/autonews/${page}.html`;
    
    console.log(`   📄 Page ${page}...`);
    try {
      const res = await axiosInstance.get(ACTU_URL, {
        headers: { 'Referer': 'https://www.wandaloo.com/' }
      });
      const $ = cheerio.load(res.data);
      let count = 0;

      $('#news li, .list-actu li').each((_, el) => {
        const $el = $(el);
        const $photo = $el.find('.photo');
        const $post = $el.find('.post');
        
        if (!$photo.length || !$post.length) return;

        const $titleLink = $post.find('.titre a').first();
        if (!$titleLink.length) return;

        const titre = $titleLink.text().trim();
        let link = $titleLink.attr('href') || '';
        if (!link) return;

        if (!link.startsWith('http')) {
          link = BASE_URL + (link.startsWith('/') ? '' : '/') + link;
        }

        const $img = $photo.find('img').first();
        let image = $img.attr('src') || '';
        if (image && !image.startsWith('http')) {
          image = BASE_URL + (image.startsWith('/') ? '' : '/') + image;
        }

        const resume = $post.find('.content').text().replace(/\s+/g, ' ').trim();
        const tag = $post.find('.tag').text().trim() || 'Actu';

        const dataText = $post.find('.data').text().trim();
        let date_publication = new Date().toLocaleDateString('fr-FR');
        const dateMatch = dataText.match(/\d+\s+[a-zéû]+\s+\d{4}/i);
        if (dateMatch) {
          date_publication = dateMatch[0];
        }

        if (titre && link && !articles.some(a => a.lien_article === link)) {
          articles.push({
            titre: `[${tag}] ${titre}`,
            resume: resume.slice(0, 220) + (resume.length > 220 ? '...' : ''),
            image,
            date_publication,
            lien_article: link
          });
          count++;
        }
      });
      console.log(`      ✅ Page ${page} terminée : ${count} articles récupérés.`);
      // Attente entre les pages
      await new Promise(r => setTimeout(r, 600));
    } catch (e) {
      console.error(`      ❌ Erreur Page ${page} Wandaloo:`, e.message);
    }
  }
}

// SOURCE 2 : Autonews.ma (Maroc) - Pages 1 à 6
async function scrapeSourceAutonewsMa(articles) {
  console.log('📰 SOURCE 2 : Scraping Autonews.ma (Pages 1 à 6)...');
  const BASE_URL = 'https://autonews.ma';
  
  for (let page = 1; page <= 6; page++) {
    const ACTU_URL = page === 1 
      ? 'https://autonews.ma/actualite-auto/toute-l-actualite' 
      : `https://autonews.ma/actualite-auto/toute-l-actualite/page/${page}`;
      
    console.log(`   📄 Page ${page}...`);
    try {
      const res = await axiosInstance.get(ACTU_URL, {
        headers: { 'Referer': 'https://autonews.ma/' }
      });
      const $ = cheerio.load(res.data);
      let count = 0;

      $('article, .item-article, .post-item, .post, .custom-card').each((_, el) => {
        const $el = $(el);
        const $titleLink = $el.find('h2 a, h3 a, h4 a, .title a, a[href*="/actualite-auto/"]').first();
        if (!$titleLink.length) return;

        const titre = $titleLink.text().trim();
        let link = $titleLink.attr('href') || '';
        if (!link || link.includes('toute-l-actualite') || link === BASE_URL || link === `${BASE_URL}/`) return;

        if (!link.startsWith('http')) {
          link = BASE_URL + (link.startsWith('/') ? '' : '/') + link;
        }

        const $img = $el.find('img').first();
        let image = $img.attr('data-src') || $img.attr('src') || '';
        if (image && !image.startsWith('http')) {
          image = BASE_URL + (image.startsWith('/') ? '' : '/') + image;
        }

        if (!image || image.includes('lazy') || image.includes('placeholder')) {
          image = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=60';
        }

        const $desc = $el.find('.desc, .excerpt, p, .text').first();
        let resume = $desc.text().replace(/\s+/g, ' ').trim();
        if (!resume || resume.length < 10) {
          resume = 'Découvrez l\'actualité automobile nationale et internationale sur le magazine de référence.';
        }

        const $date = $el.find('.date, .time, .meta, span').first();
        const date_publication = $date.text().trim() || new Date().toLocaleDateString('fr-FR');

        if (titre && link && titre.length > 5 && !articles.some(a => a.lien_article === link)) {
          articles.push({
            titre: `[Autonews] ${titre}`,
            resume: resume.slice(0, 220) + (resume.length > 220 ? '...' : ''),
            image,
            date_publication,
            lien_article: link
          });
          count++;
        }
      });

      // Sélecteur secondaire
      $('a[href*="/actualite-auto/"]').each((_, linkEl) => {
        const $link = $(linkEl);
        const titre = $link.text().trim();
        let link = $link.attr('href') || '';
        if (!titre || titre.length < 25 || link.includes('toute-l-actualite')) return;

        if (!link.startsWith('http')) {
          link = BASE_URL + (link.startsWith('/') ? '' : '/') + link;
        }

        if (titre && link && !articles.some(a => a.lien_article === link)) {
          articles.push({
            titre: `[Autonews] ${titre}`,
            resume: 'Retrouvez tous les détails de cet article d\'actualité auto directement sur Autonews.ma.',
            image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=60',
            date_publication: new Date().toLocaleDateString('fr-FR'),
            lien_article: link
          });
          count++;
        }
      });

      console.log(`      ✅ Page ${page} terminée : ${count} articles récupérés.`);
      await new Promise(r => setTimeout(r, 600));
    } catch (e) {
      console.error(`      ❌ Erreur Page ${page} Autonews.ma:`, e.message);
    }
  }
}

// SOURCE 3 : Le Blog Auto (France) - Pages 1 à 6
async function scrapeSourceLeBlogAuto(articles) {
  console.log('📰 SOURCE 3 : Scraping Le Blog Auto (France - Pages 1 à 6)...');
  const BASE_URL = 'https://www.leblogauto.com';
  
  for (let page = 1; page <= 6; page++) {
    const ACTU_URL = page === 1 
      ? 'https://www.leblogauto.com' 
      : `https://www.leblogauto.com/page/${page}/`;
      
    console.log(`   📄 Page ${page}...`);
    try {
      const res = await axiosInstance.get(ACTU_URL, {
        headers: { 'Referer': 'https://www.leblogauto.com/' }
      });
      const $ = cheerio.load(res.data);
      let count = 0;

      $('article.l-post').each((_, el) => {
        const $el = $(el);
        
        const $titleLink = $el.find('.post-title a').first();
        if (!$titleLink.length) return;

        const titre = $titleLink.text().trim();
        let link = $titleLink.attr('href') || '';
        if (!link) return;

        if (!link.startsWith('http')) {
          link = BASE_URL + (link.startsWith('/') ? '' : '/') + link;
        }

        const $imgSpan = $el.find('.image-link span.img, img').first();
        let image = $imgSpan.attr('data-bgsrc') || $imgSpan.attr('src') || '';
        if (image && !image.startsWith('http')) {
          image = BASE_URL + (image.startsWith('/') ? '' : '/') + image;
        }

        if (!image) {
          image = 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=600&auto=format&fit=crop&q=60';
        }

        let resume = $el.find('.excerpt').text().replace(/\s+/g, ' ').trim();
        if (!resume) {
          resume = 'Toute l\'actualité de l\'automobile en France et à l\'international, nouveaux modèles, tests de conduite et insolite.';
        }

        const $date = $el.find('time.post-date').first();
        const date_publication = $date.text().trim() || new Date().toLocaleDateString('fr-FR');

        if (titre && link && !articles.some(a => a.lien_article === link)) {
          articles.push({
            titre: `[Actu Fr] ${titre}`,
            resume: resume.slice(0, 220) + (resume.length > 220 ? '...' : ''),
            image,
            date_publication,
            lien_article: link
          });
          count++;
        }
      });

      console.log(`      ✅ Page ${page} terminée : ${count} articles récupérés.`);
      await new Promise(r => setTimeout(r, 600));
    } catch (e) {
      console.error(`      ❌ Erreur Page ${page} Le Blog Auto:`, e.message);
    }
  }
}

async function scrapeNews() {
  console.log('📰 Scraping Complet des Archives d\'Actualités (Maroc + France)...\n');
  initDB();
  
  const articles = [];

  // Exécuter les 3 scrappers
  await scrapeSourceWandaloo(articles);
  await scrapeSourceAutonewsMa(articles);
  await scrapeSourceLeBlogAuto(articles);

  console.log(`\n📦 Total articles collectés : ${articles.length}`);

  // Enregistrer en base SQLite
  for (const art of articles) {
    await new Promise((resolve) => {
      insertNews(art, (err) => {
        if (!err) console.log(`   💾 Sauvegardé : ${art.titre}`);
        resolve();
      });
    });
  }

  console.log('\n✅ Importation de la totalité des articles terminée !');
}

module.exports = { scrapeNews };

if (require.main === module) {
  scrapeNews().catch(console.error);
}
