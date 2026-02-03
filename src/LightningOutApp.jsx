import { useEffect, useState } from "react";

const LightningOutApp = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const startLWC = async () => {
      const response = await fetch("/api/get-url");
      const result = await response.json();

      if (result.success) {
        const script = document.createElement("script");
        script.src = "https://algocirrus-b6-dev-ed.develop.my.salesforce.com/lightning/lightning.out.latest/index.iife.prod.js";
        script.onload = () => {
          const loApp = document.querySelector("lightning-out-application");
          if (loApp) {
            loApp.setAttribute("frontdoor-url", result.url);
            loApp.addEventListener("ready", () => setLoading(false));
          }
        };
        document.body.appendChild(script);
      }
    };
    startLWC();
  }, []);

  return (
    <div style={{ background: '#1a1a1a', minHeight: '100vh', padding: '20px' }}>
      {loading && <h2 style={{ color: 'white' }}>Initializing Salesforce Session...</h2>}
      
      <lightning-out-application
        components="c-hello-world-lwc"
        app-id="1UsNS0000000CUD0A2"
      ></lightning-out-application>

      <c-hello-world-lwc></c-hello-world-lwc>
    </div>
  );
};

export default LightningOutApp;
