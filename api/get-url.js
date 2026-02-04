// api/get-url.js
export default async function handler(req, res) {
  // Use POST to receive the token securely from the frontend
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { accessToken, instanceUrl, appId } = req.body;

  try {
    // Exchange the access token for a one-time Frontdoor URL using LO 2.0 endpoint
    const loUrl = new URL(`${instanceUrl}/services/oauth2/singleaccess`);
    loUrl.searchParams.append("application_id", appId);

    const loRes = await fetch(loUrl.toString(), {
      method: 'GET',
      headers: { "Authorization": `Bearer ${accessToken}` }
    });

    const loData = await loRes.json();
    
    // Return the secure URL for the lightning-out-application handshake
    return res.status(200).json({ 
      success: true, 
      url: loData.url || loData.frontdoor_url || loData.frontdoor_uri 
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
