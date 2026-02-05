import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  // Set the response header to JSON
  res.setHeader('Content-Type', 'application/json');

  try {
    /* ================= 1. Read username from UI ================= */
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ success: false, error: "Username is required" });
    }

    /* ================= 2. Prepare Keys & Config ================= */
    // Using your existing robust env handling
    const rawKey = process.env.SF_PRIVATE_KEY || "";
    const privateKey = rawKey.split(String.raw`\n`).join('\n');
    const consumerKey = process.env.SF_CONSUMER_KEY?.trim();
    const appId = process.env.SF_APP_ID?.trim(); // Your Lightning App ID
    
    // Sandbox vs Prod URL
    const audience = "https://login.salesforce.com"; 

    /* ================= 3. Create JWT ================= */
    const token = jwt.sign({
      iss: consumerKey,
      sub: username,
      aud: audience,
      exp: Math.floor(Date.now() / 1000) + 300
    }, privateKey, { algorithm: 'RS256' });

    /* ================= 4. Get Access Token ================= */
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
      return res.status(200).json({ success: false, message: "JWT Auth Failed", details: authData });
    }

    /* ================= 5. Get Lightning Out Frontdoor URL ================= */
    // Uses the specific endpoint from your example
    const loUrl = `${authData.instance_url}/services/oauth2/lightningoutsingleaccess`;
    
    const loRes = await fetch(loUrl, {
      method: 'POST', // NOTE: This endpoint uses POST
      headers: { 
        'Authorization': `Bearer ${authData.access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        lightning_out_app_id: appId // Passed in body, not query param
      })
    });

    const loData = await loRes.json();

    // Check for "Bad_OAuth_Token" or other errors
    if (!loRes.ok || !loData.frontdoor_uri) {
         // Capture text if JSON fails or specific error fields
         const errorMsg = loData.message || loData.error || JSON.stringify(loData);
         return res.status(200).json({ 
            success: false, 
            message: `SingleAccess Failed: ${errorMsg}`,
            debug_url: loUrl
         });
    }

    /* ================= 6. Return URL to UI ================= */
    return res.status(200).json({ success: true, url: loData.frontdoor_uri });

  } catch (err) {
    return res.status(200).json({ success: false, status: "runtime_crash", message: err.message });
  }
}

