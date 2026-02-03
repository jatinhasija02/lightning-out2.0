import { useEffect, useState } from "react";

const LightningOutApp = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const startLWC = async () => {
      try {
        const response = await fetch("/api/get-url");
        const result = await response.json();

        if (result.success && result.url) {
          const script = document.createElement("script");
          // Use the absolute URL for the script
          script.src = "https://algocirrus-b6-dev-ed.develop.my.salesforce.com/lightning/lightning.out.latest/index.iife.prod.js";
          
          script.onload = () => {
            const loApp = document.querySelector("lightning-out-application");
            if (loApp) {
              // 1. Set the attribute to start the handshake
              loApp.setAttribute("frontdoor-url", result.url);

              // 2. Use a timeout as a fallback if the 'ready' event is missed
              const readyHandler = () => {
                console.log("Salesforce Ready Event Fired");
                setLoading(false);
              };

              loApp.addEventListener("ready", readyHandler);

              // Fallback: If it's still loading after 5 seconds, check if elements exist
              setTimeout(() => {
                if (document.querySelector('c-hello-world-lwc')?.shadowRoot) {
                  setLoading(false); 
                }
              }, 5000);
            }
          };
          document.body.appendChild(script);
        }
      } catch (err) {
        console.error("Initialization Error:", err);
      }
    };
    startLWC();
  }, []);

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#242424', color: 'white' }}>
      {loading && <h2 style={{ textAlign: 'center', paddingTop: '100px' }}>Connecting to Salesforce...</h2>}
      
      {/* Ensure these are always in the DOM for the script to find */}
      <div style={{ opacity: loading ? 0 : 1 }}>
        <lightning-out-application
          components="c-hello-world-lwc"
          app-id="1UsNS0000000CUD0A2"
        ></lightning-out-application>

        <div className="slds-scope">
          <c-hello-world-lwc></c-hello-world-lwc>
        </div>
      </div>
    </div>
  );
};

export default LightningOutApp;
