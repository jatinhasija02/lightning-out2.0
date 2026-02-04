import { useEffect, useState } from "react";

const LightningOutApp = () => {
  const [loading, setLoading] = useState(true);

  // CONFIGURATION - NO PRIVATE KEYS OR PASSWORDS
  const CLIENT_ID = "3MVG9VMBZCsTL9hnVO_6Q8ke.yyExmYi92cqK7ggByeErX0x.v9EFR9JFcaZhdTvibyAdqHSYFFhDtrdb3Fn8"; // From Connected App
  const APP_ID = "1UsNS0000000CUD0A2"; // From LO 2.0 App Manager
  const INSTANCE_URL = "https://algocirrus-b6-dev-ed.develop.my.salesforce.com";
  const REDIRECT_URI = "https://lightning-out2-0.vercel.app"; 

  useEffect(() => {
    const initFlow = async () => {
      // 1. Check if we already have an access token in the URL hash (post-login)
      let accessToken = new URLSearchParams(window.location.hash.replace("#", "?")).get("access_token");

      if (!accessToken) {
        // 2. If no token, redirect to Salesforce for "silent" or interactive login
        // Because the user might already be logged in, this often completes instantly
        const authUrl = `${INSTANCE_URL}/services/oauth2/authorize?response_type=token&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
        window.location.href = authUrl;
        return;
      }

      // 3. Use the token to get a Frontdoor URL via your backend API
      try {
        const response = await fetch("/api/get-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken, instanceUrl: INSTANCE_URL, appId: APP_ID })
        });
        const { url } = await response.json();

        // 4. Load LO 2.0 Script and Initialize
        const script = document.createElement("script");
        script.src = `${INSTANCE_URL}/lightning/lightning.out.latest/index.iife.prod.js`;
        script.onload = () => {
          const loApp = document.querySelector("lightning-out-application");
          loApp.setAttribute("frontdoor-url", url);
          loApp.addEventListener("ready", () => setLoading(false));
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
export default LightningOutApp;
