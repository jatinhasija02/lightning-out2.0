import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  // Set JSON header to prevent browser parsing errors
  res.setHeader('Content-Type', 'application/json');

  try {
    // 1. Format the Private Key from Vercel Environment Variables
    const rawKey = process.env.SF_PRIVATE_KEY || "";
    const privateKey = rawKey.replace(/\\n/g, '\n');

    // 2. Sign the JWT for Salesforce Authentication
    const token = jwt.sign({
      iss: process.env.SF_CONSUMER_KEY,
      sub: process.env.SF_USERNAME,
      aud: "https://login.salesforce.com",
      exp: Math.floor(Date.now() / 1000) + 300
    }, privateKey, { algorithm: 'RS256' });

    // 3. Step 1: Exchange JWT for an Access Token
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

    // 4. Step 2: Perform the Handshake for Lightning Out 2.0
    // Using the dynamic instance_url from authData to prevent 'Invalid_Param'
    const appId = process.env.SF_APP_ID;
    const loUrl = new URL(`${authData.instance_url}/services/oauth2/singleaccess`);
    loUrl.searchParams.append("access_token", authData.access_token);
    loUrl.searchParams.append("application_id", appId);

    const loRes = await fetch(loUrl.toString());
    const loText = await loRes.text();
    
    try {
      // If valid, Salesforce returns a JSON containing the frontdoor_url
      const loData = JSON.parse(loText);
      return res.status(200).json({ success: true, url: loData.frontdoor_url });
    } catch (e) {
      // If parsing fails, we capture the raw error message (like 'Invalid_Param')
      return res.status(200).json({ 
        status: "handshake_failed", 
        message: loText,
        debug: {
          sent_app_id: appId,
          instance_used: authData.instance_url
        } 
      });
    }

  } catch (err) {
    // Captures structural crashes (e.g., library or network issues)
    return res.status(200).json({ status: "runtime_crash", message: err.message });
  }
}
