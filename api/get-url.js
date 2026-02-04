// api/get-url.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { accessToken, instanceUrl, appId } = req.body;
  
  // These should be set in Vercel Environment Variables
  const clientSecret = "975B811F02FFDB569C60B309DC7199924D9C6247EB57C6B6AD5D4BED070DBBF1"; 
  const clientId = "3MVG9VMBZCsTL9hnVO_6Q8ke.yyExmYi92cqK7ggByeErX0x.v9EFR9JFcaZhdTvibyAdqHSYFFhDtrdb3Fn8";

  if (!clientSecret || !clientId) {

    return res.status(500).json({ success: false, message: "Server configuration error: Missing Secret or Key" });

  }

  try {
    const loUrl = new URL(`${instanceUrl}/services/oauth2/singleaccess`);
    loUrl.searchParams.append("application_id", appId);
    
    // Add credentials for server-side verification
    loUrl.searchParams.append("client_id", clientId);
    loUrl.searchParams.append("client_secret", clientSecret);

    const loRes = await fetch(loUrl.toString(), {
      method: 'GET',
      headers: { 
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    });

    const loData = await loRes.json();
    
    if (!loRes.ok) {
      return res.status(200).json({ success: false, error: loData });
    }
    
    // Return the URL under the keys Salesforce commonly uses
    return res.status(200).json({ 
      success: true, 
      url: loData.url || loData.frontdoor_url || loData.frontdoor_uri 
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
