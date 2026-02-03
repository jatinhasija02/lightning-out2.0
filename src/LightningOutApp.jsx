import { useEffect, useState } from "react";

const LightningOutApp = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const startLWC = async () => {
      console.log("1. Fetching URL from API...");
      const response = await fetch("/api/get-url");
      const result = await response.json();
      console.log("2. API Result:", result);

      if (result.success) {
        const script = document.createElement("script");
        // Using the latest IIFE production script for Lightning Out 2.0
        script.src = "https://algocirrus-b6-dev-ed.develop.my.salesforce.com/lightning/lightning.out.latest/index.iife.prod.js";
        
        script.onload = () => {
          console.log("3. Lightning Out Script Loaded");
          const loApp = document.querySelector("lightning-out-application");
          
          if (loApp) {
            console.log("4. Found <lightning-out-application> element");
            
            // Attach listener BEFORE setting attribute
            loApp.addEventListener("ready", () => {
              console.log("5. SUCCESS: LWC is Ready!");
              setLoading(false);
            });

            console.log("6. Triggering handshake with frontdoor-url...");
            loApp.setAttribute("frontdoor-url", result.url);
          } else {
            console.error("ERROR: <lightning-out-application> tag not found in DOM");
          }
        };

        script.onerror = () => console.error("ERROR: Failed to load Salesforce script");
        document.body.appendChild(script);
      } else {
        console.error("ERROR: API failed to return success", result);
      }
    };

    startLWC();
  }, []);

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#242424', padding: '0' }}>
      {loading && (
        <h2 style={{ color: 'white', textAlign: 'center', paddingTop: '50px' }}>
          Initializing Salesforce Session...
        </h2>
      )}
      
      <div style={{ width: '100%', textAlign: 'left' }}>
        <lightning-out-application
          components="c-hello-world-lwc"
          app-id="1UsNS0000000CUD0A2"
        ></lightning-out-application>

        <c-hello-world-lwc></c-hello-world-lwc>
      </div>
    </div>
  );
};

export default LightningOutApp;
