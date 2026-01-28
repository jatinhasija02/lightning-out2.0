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
        components="c-component-hello-world-lwc"
        frontdoor-url="https://algocirrus-b6-dev-ed.develop.my.salesforce.com/secur/frontdoor.jsp?ssid=00DgL000009aOQ2!AQEAQBqBfwfIYbWJycinlS7.IkFWkMV4vfau3LZCjNlC6l9u3YQ9VrP_VlC.Ld3iku7KM7ZXwgmkCzICZNHjssFWrpgwQzR3"
        app-id="1UsNS0000000CUD0A2"
      ></lightning-out-application>

      {/* LWC Web Component */}
      <c-component-hello-world-lwc> Somrnitbrjebg</c-component-hello-world-lwc>
    </>
  );
};

export default LightningOutApp;
