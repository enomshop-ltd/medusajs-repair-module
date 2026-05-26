const https = require('https');
https.get('https://raw.githubusercontent.com/enomshop-ltd/medusa-freshjs-storefront/refs/heads/main/utils.ts', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});
