export default async function handler(req, res) {
  const { accessToken, instanceUrl, appId } = req.body;

  try {
    // Exchange the access token for a one-time Frontdoor URL
    const loUrl = new URL(`${instanceUrl}/services/oauth2/singleaccess`);
    loUrl.searchParams.append("application_id", appId);

    const loRes = await fetch(loUrl.toString(), {
      headers: { "Authorization": `Bearer ${accessToken}` }
    });

    const loData = await loRes.json();
    // The endpoint returns a short-lived URL for the handshake
    return res.status(200).json({ url: loData.url || loData.frontdoor_url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}