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

    // Step 2: Handshake - Using direct domain to bypass 'Invalid_Param' redirection issues
    const appId = process.env.SF_APP_ID;
    const myDomain = "https://algocirrus-b6-dev-ed.develop.my.salesforce.com";
    
    // Constructing the URL manually to ensure parameter encoding is perfect
    const loUrl = new URL(`${myDomain}/services/oauth2/singleaccess`);
    loUrl.searchParams.append("access_token", authData.access_token);
    loUrl.searchParams.append("application_id", appId);

    const loRes = await fetch(loUrl.toString());
    const loText = await loRes.text();
    
    try {
      const loData = JSON.parse(loText);
      return res.status(200).json({ success: true, url: loData.frontdoor_url });
    } catch (e) {
      // Returning the raw text helps identify if it's a 404 or a specific SF error
      return res.status(200).json({ 
        status: "handshake_failed", 
        message: loText,
        debug: {
          sent_app_id: appId,
          final_url_attempted: loUrl.origin + loUrl.pathname
        }
      });
    }

  } catch (err) {
    return res.status(200).json({ status: "runtime_crash", message: err.message });
  }
}
