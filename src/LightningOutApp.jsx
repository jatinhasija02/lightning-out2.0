// src/LightningOutApp.jsx
import { useEffect, useState } from "react";

const LightningOutApp = () => {
  const [loading, setLoading] = useState(true);

  // Constants (Safe to keep in code as they are public identifiers)
  const CLIENT_ID = "3MVG9VMBZCsTL9hnVO_6Q8ke.yyExmYi92cqK7ggByeErX0x.v9EFR9JFcaZhdTvibyAdqHSYFFhDtrdb3Fn8";
  const APP_ID = "1UsNS0000000CUD0A2";
  const INSTANCE_URL = "https://algocirrus-b6-dev-ed.develop.my.salesforce.com";
  const REDIRECT_URI = window.location.origin; // Dynamically uses current domain (Local or Vercel)

  useEffect(() => {
    const initFlow = async () => {
      // 1. Check if token is in URL hash or already in session storage
      const hashParams = new URLSearchParams(window.location.hash.replace("#", "?"));
      let accessToken = hashParams.get("access_token") || sessionStorage.getItem("sf_token");

      if (!accessToken) {
        // 2. Redirect to Salesforce. If user is logged in, it redirects back instantly.
        const authUrl = `${INSTANCE_URL}/services/oauth2/authorize?response_type=token&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
        window.location.href = authUrl;
        return;
      }

      // Store token and clean the URL to prevent issues on refresh
      sessionStorage.setItem("sf_token", accessToken);
      if (window.location.hash) {
        window.history.replaceState(null, null, window.location.pathname);
      }

      try {
        // 3. Use the token to get the Frontdoor URL from your bridge API
        const response = await fetch("/api/get-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken, instanceUrl: INSTANCE_URL, appId: APP_ID })
        });
        const result = await response.json();

        if (result.success && result.url) {
          // 4. Load the official LO 2.0 Script
          const script = document.createElement("script");
          script.src = `${INSTANCE_URL}/lightning/lightning.out.latest/index.iife.prod.js`;
          
          script.onload = () => {
            const loApp = document.querySelector("lightning-out-application");
            if (loApp) {
              // Trigger the handshake using the singleaccess URL
              loApp.setAttribute("frontdoor-url", result.url);
              loApp.addEventListener("ready", () => setLoading(false));
            }
          };
          document.body.appendChild(script);
        }
      } catch (e) {
        console.error("Lightning Out Auth failed:", e);
      }
    };

    initFlow();
  }, []);

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#242424' }}>
      <div style={{ opacity: loading ? 0.2 : 1, transition: 'opacity 0.5s' }}>
        <lightning-out-application components="c-hello-world-lwc"></lightning-out-application>
        <div className="slds-scope">
          <c-hello-world-lwc></c-hello-world-lwc>
        </div>
      </div>
    </div>
  );
};

export default LightningOutApp;
