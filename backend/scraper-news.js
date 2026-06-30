const axios = require('axios');
const cheerio = require('cheerio');
const { initDB, insertNews } = require('./db');

const axiosInstance = axios.create({
  timeout: 20000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  }
});

// SOURCE 1 : Wandaloo Autonews
async function scrapeSourceWandaloo(articles) {
  console.log('📰 SOURCE 1 : Scraping Wandaloo Autonews...');
  const BASE_URL = 'https://www.wandaloo.com';
  const ACTU_URL = 'https://www.wandaloo.com/autonews/';
  
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

      // Parser la date dans le paragraphe .data
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
    console.log(`   ✅ Wandaloo : ${count} articles récupérés.`);
  } catch (e) {
    console.error('   ❌ Erreur Wandaloo news:', e.message);
  }
}

// SOURCE 2 : Autonews.ma
async function scrapeSourceAutonewsMa(articles) {
  console.log('📰 SOURCE 2 : Scraping Autonews.ma...');
  const BASE_URL = 'https://autonews.ma';
  const ACTU_URL = 'https://autonews.ma/actualite-auto/toute-l-actualite';
  
  try {
    const res = await axiosInstance.get(ACTU_URL, {
      headers: { 'Referer': 'https://autonews.ma/' }
    });
    const $ = cheerio.load(res.data);
    let count = 0;

    // Sur Autonews.ma, la liste d'actus est souvent sous des structures d'articles ou des cards
    // Inspectons les classes d'articles standard de WordPress (comme article, block-article, card-post, post-item)
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

    // Si le sélecteur d'articles WP a retourné peu de résultats, on essaie de cibler directement les liens d'articles autonews
    if (count === 0) {
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
    }

    console.log(`   ✅ Autonews.ma : ${count} articles récupérés.`);
  } catch (e) {
    console.error('   ❌ Erreur Autonews.ma news:', e.message);
  }
}

async function scrapeNews() {
  console.log('📰 Scraping des Actualités Auto Multi-Sources...\n');
  initDB();
  
  const articles = [];

  // Exécuter les 2 scrappers
  await scrapeSourceWandaloo(articles);
  await scrapeSourceAutonewsMa(articles);

  console.log(`\n📦 Total articles trouvés : ${articles.length}`);

  // Enregistrer en base SQLite
  for (const art of articles) {
    await new Promise((resolve) => {
      insertNews(art, (err) => {
        if (!err) console.log(`   💾 Sauvegardé : ${art.titre}`);
        resolve();
      });
    });
  }

  console.log('\n✅ Synchronisation des actualités terminée !');
}

module.exports = { scrapeNews };

if (require.main === module) {
  scrapeNews().catch(console.error);
}
