// api/get-url.js
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  try {
    const rawKey = process.env.SF_PRIVATE_KEY || "";
    const privateKey = rawKey.split(String.raw`\n`).join('\n');

    const consumerKey = process.env.SF_CONSUMER_KEY?.trim();
    const username = req.query.username?.trim() || process.env.SF_USERNAME?.trim();
    const appId = process.env.SF_APP_ID?.trim(); // Get App ID from Env

    if (!username) throw new Error("No username provided.");
    if (!appId) throw new Error("SF_APP_ID is missing in Environment variables.");

    const audience = "https://login.salesforce.com"; // Use 'test.salesforce.com' for Sandboxes

    const token = jwt.sign({
      iss: consumerKey,
      sub: username,
      aud: audience,
      exp: Math.floor(Date.now() / 1000) + 300
    }, privateKey, { algorithm: 'RS256' });

    const sfRes = await fetch(`${audience}/services/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: token
      })
    });
    
    const authData = await sfRes.json();
    if (!sfRes.ok) return res.status(200).json({ status: "auth_failed", authData });

    // Generate Frontdoor URL
    const loUrl = new URL(`${authData.instance_url}/services/oauth2/singleaccess`);
    loUrl.searchParams.append("application_id", appId);

    const loRes = await fetch(loUrl.toString(), {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authData.access_token}` }
    });
    
    const loData = await loRes.json();
    const finalUrl = loData.frontdoor_uri || loData.frontdoor_url || loData.url;
    
    // CHANGE: Return appId and instance_url so frontend can use them dynamically
    return res.status(200).json({ 
        success: true, 
        url: finalUrl, 
        appId: appId, 
        instanceUrl: authData.instance_url 
    });

  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
}
