const axios = require('axios');
const cheerio = require('cheerio');
const { initDB, insertNews, getNews } = require('./db');

const BASE_URL = 'https://www.wandaloo.com';
const ACTU_URL = 'https://www.wandaloo.com/autonews/';

const axiosInstance = axios.create({
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Referer': 'https://www.wandaloo.com/'
  }
});

async function scrapeNews() {
  console.log('📰 Scraping Wandaloo Autonews...\n');
  initDB();

  try {
    const res = await axiosInstance.get(ACTU_URL);
    const $ = cheerio.load(res.data);
    const articles = [];

    // Sélecteurs d'actualités réels sur autonews Wandaloo
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
      // La date est souvent à la fin après le calendrier
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
      }
    });

    console.log(`Found ${articles.length} news articles.\n`);

    for (const art of articles) {
      await new Promise((resolve) => {
        insertNews(art, (err) => {
          if (!err) console.log(`   ✅ Saved: ${art.titre}`);
          resolve();
        });
      });
    }

    console.log('\n✅ News scraping completed!');
  } catch (e) {
    console.error('❌ News scraping error:', e.message);
  }
}

module.exports = { scrapeNews };

if (require.main === module) {
  scrapeNews().catch(console.error);
}
