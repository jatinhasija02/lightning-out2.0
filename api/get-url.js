import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  try {
    // 1. Force conversion of literal \n strings to actual newlines
    const rawKey = process.env.SF_PRIVATE_KEY || "";
    const privateKey = rawKey.replace(/\\n/g, '\n');

    // 2. Generate the JWT
    const token = jwt.sign({
      iss: process.env.SF_CONSUMER_KEY,
      sub: process.env.SF_USERNAME,
      aud: "https://login.salesforce.com",
      exp: Math.floor(Date.now() / 1000) + 300
    }, privateKey, { algorithm: 'RS256' });

    // 3. Salesforce Token Exchange
    const sfRes = await fetch("https://login.salesforce.com/services/oauth2/token", {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: token
      })
    });
    
    const authData = await sfRes.json();
    if (!sfRes.ok) return res.status(200).json({ status: "auth_failed", authData });

    // 4. Get Lightning Out 2.0 URL
    const loRes = await fetch(`${authData.instance_url}/services/oauth2/singleaccess?access_token=${authData.access_token}&application_id=${process.env.SF_APP_ID}`);
    const loText = await loRes.text();
    
    try {
      const loData = JSON.parse(loText);
      return res.status(200).json({ success: true, url: loData.frontdoor_url });
    } catch (e) {
      return res.status(200).json({ status: "handshake_failed", message: loText });
    }

  } catch (err) {
    return res.status(200).json({ status: "runtime_crash", message: err.message });
  }
}
