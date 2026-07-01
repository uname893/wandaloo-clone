const axios = require('axios');
const cheerio = require('cheerio');
const { initDB, insertNews } = require('./db');

const axiosInstance = axios.create({
  timeout: 20000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  }
});

// Extraire le contenu complet textuel propre de l'article
async function fetchArticleContent(url, source) {
  try {
    const res = await axiosInstance.get(url);
    const $ = cheerio.load(res.data);
    let contentHtml = '';

    if (source === 'wandaloo') {
      // Wandaloo : cible généralement .content-news, #news-details, ou le div avec le texte principal
      const $main = $('.content-news, #news-txt, .texte, .desc-news').first();
      if ($main.length) {
        // Nettoyage des éléments superflus
        $main.find('script, style, iframe, .share, .partage, .fb-like, form, button').remove();
        contentHtml = $main.html().trim();
      } else {
        // Fallback sur les paragraphes
        const paragraphs = [];
        $('p').each((_, p) => {
          const txt = $(p).text().trim();
          if (txt.length > 50 && !txt.includes('Wandaloo') && !txt.includes('Droits réservés')) {
            paragraphs.push(`<p>${txt}</p>`);
          }
        });
        contentHtml = paragraphs.join('');
      }
    } else if (source === 'moteur.ma') {
      const paragraphs = [];
      $('.card-body p').each((_, p) => {
        const txt = $(p).text().trim();
        if (txt.length > 40 && !txt.includes('Restez branchés') && !txt.includes('prix et versions')) {
          paragraphs.push(`<p>${txt}</p>`);
        }
      });
      contentHtml = paragraphs.join('');
    } else if (source === 'autotrends') {
      const paragraphs = [];
      $('p').each((_, p) => {
        const txt = $(p).text().trim();
        if (txt.length > 50 && !txt.includes('lancements, innovations') && !txt.includes('décryptages approfondis')) {
          paragraphs.push(`<p>${txt}</p>`);
        }
      });
      contentHtml = paragraphs.join('');
    } else if (source === 'leblogauto') {
      // Le Blog Auto : cible .post-content, .entry-content
      const $main = $('.post-content, .entry-content, .post-entry').first();
      if ($main.length) {
        $main.find('script, style, iframe, .ads, .ad-box, .social-share, .tag-links, .wp-block-buttons').remove();
        contentHtml = $main.html().trim();
      } else {
        const paragraphs = [];
        $('.post-content p, article p').each((_, p) => {
          const txt = $(p).text().trim();
          if (txt.length > 40 && !txt.includes('Abonnez-vous')) paragraphs.push(`<p>${txt}</p>`);
        });
        contentHtml = paragraphs.join('');
      }
    } else {
      const $main = $('article, .article-content, .entry-content, .post-content, .article__content').first();
      if ($main.length) {
        $main.find('script, style, iframe, .ads, .ad-box, .social-share, form, button').remove();
        contentHtml = $main.html().trim();
      } else {
        const paragraphs = [];
        $('p').each((_, p) => {
          const txt = $(p).text().trim();
          if (txt.length > 50) paragraphs.push(`<p>${txt}</p>`);
        });
        contentHtml = paragraphs.join('');
      }
    }

    // Nettoyer les balises de liens qui pourraient indiquer la provenance ou des pubs
    if (contentHtml) {
      const $clean = cheerio.load(contentHtml);
      
      // Supprimer les mentions explicites de liens externes Wandaloo / Autonews
      $clean('a').each((_, a) => {
        const $a = $clean(a);
        const linkTxt = $a.text().toLowerCase();
        if (linkTxt.includes('lire aussi') || linkTxt.includes('fiche technique') || linkTxt.includes('wandaloo') || linkTxt.includes('autonews')) {
          $a.remove();
        } else {
          $a.replaceWith($a.text());
        }
      });

      // Supprimer les paragraphes et blocs contenant des mentions de la source ou pub
      $clean('p, div, li, span').each((_, el) => {
        const $el = $clean(el);
        const txt = $el.text().toLowerCase();
        if (
          txt.includes('wandaloo') || 
          txt.includes('autonews') || 
          txt.includes('leblogauto') || 
          txt.includes('newsletter') || 
          txt.includes('abonnez-vous') ||
          txt.includes('restez branchés') ||
          txt.includes('immatriculations au maroc') ||
          txt.includes('lire aussi')
        ) {
          $el.remove();
        }
      });

      // Si le corps de la balise est vide après nettoyage, renvoyer du vide
      return $clean('body').html() ? $clean('body').html().trim() : '';
    }
    return '';
  } catch (e) {
    console.warn(`⚠️ Impossible d'extraire le contenu complet pour ${url}:`, e.message);
    return '';
  }
}

// SOURCE 1 : Wandaloo Autonews (Maroc) - Pages 1 à 6
async function scrapeSourceWandaloo(articles) {
  console.log('📰 SOURCE 1 : Scraping Wandaloo Autonews (Pages 1 à 6)...');
  const BASE_URL = 'https://www.wandaloo.com';
  
  for (let page = 1; page <= 2; page++) {
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

      const tempArticles = [];
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
          tempArticles.push({
            titre: `[${tag}] ${titre}`,
            resume: resume.slice(0, 220) + (resume.length > 220 ? '...' : ''),
            image,
            date_publication,
            lien_article: link
          });
        }
      });

      // Charger le contenu complet pour les nouveaux articles de cette page
      for (const art of tempArticles) {
        console.log(`      📄 Chargement de l'article complet: ${art.titre}...`);
        art.contenu_complet = await fetchArticleContent(art.lien_article, 'wandaloo');
        articles.push(art);
        count++;
        await new Promise(r => setTimeout(r, 600)); // Sleep pour éviter d'être bloqué
      }

      console.log(`      ✅ Page ${page} terminée : ${count} articles récupérés.`);
    } catch (e) {
      console.error(`      ❌ Erreur Page ${page} Wandaloo:`, e.message);
    }
  }
}

// SOURCE 2 : Moteur.ma (Maroc)
async function scrapeSourceMoteurMa(articles) {
  console.log('📰 SOURCE 2 : Scraping Moteur.ma (Maroc)...');
  const BASE_URL = 'https://www.moteur.ma';
  const ACTU_URL = 'https://www.moteur.ma/fr/actualite/';
  
  try {
    const res = await axiosInstance.get(ACTU_URL);
    const $ = cheerio.load(res.data);
    let count = 0;
    const tempArticles = [];

    $('a.news-row').each((_, el) => {
      const $el = $(el);
      const link = $el.attr('href') || '';
      if (!link) return;

      const titre = $el.find('.news-title').text().trim();
      const image = $el.find('.news-img-wrapper img').attr('src') || '';
      const resume = $el.find('.news-summary').text().replace(/\s+/g, ' ').trim();
      
      const dateText = $el.find('.news-date').text().trim();
      let date_publication = new Date().toLocaleDateString('fr-FR');
      if (dateText) {
        date_publication = dateText;
      }

      if (titre && link && !articles.some(a => a.lien_article === link)) {
        tempArticles.push({
          titre: `[Actu] ${titre}`,
          resume: resume.slice(0, 220) + (resume.length > 220 ? '...' : ''),
          image,
          date_publication,
          lien_article: link
        });
      }
    });

    for (const art of tempArticles.slice(0, 5)) {
      console.log(`      📄 Chargement de l'article complet: ${art.titre}...`);
      art.contenu_complet = await fetchArticleContent(art.lien_article, 'moteur.ma');
      articles.push(art);
      count++;
      await new Promise(r => setTimeout(r, 600));
    }
    console.log(`      ✅ Moteur.ma terminé : ${count} articles récupérés.`);
  } catch (e) {
    console.error(`      ❌ Erreur Moteur.ma:`, e.message);
  }
}

// SOURCE 3 : AutoTrends (Maroc)
async function scrapeSourceAutoTrends(articles) {
  console.log('📰 SOURCE 3 : Scraping AutoTrends (Maroc)...');
  const ACTU_URL = 'https://autotrends.ma/magazine/actualite/';
  
  try {
    const res = await axiosInstance.get(ACTU_URL);
    const $ = cheerio.load(res.data);
    let count = 0;
    const tempArticles = [];

    $('a').each((_, el) => {
      const $el = $(el);
      const href = $el.attr('href') || '';
      if (href && href.includes('magazine/actualite/') && href.length > 50 && !tempArticles.some(t => t.lien_article === href)) {
        const titre = $el.text().replace(/\s+/g, ' ').trim() || 'Actualité AutoTrends';
        if (titre.length < 15) return;

        tempArticles.push({
          titre: `[AutoTrends] ${titre}`,
          resume: 'Découvrez l\'actualité de l\'industrie et de la culture automobile au Maroc sur AutoTrends.',
          image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=600&auto=format&fit=crop&q=60',
          date_publication: new Date().toLocaleDateString('fr-FR'),
          lien_article: href
        });
      }
    });

    for (const art of tempArticles.slice(0, 5)) {
      console.log(`      📄 Chargement de l'article complet: ${art.titre}...`);
      art.contenu_complet = await fetchArticleContent(art.lien_article, 'autotrends');
      articles.push(art);
      count++;
      await new Promise(r => setTimeout(r, 600));
    }
    console.log(`      ✅ AutoTrends terminé : ${count} articles récupérés.`);
  } catch (e) {
    console.error(`      ❌ Erreur AutoTrends:`, e.message);
  }
}

// SOURCE GENERIQUE : RSS Feeds (France & Maroc)
async function scrapeRSSFeed(feedUrl, sourceName, articles) {
  console.log(`📰 SOURCE RSS : Scraping ${sourceName}...`);
  try {
    const res = await axiosInstance.get(feedUrl);
    const $ = cheerio.load(res.data, { xmlMode: true });
    let count = 0;
    const tempArticles = [];
    
    $('item').each((_, el) => {
      const $el = $(el);
      const title = $el.find('title').text().trim();
      const link = $el.find('link').text().trim();
      const pubDate = $el.find('pubDate').text().trim();
      
      let image = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800';
      const enclosure = $el.find('enclosure');
      if (enclosure.length && enclosure.attr('url')) {
        image = enclosure.attr('url');
      } else {
        const mediaContent = $el.find('media\\:content, content');
        if (mediaContent.length && mediaContent.attr('url')) {
          image = mediaContent.attr('url');
        }
      }
      
      const description = $el.find('description').text().replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 220) + '...';

      if (title && link && !articles.some(a => a.lien_article === link)) {
        tempArticles.push({
          titre: `[${sourceName}] ${title}`,
          resume: description,
          image,
          date_publication: new Date(pubDate || Date.now()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
          lien_article: link
        });
      }
    });

    for (const art of tempArticles.slice(0, 5)) {
      console.log(`      📄 Chargement de l'article complet: ${art.titre}...`);
      art.contenu_complet = await fetchArticleContent(art.lien_article, 'rss-generic');
      articles.push(art);
      count++;
      await new Promise(r => setTimeout(r, 600));
    }
    console.log(`      ✅ RSS ${sourceName} terminé : ${count} articles récupérés.`);
  } catch(e) {
    console.error(`      ❌ Erreur RSS ${sourceName}:`, e.message);
  }
}

// SOURCE 3 : Le Blog Auto (France) - Pages 1 à 6
async function scrapeSourceLeBlogAuto(articles) {
  console.log('📰 SOURCE 3 : Scraping Le Blog Auto (France - Pages 1 à 6)...');
  const BASE_URL = 'https://www.leblogauto.com';
  
  for (let page = 1; page <= 2; page++) {
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
      const tempArticles = [];

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
          tempArticles.push({
            titre: `[Actu Fr] ${titre}`,
            resume: resume.slice(0, 220) + (resume.length > 220 ? '...' : ''),
            image,
            date_publication,
            lien_article: link
          });
        }
      });

      // Charger le contenu complet
      for (const art of tempArticles) {
        console.log(`      📄 Chargement de l'article complet: ${art.titre}...`);
        art.contenu_complet = await fetchArticleContent(art.lien_article, 'leblogauto');
        articles.push(art);
        count++;
        await new Promise(r => setTimeout(r, 600));
      }

      console.log(`      ✅ Page ${page} terminée : ${count} articles récupérés.`);
    } catch (e) {
      console.error(`      ❌ Erreur Page ${page} Le Blog Auto:`, e.message);
    }
  }
}

async function scrapeNews() {
  console.log('📰 Scraping Complet des Archives et Articles Intégraux (Maroc + France)...\n');
  initDB();
  
  const articles = [];

  // Exécuter l'ensemble des sources d'actualités (10 sources au total)
  await scrapeSourceWandaloo(articles);
  await scrapeSourceLeBlogAuto(articles);
  await scrapeSourceMoteurMa(articles);
  await scrapeSourceAutoTrends(articles);
  
  // RSS Feeds France
  await scrapeRSSFeed('https://www.caradisiac.com/rss.xml', 'Caradisiac', articles);
  await scrapeRSSFeed('https://www.turbo.fr/global.xml', 'Turbo', articles);
  await scrapeRSSFeed('https://www.automobile-magazine.fr/toute-l-actualite/rss.xml', 'L\'Automobile Mag', articles);
  await scrapeRSSFeed('https://www.lemonde.fr/automobile/rss_full.xml', 'Le Monde', articles);

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
