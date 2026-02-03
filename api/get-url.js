export default async function handler(req, res) {
  const { code } = req.query; // Salesforce sends this code back

  if (!code) return res.status(400).json({ error: "No code provided" });

  try {
    const audience = "https://login.salesforce.com";

    // Swap the temporary code for a real User Token
    const tokenRes = await fetch(`${audience}/services/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: process.env.SF_CONSUMER_KEY,
        client_secret: process.env.SF_CONSUMER_SECRET, // NEW: Required for SSO
        redirect_uri: process.env.SF_CALLBACK_URL // Must match Salesforce setup
      })
    });

    const authData = await tokenRes.json();

    // Now get the Frontdoor URL for this specific user
    const loUrl = new URL(`${authData.instance_url}/services/oauth2/singleaccess`);
    loUrl.searchParams.append("application_id", process.env.SF_APP_ID);

    const loRes = await fetch(loUrl.toString(), {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authData.access_token}` }
    });

    const loData = await loRes.json();
    const finalUrl = loData.frontdoor_uri || loData.frontdoor_url || loData.url;

    // Redirect the user back to the home page with the session URL
    res.redirect(`/?frontdoor=${encodeURIComponent(finalUrl)}`);

  } catch (err) {
    res.status(500).send("SSO Handshake Failed: " + err.message);
  }
}