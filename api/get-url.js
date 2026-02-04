// api/get-url.js
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  // Use POST to receive the token from the React app hash
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { accessToken, instanceUrl, appId } = req.body;

  if (!accessToken || !instanceUrl || !appId) {
    return res.status(400).json({ success: false, message: "Missing session parameters" });
  }

  try {
    // Call the singleaccess endpoint directly with the token you already have
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
      return res.status(200).json({ status: "auth_failed", authData: loData });
    }
    
    return res.status(200).json({ 
      success: true, 
      url: loData.url || loData.frontdoor_url || loData.frontdoor_uri 
    });
  } catch (err) {
    return res.status(200).json({ status: "runtime_crash", message: err.message });
  }
}
