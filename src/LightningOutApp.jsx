// src/LightningOutApp.jsx
import { useState, useEffect } from "react";

const LightningOutApp = () => {
  const [loading, setLoading] = useState(false);
  const [logStatus, setLogStatus] = useState("Ready to connect.");
  const [isConnected, setIsConnected] = useState(false);

  // Configuration
  const CONNECTED_APP_CLIENT_ID = import.meta.env.VITE_SF_CONSUMER_KEY || "YOUR_CONSUMER_KEY_HERE"; // Or hardcode for testing
  // Use test.salesforce.com for sandbox, login.salesforce.com for prod
  const SALESFORCE_LOGIN_URL = "https://login.salesforce.com"; 

  useEffect(() => {
    // 1. Check if we are returning from Salesforce with a code
    const params = new URLSearchParams(window.location.search);
    const authCode = params.get("code");

    if (authCode) {
      // Clear the code from the URL to prevent re-execution on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
      handleAuthCode(authCode);
    }
  }, []);

  const handleLogin = () => {
    // 2. Redirect user to Salesforce to authorize
    const redirectUri = window.location.origin; // Redirect back to this same page
    const authUrl = `${SALESFORCE_LOGIN_URL}/services/oauth2/authorize?` +
      `response_type=code&` +
      `client_id=${CONNECTED_APP_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=full refresh_token`;

    console.log("Redirecting to:", authUrl);
    window.location.href = authUrl;
  };

  const handleAuthCode = async (code) => {
    setLoading(true);
    setLogStatus("Exchanging code for Lightning Access...");

    try {
      // 3. Send the code to our backend to get the real frontdoor URL
      // We pass the redirect_uri so the backend can verify it matches
      const redirectUri = window.location.origin;
      const response = await fetch(`/api/get-url?code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`);
      const result = await response.json();

      if (result.success && result.url) {
        setLogStatus("Session established. Loading Lightning Out...");
        setIsConnected(true);
        loadLightningOut(result.url);
      } else {
        console.error("API Error:", result);
        setLogStatus(`Error: ${result.message || JSON.stringify(result)}`);
        setLoading(false);
      }
    } catch (err) {
      console.error("Runtime Error:", err);
      setLogStatus(`Crash: ${err.message}`);
      setLoading(false);
    }
  };

  const loadLightningOut = (frontdoorUrl) => {
    // 4. Standard Lightning Out loading logic
    const script = document.createElement("script");
    // NOTE: This URL should match your org instance (e.g. your-domain.my.salesforce.com)
    script.src = "https://algocirrus-b6-dev-ed.develop.my.salesforce.com/lightning/lightning.out.latest/index.iife.prod.js";
    
    script.onload = () => {
      const loApp = document.querySelector("lightning-out-application");
      if (loApp) {
        loApp.addEventListener("ready", () => {
          console.log("Lightning Out Ready!");
          setLoading(false);
        });
        loApp.setAttribute("frontdoor-url", frontdoorUrl);
      }
    };
    document.body.appendChild(script);
  };

  return (
    <div style={{ height: '100vh', background: '#242424', color: 'white', padding: '20px' }}>
      {!isConnected ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '100px', gap: '20px' }}>
          <h2>Lightning Out 2.0 Debugger</h2>
          <p>{logStatus}</p>
          <button 
            onClick={handleLogin}
            disabled={loading}
            style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#0070d2', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            {loading ? "Connecting..." : "Log in with Salesforce"}
          </button>
        </div>
      ) : (
        <div style={{ width: '100%', height: '100%' }}>
           {/* Top Bar */}
           <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 100 }}>
             <button onClick={() => window.location.reload()} style={{ padding: '8px', cursor: 'pointer' }}>Disconnect</button>
           </div>
           {/* Lightning Out Container */}
           <lightning-out-application components="c-hello-world-lwc" app-id="1UsNS0000000CUD0A2"></lightning-out-application>
           <div className="slds-scope"><c-hello-world-lwc></c-hello-world-lwc></div>
        </div>
      )}
    </div>
  );
};

export default LightningOutApp;
