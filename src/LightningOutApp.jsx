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
            // Attach listener BEFORE setting attribute
            loApp.addEventListener("ready", () => setLoading(false));
            loApp.setAttribute("frontdoor-url", result.url);
          }
        };
        document.body.appendChild(script);
      }
    };
    startLWC();
  }, []);

  return (
    <div style={{ width: '100%', padding: '20px', boxSizing: 'border-box' }}>
      {loading && <h2 style={{ textAlign: 'center' }}>Connecting to Salesforce...</h2>}
      
      <lightning-out-application
        components="c-hello-world-lwc"
        app-id="1UsNS0000000CUD0A2"
      ></lightning-out-application>

      <div className="slds-scope">
        <c-hello-world-lwc></c-hello-world-lwc>
      </div>
    </div>
  );
};

export default LightningOutApp;
