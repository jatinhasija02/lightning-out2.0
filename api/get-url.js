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

    // Step 1: Auth
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
    const loUrl = new URL(`${authData.instance_url}/services/oauth2/singleaccess`);
    loUrl.searchParams.append("application_id", appId);

    const loRes = await fetch(loUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authData.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const loText = await loRes.text();
    
    try {
      const loData = JSON.parse(loText);
      // Salesforce sometimes returns 'url' or 'frontdoor_url' depending on the Edge configuration
      const finalUrl = loData.frontdoor_url || loData.url;
      
      if (finalUrl) {
        return res.status(200).json({ success: true, url: finalUrl });
      } else {
        return res.status(200).json({ status: "missing_url", data: loData });
      }
    } catch (e) {
      return res.status(200).json({ status: "handshake_failed", message: loText });
    }

  } catch (err) {
    return res.status(200).json({ status: "runtime_crash", message: err.message });
  }
}
