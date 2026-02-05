// api/get-url.js

// This function now handles the OAuth 2.0 Authorization Code Flow
// It exchanges a temporary "code" from the client for an access token + session
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  try {
    const { code, redirect_uri } = req.query;

    if (!code || !redirect_uri) {
      return res.status(400).json({ success: false, message: "Missing 'code' or 'redirect_uri' parameter." });
    }

    // 1. Prepare credentials
    const consumerKey = process.env.SF_CONSUMER_KEY?.trim();
    const consumerSecret = process.env.SF_CONSUMER_SECRET?.trim(); // NEW: Required for this flow
    const appId = process.env.SF_APP_ID?.trim();
    const loginUrl = "https://login.salesforce.com"; // Or test.salesforce.com

    if (!consumerSecret) {
      throw new Error("SF_CONSUMER_SECRET is missing in environment variables.");
    }

    // 2. Exchange Code for Access Token
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      client_id: consumerKey,
      client_secret: consumerSecret,
      redirect_uri: redirect_uri
    });

    const tokenRes = await fetch(`${loginUrl}/services/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams
    });

    const authData = await tokenRes.json();

    if (!tokenRes.ok) {
      return res.status(200).json({ success: false, status: "token_exchange_failed", message: JSON.stringify(authData) });
    }

    // 3. Request Single Access URL (The step that was previously failing)
    // Now that we have a real user session token, this should work.
    const loUrl = new URL(`${authData.instance_url}/services/oauth2/singleaccess`);
    loUrl.searchParams.append("application_id", appId);

    const loRes = await fetch(loUrl.toString(), {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authData.access_token}` }
    });

    // 4. Handle Response
    const contentType = loRes.headers.get("content-type");
    if (!loRes.ok || !contentType || !contentType.includes("application/json")) {
      const errorText = await loRes.text();
      return res.status(200).json({ 
        success: false, 
        status: "singleaccess_failed", 
        message: `Salesforce error: ${errorText}` 
      });
    }

    const loData = await loRes.json();
    const finalUrl = loData.frontdoor_uri || loData.frontdoor_url || loData.url;

    return res.status(200).json({ success: true, url: finalUrl });

  } catch (err) {
    return res.status(200).json({ success: false, status: "runtime_crash", message: err.message });
  }
}
