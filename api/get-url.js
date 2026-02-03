import * as jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  try {
    const rawKey = process.env.SF_PRIVATE_KEY || '';
    const cleanKey = rawKey
      .replace(/-----BEGIN (RSA )?PRIVATE KEY-----/, '')
      .replace(/-----END (RSA )?PRIVATE KEY-----/, '')
      .replace(/\s/g, '');

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

    const token = jwt.sign(payload, formattedKey, { algorithm: 'RS256' });

    const sfRes = await fetch("https://login.salesforce.com/services/oauth2/token", {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: token
      })
    });
    
    const data = await sfRes.json();
    if (!sfRes.ok) return res.status(401).json({ error: "SF_AUTH_FAILED", details: data });

    const loRes = await fetch(`${data.instance_url}/services/oauth2/singleaccess?access_token=${data.access_token}&application_id=${process.env.SF_APP_ID}`);
    const loData = await loRes.json();

    return res.status(200).json({ url: loData.frontdoor_url });
  } catch (err) {
    // This will print the error directly on your screen
    return res.status(500).json({ error: "RUNTIME_CRASH", message: err.message });
  }
}
