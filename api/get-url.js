import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    // These variables will be pulled from Vercel's settings later
    const payload = {
        iss: process.env.SF_CONSUMER_KEY,
        sub: process.env.SF_USERNAME,
        aud: "https://login.salesforce.com",
        exp: Math.floor(Date.now() / 1000) + 300
    };

    const token = jwt.sign(payload, process.env.SF_PRIVATE_KEY, { algorithm: 'RS256' });

    // Step A: Get a fresh Login Token
    const sfRes = await fetch("https://login.salesforce.com/services/oauth2/token", {
        method: 'POST',
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: token
        })
    });
    const { access_token, instance_url } = await sfRes.json();

    // Step B: Get the dynamic Frontdoor URL
    const loRes = await fetch(`${instance_url}/services/oauth2/singleaccess?access_token=${access_token}&application_id=${process.env.SF_APP_ID}`);
    const { frontdoor_url } = await loRes.json();

    // Send it to your React component
    res.status(200).json({ url: frontdoor_url });
}