import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  try {
    const rawKey = process.env.SF_PRIVATE_KEY || "";
    const privateKey = rawKey.replace(/\\n/g, '\n');

    const token = jwt.sign({
      iss: process.env.SF_CONSUMER_KEY,
      sub: process.env.SF_USERNAME,
      aud: "https://login.salesforce.com",
      exp: Math.floor(Date.now() / 1000) + 300
    }, privateKey, { algorithm: 'RS256' });

    // Step 1: JWT Auth
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

    // Step 2: Handshake
    const appId = process.env.SF_APP_ID;
    const loRes = await fetch(`${authData.instance_url}/services/oauth2/singleaccess?access_token=${authData.access_token}&application_id=${appId}`);
    
    const loText = await loRes.text();
    
    try {
      const loData = JSON.parse(loText);
      // If we reach this, the URL is valid!
      return res.status(200).json({ success: true, url: loData.frontdoor_url });
    } catch (e) {
      return res.status(200).json({ 
        status: "handshake_failed", 
        message: loText,
        debug_app_id: appId 
      });
    }

  } catch (err) {
    return res.status(200).json({ status: "runtime_crash", message: err.message });
  }
}
