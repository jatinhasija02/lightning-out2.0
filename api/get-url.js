// api/get-url.js
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  try {
    const rawKey = process.env.SF_PRIVATE_KEY || "";
    const privateKey = rawKey.split(String.raw`\n`).join('\n');
    const consumerKey = process.env.SF_CONSUMER_KEY?.trim();
    // Use query param or env var for username
    const username = req.query.username?.trim() || process.env.SF_USERNAME?.trim();

    if (!username) {
      throw new Error("No username provided.");
    }

    const audience = "https://login.salesforce.com"; // Use test.salesforce.com for sandbox

    // 1. Generate JWT
    const token = jwt.sign({
      iss: consumerKey,
      sub: username,
      aud: audience,
      exp: Math.floor(Date.now() / 1000) + 300
    }, privateKey, { algorithm: 'RS256' });

    // 2. Request Access Token
    const sfRes = await fetch(`${audience}/services/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: token
      })
    });

    const authData = await sfRes.json();

    if (!sfRes.ok) {
      return res.status(200).json({ 
        success: false, 
        message: authData.error_description || "Auth Failed" 
      });
    }

    // 3. SUCCESS: Return the token directly (Do not call singleaccess)
    return res.status(200).json({ 
      success: true, 
      accessToken: authData.access_token,
      instanceUrl: authData.instance_url
    });

  } catch (err) {
    return res.status(200).json({ success: false, message: err.message });
  }
}
