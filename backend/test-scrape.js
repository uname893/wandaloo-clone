const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://www.wandaloo.com';
const testUrl = 'https://www.wandaloo.com/neuf/renault/clio/fiche-technique/1-2-tce-115-at-evolution/22873.html';

axios.get(testUrl, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
}).then(res => {
  const $ = cheerio.load(res.data);
  console.log('Page Title:', $('title').text());
  
  console.log('\n--- Printing all extracted key-value pairs from li ---');
  $('li').each((i, el) => {
    const param = $(el).find('.param').text().trim();
    const value = $(el).find('.value').text().trim();
    if (param && value) {
      console.log(`- ${param}: ${value}`);
    }
  });

  console.log('\n--- Printing other potential specs (e.g. options / equipment) ---');
  // Check if options are in some list
  $('.option-title, .title-info, .options-group h4').each((i, titleEl) => {
    console.log('Title:', $(titleEl).text().trim());
  });
}).catch(err => {
  console.error('Fetch error:', err.message);
});
