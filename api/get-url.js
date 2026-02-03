import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  try {
    // 1. Get the raw string from Vercel
    let rawKey = process.env.SF_PRIVATE_KEY || '';

    // 2. Remove any headers, footers, and all whitespace/newlines
    let cleanKey = rawKey
      .replace(/-----BEGIN (RSA )?PRIVATE KEY-----/, '')
      .replace(/-----END (RSA )?PRIVATE KEY-----/, '')
      .replace(/\s/g, '');

    // 3. Reconstruct the key with the specific "RSA" header and \n every 64 chars
    // Salesforce and jsonwebtoken are strict about this format
    const formattedKey = 
      "-----BEGIN RSA PRIVATE KEY-----\n" +
      (cleanKey.match(/.{1,64}/g) || []).join('\n') +
      "\n-----END RSA PRIVATE KEY-----\n";

    const payload = {
      iss: process.env.SF_CONSUMER_KEY,
      sub: process.env.SF_USERNAME,
      aud: "https://login.salesforce.com",
      exp: Math.floor(Date.now() / 1000) + 300
    };

    // 4. Sign the JWT
    const token = jwt.sign(payload, formattedKey, { algorithm: 'RS256' });

    // 5. Get Salesforce Access Token
    const sfRes = await fetch("https://login.salesforce.com/services/oauth2/token", {
      method: 'POST',
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: token
      })
    });
    
    const data = await sfRes.json();
    if (!sfRes.ok) return res.status(sfRes.status).json({ error: data });

    // 6. Get Lightning Out 2.0 URL
    const loRes = await fetch(`${data.instance_url}/services/oauth2/singleaccess?access_token=${data.access_token}&application_id=${process.env.SF_APP_ID}`);
    const loData = await loRes.json();

    res.status(200).json({ url: loData.frontdoor_url });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
