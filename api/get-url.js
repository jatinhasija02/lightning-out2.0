// api/get-url.js
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  // Ensure we only process POST requests from your React app
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { accessToken, instanceUrl, appId } = req.body;

  if (!accessToken || !instanceUrl || !appId) {
    return res.status(400).json({ success: false, message: "Missing session parameters" });
  }

  try {
    // Exchange the browser's access token for a one-time Frontdoor URL
    const loUrl = new URL(`${instanceUrl}/services/oauth2/singleaccess`);
    loUrl.searchParams.append("application_id", appId);

    const loRes = await fetch(loUrl.toString(), {
      method: 'GET',
      headers: { "Authorization": `Bearer ${accessToken}` }
    });

    const loData = await loRes.json();
    
    // Return the secure URL back to the React app for the handshake
    return res.status(200).json({ 
      success: true, 
      url: loData.url || loData.frontdoor_url || loData.frontdoor_uri 
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
