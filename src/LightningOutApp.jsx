// src/LightningOutApp.jsx
import { useEffect, useState } from "react";

// SOLUTION: You must accept 'userEmail' as a prop from App.jsx
const LightningOutApp = ({ userEmail }) => { 
  const [loading, setLoading] = useState(false);
  const [sessionUrl, setSessionUrl] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlFromSso = params.get("session_url");

    if (urlFromSso) {
      const decodedUrl = decodeURIComponent(urlFromSso);
      setSessionUrl(decodedUrl);
      initLightningOut(decodedUrl);
    }
  }, []);

  const initLightningOut = (url) => {
    setLoading(true);
    const script = document.createElement("script");
    // This is the correct script for Lightning Out 2.0
    script.src = "https://algocirrus-b6-dev-ed.develop.my.salesforce.com/lightning/lightning.out.latest/index.iife.prod.js";
    
    script.onload = () => {
      const loApp = document.querySelector("lightning-out-application");
      if (loApp) {
        loApp.addEventListener("ready", () => setLoading(false));
        loApp.setAttribute("frontdoor-url", url);
      }
    };
    document.body.appendChild(script);
  };

  const handleLogin = () => {
    const authUrl = "https://login.salesforce.com/services/oauth2/authorize";
    const params = new URLSearchParams({
      response_type: 'code',
      // Ensure this Client ID matches your Vercel Environment Variables
      client_id: '3MVG9VMBZCsTL9hnVO_6Q8ke.yyExmYi92cqK7ggByeErX0x.v9EFR9JFcaZhdTvibyAdqHSYFFhDtrdb3Fn8',
      redirect_uri: 'https://lightning-out2-0.vercel.app/api/auth-callback', 
      scope: 'openid api',
      login_hint: userEmail // Uses the email from Appwrite/Okta to sync identity
    });
    window.location.href = `${authUrl}?${params.toString()}`;
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#242424', color: 'white', textAlign: 'center' }}>
      {!sessionUrl ? (
        <div style={{ paddingTop: '100px' }}>
          <h2>Connect your Salesforce Account</h2>
          <p>Logged in as: {userEmail}</p>
          <button 
            onClick={handleLogin} 
            className="slds-button slds-button_brand"
            style={{ padding: '10px 20px', marginTop: '20px' }}
          >
            Sync with Salesforce
          </button>
        </div>
      ) : (
        <div style={{ opacity: loading ? 0.5 : 1, padding: '20px' }}>
          {loading && <h2>Loading Lightning Component...</h2>}
          <div id="lightning-container">
             <lightning-out-application 
               components="c-hello-world-lwc" 
               app-id="1UsNS0000000CUD0A2" 
               frontdoor-url={sessionUrl} 
             />
             <div className="slds-scope">
                <c-hello-world-lwc />
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LightningOutApp;