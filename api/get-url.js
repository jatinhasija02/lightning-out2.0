import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  try {
    // 1. Clean the key: remove headers/footers, remove all spaces/newlines
    let rawKey = process.env.SF_PRIVATE_KEY
      .replace('-----BEGIN RSA PRIVATE KEY-----', '')
      .replace('-----END RSA PRIVATE KEY-----', '')
      .replace(/\s/g, ''); // Removes all spaces and hidden characters

    // 2. Reconstruct the key with actual \n every 64 characters
    const formattedKey = 
      "-----BEGIN RSA PRIVATE KEY-----\n" +
      rawKey.match(/.{1,64}/g).join('\n') +
      "\n-----END RSA PRIVATE KEY-----\n";

    const payload = {
      iss: process.env.SF_CONSUMER_KEY,
      sub: process.env.SF_USERNAME,
      aud: "https://login.salesforce.com",
      exp: Math.floor(Date.now() / 1000) + 300
    };

    // 3. Sign using our perfectly formatted key
    const token = jwt.sign(payload, formattedKey, { algorithm: 'RS256' });

    const sfRes = await fetch("https://login.salesforce.com/services/oauth2/token", {
      method: 'POST',
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: token
      })
    });
    
    const data = await sfRes.json();
    if (!sfRes.ok) return res.status(sfRes.status).json({ error: data });

    const loRes = await fetch(`${data.instance_url}/services/oauth2/singleaccess?access_token=${data.access_token}&application_id=${process.env.SF_APP_ID}`);
    const loData = await loRes.json();

    res.status(200).json({ url: loData.frontdoor_url });

  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
}
