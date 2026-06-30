const axios = require('axios');
const dns = require('dns');

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const url = 'https://cdn.jsdelivr.net/gh/avto-dev/vehicle-logotypes@2.x/src/vehicle-logotypes.json';

axios.get(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
}).then(res => {
  console.log('Success! Keys:');
  const keys = Object.keys(res.data);
  console.log('Total keys:', keys.length);
  console.log('First 10 keys:', keys.slice(0, 10));
  console.log('Example entry for audi:', JSON.stringify(res.data.audi, null, 2));
  console.log('Example entry for bmw:', JSON.stringify(res.data.bmw, null, 2));
}).catch(err => {
  console.error('Error:', err.message);
});
