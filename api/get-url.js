// api/get-url.js
export default async function handler(req, res) {
  const { accessToken, instanceUrl, appId } = req.body;

  try {
    const loUrl = new URL(`${instanceUrl}/services/oauth2/singleaccess`);
    loUrl.searchParams.append("application_id", appId);

    const loRes = await fetch(loUrl.toString(), {
      headers: { "Authorization": `Bearer ${accessToken}` }
    });

    const loData = await loRes.json();
    return res.status(200).json({ url: loData.url || loData.frontdoor_url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
