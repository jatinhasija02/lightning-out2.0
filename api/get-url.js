/**
 * SERVERLESS FUNCTION: Salesforce Authentication Handler
 * -----------------------------------------------------
 * This API acts as a secure bridge between your React App and Salesforce.
 * * CORE RESPONSIBILITY:
 * 1. Accept a 'username' from the frontend.
 * 2. Sign a JWT (JSON Web Token) using a secure Private Key stored on the server.
 * 3. Exchange that JWT for a Salesforce Access Token (OAuth 2.0 JWT Bearer Flow).
 * 4. Generate a "Frontdoor URL" that allows the frontend to load Salesforce components 
 * without asking the user to log in again.
*/

import jwt from 'jsonwebtoken';

// This function is an API endpoint that will be called by the frontend application.
// It is responsible for generating a JWT token for the frontend to use when making requests to Salesforce.
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  try {
    // Get the private key from the environment variables
    const rawKey = process.env.SF_PRIVATE_KEY || "";
    const privateKey = rawKey.split(String.raw`\n`).join('\n');

    const consumerKey = process.env.SF_CONSUMER_KEY?.trim();

    // Check if the username is provided in the query parameters
    const username = req.query.username?.trim() || process.env.SF_USERNAME?.trim();

    // If no username is provided, throw an error
    if (!username) {
      throw new Error("No username provided in UI or Environment variables.");
    }

    // The audience is the URL of the Salesforce instance
    const audience = "https://login.salesforce.com";

    // Generate a JWT token with the required claims
    const token = jwt.sign({
      // The issuer of the token is the consumer key
      iss: consumerKey,
      // The subject of the token is the username
      sub: username,
      // The audience of the token is the Salesforce instance URL
      aud: audience,
      // The expiration of the token is 5 minutes from now
      exp: Math.floor(Date.now() / 1000) + 300
    }, privateKey, { algorithm: 'RS256' });

    // Make a request to the Salesforce instance to get an access token
    const sfRes = await fetch(`${audience}/services/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: token
      })
    });

    // Get the JSON response from the Salesforce instance
    const authData = await sfRes.json();
    if (!sfRes.ok) return res.status(200).json({ status: "auth_failed", authData });

    // Get the application ID from the environment variables
    const appId = process.env.SF_APP_ID?.trim();

    // Construct the URL for the Lightning Out API
    const loUrl = new URL(`${authData.instance_url}/services/oauth2/singleaccess`);
    loUrl.searchParams.append("application_id", appId);

    const loRes = await fetch(loUrl.toString(), {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authData.access_token}` }
    });

    // Get the JSON response from the Lightning Out API
    const loData = await loRes.json();
    // The final URL is the URL returned by the Lightning Out API
    const finalUrl = loData.frontdoor_uri || loData.frontdoor_url || loData.url;

    // Return the final URL to the frontend application
    return res.status(200).json({ success: true, url: finalUrl, authData: authData });

  } catch (err) {
    // If there is an error, return an error to the frontend application
    return res.status(200).json({ status: "runtime_crash", message: err.message });
  }
}

