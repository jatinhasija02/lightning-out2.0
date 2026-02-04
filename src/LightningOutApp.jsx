// src/LightningOutApp.jsx
import { useEffect, useState } from "react";

const LightningOutApp = () => {
  const [loading, setLoading] = useState(true);

  const CLIENT_ID = "3MVG9VMBZCsTL9hnVO_6Q8ke.yyExmYi92cqK7ggByeErX0x.v9EFR9JFcaZhdTvibyAdqHSYFFhDtrdb3Fn8";
  const APP_ID = "1UsNS0000000CUD0A2";
  const INSTANCE_URL = "https://algocirrus-b6-dev-ed.develop.my.salesforce.com";
  const REDIRECT_URI = "https://lightning-out2-0.vercel.app"; 

  useEffect(() => {
    const initFlow = async () => {
      let accessToken = new URLSearchParams(window.location.hash.replace("#", "?")).get("access_token");

      if (!accessToken) {
        const authUrl = `${INSTANCE_URL}/services/oauth2/authorize?response_type=token&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
        window.location.href = authUrl;
        return;
      }

      try {
        const response = await fetch("/api/get-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            accessToken, // This is the token from your URL hash
            instanceUrl: "https://algocirrus-b6-dev-ed.develop.my.salesforce.com",
            appId: "1UsNS0000000CUD0A2" 
          })
        });
        const { url } = await response.json();

        const script = document.createElement("script");
        script.src = `${INSTANCE_URL}/lightning/lightning.out.latest/index.iife.prod.js`;
        script.onload = () => {
          const loApp = document.querySelector("lightning-out-application");
          if (loApp) {
            loApp.setAttribute("frontdoor-url", url);
            loApp.addEventListener("ready", () => setLoading(false));
          }
        };
        document.body.appendChild(script);
      } catch (e) {
        console.error("Auth failed", e);
      }
    };

    initFlow();
  }, []);

  return (
    <div style={{ opacity: loading ? 0.5 : 1 }}>
      <lightning-out-application components="c-hello-world-lwc"></lightning-out-application>
      <div className="slds-scope">
        <c-hello-world-lwc></c-hello-world-lwc>
      </div>
    </div>
  );
};

// Ensure this is exactly like this for App.jsx to find it
export default LightningOutApp;
