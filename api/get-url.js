import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  try {
    const rawKey = process.env.SF_PRIVATE_KEY || "";
    const privateKey = rawKey.split(String.raw`\n`).join('\n');

    // Remove any hidden spaces from env variables
    const consumerKey = process.env.SF_CONSUMER_KEY?.trim();
    const username = process.env.SF_USERNAME?.trim();
    
    // Check your URL: use 'test' for Sandbox, 'login' for Production/Dev Edition
    const audience = "https://login.salesforce.com"; 

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
    console.log( 'authData-->', authData);
    if (!sfRes.ok) return res.status(200).json({ status: "auth_failed", authData });

    const appId = process.env.SF_APP_ID?.trim();
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
    return res.status(200).json({ status: "runtime_crash", message: err.message });
  }
}


