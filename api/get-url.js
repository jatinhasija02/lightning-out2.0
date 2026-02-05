export default async function handler(req, res) {
  const { code } = req.query; // Salesforce sends this code after the user logs in
  
  if (!code) return res.status(400).send("No authorization code provided.");

  try {
    const audience = "https://login.salesforce.com";
    
    // 1. Swap the code for an Access Token specific to the user
    const tokenResponse = await fetch(`${audience}/services/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: process.env.SF_CONSUMER_KEY,
        client_secret: process.env.SF_CLIENT_SECRET, // Required for this flow
        redirect_uri: process.env.SF_CALLBACK_URL
      })
    });

    const authData = await tokenResponse.json();
    if (!tokenResponse.ok) throw new Error(authData.error_description);

    // 2. Get the secure handshake URL for Lightning Out
    const loUrl = new URL(`${authData.instance_url}/services/oauth2/singleaccess`);
    loUrl.searchParams.append("application_id", process.env.SF_APP_ID);

    const loRes = await fetch(loUrl.toString(), {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authData.access_token}` }
    });
    
    const loData = await loRes.json();
    const finalUrl = loData.frontdoor_uri || loData.frontdoor_url || loData.url;

    // 3. Redirect user back to the home page with the session URL
    res.redirect(`/?session_url=${encodeURIComponent(finalUrl)}`);

  } catch (err) {
    res.status(500).send("SSO Handshake Failed: " + err.message);
  }
}
