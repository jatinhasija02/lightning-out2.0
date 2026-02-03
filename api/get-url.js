import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  // Ensure JSON output to prevent frontend parsing errors
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
    // Using the Authorization Header instead of URL params to fix 'Invalid_Param'
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
      // If parsing succeeds, we have our frontdoor URL
      return res.status(200).json({ success: true, url: loData.frontdoor_url });
    } catch (e) {
      // If parsing fails, we capture the raw error message (like 'Invalid_Param')
      return res.status(200).json({ 
        status: "handshake_failed", 
        message: loText,
        debug: {
          sent_app_id: appId,
          instance: authData.instance_url
        } 
      });
    }

  } catch (err) {
    return res.status(200).json({ status: "runtime_crash", message: err.message });
  }
}
