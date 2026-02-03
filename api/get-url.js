import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  try {
    const rawKey = process.env.SF_PRIVATE_KEY || "";
    
    // Repairing the key: converting literal '\n' strings back to actual newlines
    const privateKey = rawKey.split(String.raw`\n`).join('\n');

    // 1. Generate JWT
    const token = jwt.sign({
      iss: process.env.SF_CONSUMER_KEY,
      sub: process.env.SF_USERNAME,
      aud: "https://login.salesforce.com",
      exp: Math.floor(Date.now() / 1000) + 300
    }, privateKey, { algorithm: 'RS256' });

    // 2. Salesforce Token Exchange
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

    // 3. Handshake for Lightning Out
    const appId = process.env.SF_APP_ID;
    const loUrl = new URL(`${authData.instance_url}/services/oauth2/singleaccess`);
    loUrl.searchParams.append("application_id", appId);

    const loRes = await fetch(loUrl.toString(), {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authData.access_token}` }
    });
    
    const loData = await loRes.json();
    const finalUrl = loData.frontdoor_uri || loData.frontdoor_url || loData.url;
    
    return res.status(200).json({ success: true, url: finalUrl });

  } catch (err) {
    // This catches the 'asymmetric key' error
    return res.status(200).json({ status: "runtime_crash", message: err.message });
  }
}
