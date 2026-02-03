import { useEffect, useState } from "react";

const LightningOutApp = () => {
  const [loading, setLoading] = useState(false);
  const [sessionUrl, setSessionUrl] = useState(null);

  useEffect(() => {
    // Check if we have a session URL in the browser bar
    const params = new URLSearchParams(window.location.search);
    const urlFromSso = params.get("session_url");

    if (urlFromSso) {
      const decodedUrl = decodeURIComponent(urlFromSso);
      setSessionUrl(decodedUrl);
      initLightningOut(decodedUrl);
    }
  }, []);

  const handleLogin = () => {
    // Redirect user to Salesforce for authentication
    const authUrl = "https://login.salesforce.com/services/oauth2/authorize";
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: '3MVG9VMBZCsTL9hnVO_6Q8ke.yyExmYi92cqK7ggByeErX0x.v9EFR9JFcaZhdTvibyAdqHSYFFhDtrdb3Fn8', // Use your Consumer Key
      redirect_uri: 'https://lightning-out2-0.vercel.app/api/auth-callback',
      scope: 'openid api'
    });
    window.location.href = `${authUrl}?${params.toString()}`;
  };

  const initLightningOut = (url) => {
    setLoading(true);
    const script = document.createElement("script");
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

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#242424', color: 'white', textAlign: 'center' }}>
      {!sessionUrl ? (
        <div style={{ paddingTop: '100px' }}>
          <h1>Salesforce User Portal</h1>
          <button 
            onClick={handleLogin}
            style={{ padding: '15px 30px', fontSize: '18px', cursor: 'pointer', backgroundColor: '#00a1e0', color: 'white', border: 'none', borderRadius: '5px' }}
          >
            Login with Salesforce SSO
          </button>
        </div>
      ) : (
        <div style={{ opacity: loading ? 0 : 1, padding: '20px' }}>
          {loading && <h2>Establishing User Session...</h2>}
          <lightning-out-application components="c-hello-world-lwc" app-id="1UsNS0000000CUD0A2" />
          <div className="slds-scope">
            <c-hello-world-lwc />
          </div>
        </div>
      )}
    </div>
  );
};

export default LightningOutApp;