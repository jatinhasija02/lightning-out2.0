import { useEffect, useState } from "react";

const LightningOutApp = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initLightningOut = async () => {
      try {
        const response = await fetch("/api/get-url");
        const result = await response.json();

        if (result.success && result.url) {
          const script = document.createElement("script");
          script.src = "https://algocirrus-b6-dev-ed.develop.my.salesforce.com/lightning/lightning.out.latest/index.iife.prod.js";
          script.async = true;

          script.onload = () => {
            const lightningOutApp = document.querySelector("lightning-out-application");
            if (lightningOutApp) {
              // Dynamically set the frontdoor URL from our API
              lightningOutApp.setAttribute("frontdoor-url", result.url);
              
              lightningOutApp.addEventListener("ready", () => {
                console.log("LWC Rendered Successfully!");
                setLoading(false);
              });
            }
          };
          document.body.appendChild(script);
        } else {
          setError(result.status || "Failed to get URL");
        }
      } catch (err) {
        setError(err.message);
      }
    };

    initLightningOut();
  }, []);

  if (error) return <div style={{color: 'red'}}>Error: {error}</div>;

  return (
    <>
      {loading && <div style={{color: 'white'}}>Connecting to Salesforce...</div>}
      <lightning-out-application
        components="c-hello-world-lwc"
        app-id="1UsNS0000000CUD0A2"
      ></lightning-out-application>
      <c-hello-world-lwc></c-hello-world-lwc>
    </>
  );
};

export default LightningOutApp;
