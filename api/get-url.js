// api/get-url.js
export default async function handler(req, res) {
  // 1. Ensure the React app is sending the token via POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Post token to this endpoint' });
  }

  const { accessToken, instanceUrl, appId } = req.body;

  try {
    // 2. Direct Single-Access Request
    // We use the token you already got from the browser login
    const loUrl = new URL(`${instanceUrl}/services/oauth2/singleaccess`);
    loUrl.searchParams.append("application_id", appId);

    const loRes = await fetch(loUrl.toString(), {
      method: 'GET',
      headers: { 
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    });

    const loData = await loRes.json();

    if (!loRes.ok) {
      return res.status(loRes.status).json({ success: false, detail: loData });
    }
    
    // 3. Return the frontdoor_url for the LWC handshake
    return res.status(200).json({ 
      success: true, 
      url: loData.url || loData.frontdoor_url 
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
