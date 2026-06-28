const axios = require('axios');
const cheerio = require('cheerio');

async function debugScrape() {
  try {
    const res = await axios.get('https://www.wandaloo.com/neuf/mg/', {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      }
    });
    
    const $ = cheerio.load(res.data);
    console.log('Page title:', $('title').text());
    console.log('Found h2 tags:', $('h2').length);
    console.log('Found .prix tags:', $('.prix').length);
    console.log('Found links with /neuf/mg/:', $('a[href*="/neuf/mg/"]').length);
    
    // Print first few h2 structures
    $('h2').slice(0, 3).each((i, el) => {
      console.log(`\n--- H2 #${i} ---`);
      console.log($(el).html().substring(0, 300));
      console.log('Next sibling:', $(el).next()[0]?.name);
    });
    
    // Look for model blocks
    $('a[href*="/neuf/mg/"]').slice(0, 5).each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      console.log(`\nLink: ${href} -> "${text}"`);
    });
    
    // Try to find price elements near links
    $('.prix').slice(0, 3).each((i, el) => {
      console.log(`\nPrix #${i}: "${$(el).text().trim()}"`);
      console.log('Previous element:', $(el).prev()[0]?.name);
      console.log('Parent:', $(el).parent()[0]?.name);
    });
    
  } catch (e) {
    console.error('Error:', e.message);
  }
}

debugScrape();
