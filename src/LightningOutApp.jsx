import { useEffect, useState } from "react";

const LightningOutApp = () => {
  const [loading, setLoading] = useState(true);
  const [logStatus, setLogStatus] = useState("Initializing...");

  useEffect(() => {
    const startLWC = async () => {
      try {
        console.log("LOG [1]: Requesting session from Vercel API...");
        const response = await fetch("/api/get-url");
         console.log( 'authData-->', result);
        const result = await response.json();
        console.log("LOG [2]: API Result received:", result);

        if (result.success && result.url) {
          setLogStatus("Session active. Loading Salesforce scripts...");
          
          const script = document.createElement("script");
          script.src = "https://algocirrus-b6-dev-ed.develop.my.salesforce.com/lightning/lightning.out.latest/index.iife.prod.js";
          
          script.onload = () => {
            console.log("LOG [3]: index.iife.prod.js loaded.");
            const loApp = document.querySelector("lightning-out-application");
            
            if (loApp) {
              console.log("LOG [4]: Attaching handshake...");
              
              // Event listener for the official handshake completion
              loApp.addEventListener("ready", () => {
                console.log("LOG [5]: SUCCESS! 'ready' event captured.");
                setLoading(false);
              });

              // Trigger the handshake
              loApp.setAttribute("frontdoor-url", result.url);

              // FAILSAFE: If the 'ready' event is swallowed, force hide loading
              setTimeout(() => {
                const component = document.querySelector("c-hello-world-lwc");
                if (component) {
                  console.log("LOG [7]: Failsafe triggered. Hiding overlay.");
                  setLoading(false);
                }
              }, 3000); 

            }
          };

          script.onerror = (err) => {
            console.error("LOG [ERR]: Script failed to load.", err);
            setLogStatus("Network Error: Could not load Salesforce script.");
          };

          document.body.appendChild(script);
        } else {
          console.error("LOG [ERR]: API failure status.", result);
          setLogStatus(`API Error: ${result.authData?.error_description || result.status || 'Unknown'}`);
        }
      } catch (err) {
        console.error("LOG [ERR]: Runtime crash.", err);
        setLogStatus("Crash: " + err.message);
      }
    };

    startLWC();
  }, []);

  return (
  <div style={{ width: '100%', minHeight: '100vh', background: '#242424', padding: '0' }}>
    {/* Loading Overlay logic stays here */}
    
    <div style={{ 
      opacity: loading ? 0 : 1, 
      width: '100%',
      backgroundColor: 'transparent' // Ensure this is transparent
    }}>
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
