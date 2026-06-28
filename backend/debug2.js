const axios = require('axios');
const cheerio = require('cheerio');

async function debugStructure() {
  const res = await axios.get('https://www.wandaloo.com/neuf/mg/', {
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept-Language': 'fr-FR',
    }
  });
  
  const $ = cheerio.load(res.data);
  
  // Check h3 + .prix structure
  console.log('=== H3 + PRIX structure ===\n');
  $('h3').each((i, el) => {
    const $h3 = $(el);
    const $nextPrix = $h3.next('.prix');
    if ($nextPrix.length) {
      const link = $h3.find('a');
      console.log(`H3 #${i}: "${$h3.text().trim()}"`);
      console.log(`  Link href: ${link.attr('href') || 'none'}`);
      console.log(`  Prix: "${$nextPrix.text().trim()}"`);
      console.log(`  Parent tag: ${$h3.parent()[0]?.name}`);
      console.log();
    }
  });
  
  // Also check grandparent of .prix
  console.log('=== .prix parents ===\n');
  $('.prix').slice(0, 8).each((i, el) => {
    const $p = $(el);
    const parent = $p.parent();
    const grandparent = parent.parent();
    const link = parent.find('a, h3 a').first();
    console.log(`Prix #${i}: "${$p.text().trim()}"`);
    console.log(`  Parent: ${parent[0]?.name}, classes: ${parent.attr('class') || 'none'}`);
    console.log(`  Grandparent: ${grandparent[0]?.name}, classes: ${grandparent.attr('class') || 'none'}`);
    console.log(`  Link text: "${link.text().trim()}"`);
    console.log(`  Link href: ${link.attr('href') || 'none'}`);
    console.log();
  });
}

debugStructure().catch(console.error);
