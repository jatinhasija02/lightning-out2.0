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

    // Step 1: Get Access Token
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

    // Step 2: Get Lightning Out URL
    // We check if the response is valid before trying to parse it as JSON
    const loRes = await fetch(`${authData.instance_url}/services/oauth2/singleaccess?access_token=${authData.access_token}&application_id=${process.env.SF_APP_ID}`);
    
    const loText = await loRes.text(); // Get raw text first to avoid 'Unexpected token' crash
    
    try {
      const loData = JSON.parse(loText);
      return res.status(200).json({ success: true, url: loData.frontdoor_url });
    } catch (e) {
      return res.status(200).json({ 
        status: "handshake_failed", 
        message: loText, // This will show the actual 'Invalid_Param' error text
        tip: "Check if SF_APP_ID is the correct 18-character ID from your Lightning Out App." 
      });
    }

  } catch (err) {
    return res.status(200).json({ status: "runtime_crash", message: err.message });
  }
}
