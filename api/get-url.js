// Inside your useEffect in LightningOutApp.jsx
const response = await fetch("/api/get-url", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ 
    accessToken: accessToken, // The token from your URL hash
    instanceUrl: "https://algocirrus-b6-dev-ed.develop.my.salesforce.com",
    appId: "1UsNS0000000CUD0A2" 
  })
});
