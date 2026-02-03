import { useEffect, useState } from "react";

const LightningOutApp = () => {
  const [dynamicUrl, setDynamicUrl] = useState("");

  useEffect(() => {
    // 1. Ask our "Secret Agent" file for a fresh URL
    fetch("/api/get-url")
      .then(res => res.json())
      .then(data => setDynamicUrl(data.url));

    // 2. Load the Salesforce Script
    const script = document.createElement("script");
    script.src = "https://algocirrus-b6-dev-ed.develop.my.salesforce.com/lightning/lightning.out.latest/index.iife.prod.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Don't show anything until we have the URL
  if (!dynamicUrl) return <div>Connecting to Salesforce...</div>;

  return (
    <>
      <lightning-out-application
        components="c-hello-world-lwc"
        frontdoor-url={dynamicUrl}
        app-id="1UsNS0000000CUD0A2"
      ></lightning-out-application>

      <c-hello-world-lwc></c-hello-world-lwc>
    </>
  );
};

export default LightningOutApp;
