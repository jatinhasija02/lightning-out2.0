import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  // We force a 200 status so Vercel doesn't show the generic 500 error page
  res.setHeader('Content-Type', 'application/json');

  try {
    // 1. Check if variables exist to avoid 'undefined' crashes
    if (!process.env.SF_PRIVATE_KEY) {
      return res.status(200).json({ status: "error", message: "Environment Variable SF_PRIVATE_KEY is missing." });
    }

    // 2. Format the key (assuming you used literal \n in Vercel UI)
    const privateKey = process.env.SF_PRIVATE_KEY.replace(/\\n/g, '\n');

    // 3. Sign the JWT
    const token = jwt.sign({
      iss: process.env.SF_CONSUMER_KEY,
      sub: process.env.SF_USERNAME,
      aud: "https://login.salesforce.com",
      exp: Math.floor(Date.now() / 1000) + 300
    }, privateKey, { algorithm: 'RS256' });

    // 4. Request Access Token
    const sfRes = await fetch("https://login.salesforce.com/services/oauth2/token", {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: token
      })
    });
    
    const data = await sfRes.json();
    
    if (!sfRes.ok) {
      return res.status(200).json({ status: "salesforce_rejected", details: data });
    }

    // 5. Get Lightning Out 2.0 URL
    const loRes = await fetch(`${data.instance_url}/services/oauth2/singleaccess?access_token=${data.access_token}&application_id=${process.env.SF_APP_ID}`);
    const loData = await loRes.json();

    return res.status(200).json({ success: true, url: loData.frontdoor_url });

  } catch (err) {
    // This will now show the actual error on your "System Status" screen
    return res.status(200).json({ status: "runtime_crash", message: err.message });
  }
}
