import { useEffect } from "react";

const LightningOutApp = () => {
  useEffect(() => {
    // Load Lightning Out script dynamically
    const script = document.createElement("script");
    script.src =
      "https://algocirrus-b6-dev-ed.develop.my.salesforce.com/lightning/lightning.out.latest/index.iife.prod.js";
    script.async = true;

    script.onload = () => {
      const lightningOutApp = document.querySelector(
        "lightning-out-application"
      );

      if (lightningOutApp) {
        lightningOutApp.addEventListener("ready", () => {
          console.log("Success! LWC is rendered via Lightning Out 2.0");
        });
      }
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <>
      <lightning-out-application
        components="c-hello-world-lwc"
        frontdoor-url="https://algocirrus-b6-dev-ed.develop.my.salesforce.com/secur/frontdoor.jsp?ssid=00DNS00000NKw5p!AQEAQIsqSxMbz8O0NATSse1cxl8LiFSIHapDPGRoTJZFk9Zlo_sj0bfbVIznNKuaB6y3bcYF69fvcMrKRsxnkKqqTz6J4Zoh"
        app-id="1UsNS0000000CUD0A2"
      ></lightning-out-application>

      {/* LWC Web Component */}
      {/* <c-component-hello-world-lwc> Somrnitbrjebg</c-component-hello-world-lwc> */}
    </>
  );
};

export default LightningOutApp;
