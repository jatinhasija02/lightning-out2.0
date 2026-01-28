
// import React, { useEffect, useState } from "react";

// const LightningOut = () => {
//   const CLIENT_ID = '3MVG90M53M443DSEg3aDKvHoatNMjlZfgZ5Ni79bDLii_TZ531CPAYqMhP9bQJjvFXJjBJwQ6xSTMyGG0NUI0';
//   const REDIRECT_URI = "https://react-lightning.vercel.app";
//   const LOGIN_URL = "https://test.salesforce.com"; // login.salesforce.com for prod
//   const APP_NAME = "c:LightningOutApp";
//   const COMPONENT_NAME = "c:prmLightningOutWrapper";


//   const [scriptLoaded, setScriptLoaded] = useState(false);

//   // Parse token from URL hash
//   const getAccessTokenFromUrl = () => {
//     const params = new URLSearchParams(window.location.hash.substring(1));
//     return params.get("access_token");
//   };

//   // Redirect to OAuth login
//   const oauthLogin = () => {
//     const url = `${LOGIN_URL}/services/oauth2/authorize?response_type=token&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
//       REDIRECT_URI
//     )}&scope=web full`;
//     window.location.href = url;
//   };

//   // Load Lightning Out LWC
//   const loadLwc = () => {
//     const FRONTDOOR_URL = `https://myadp--dit2.sandbox.lightning.force.com/secur/frontdoor.jsp?sid=00DRT000009YqOn!AQEAQPdkBpCvVbjFC.mMYxXSBltl_uT4qrkb_mRzgbJRtbBT878ollW4D_MWGEq3KUgZoIzdv9Ni4BxZgsnjOaub0uu1Y1Av`;

//     if (window.$Lightning) {
//       window.$Lightning.use(
//         APP_NAME,
//         () => {
//           window.$Lightning.createComponent(
//             COMPONENT_NAME,
//             {}, // attributes
//             "lwcContainer",
//             () => console.log("✅ LWC rendered via Lightning Out v1")
//           );
//         },
//         FRONTDOOR_URL
//       );
//       console.log("$Lightning not loaded");
//     } else {
//       console.error("$Lightning not loaded yet");
//     }
//   };

//   // Dynamically load Lightning Out script
//   useEffect(() => {
//     const script = document.createElement("script");
//     script.src =
//       "https://myadp--dit2.sandbox.lightning.force.com/lightning/lightning.out.js";
//     script.async = true;
//     script.onload = () => setScriptLoaded(true);
//     document.body.appendChild(script);

//     return () => {
//       document.body.removeChild(script);
//     };
//   }, []);

//   // Automatically load LWC when script is ready and token exists
//   useEffect(() => {
//     const token = getAccessTokenFromUrl();
//     if (scriptLoaded && token) {
//       loadLwc(token);
//     }
//   }, [scriptLoaded]);

//   return (
//     <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
//       <h2>Lightning Out v1 – External Site (OAuth)</h2>
//       <button
//         onClick={() => {
          
//             loadLwc();
         
//         }}
//       >
//         Login & Load LWC
//       </button>
//       <div
//         id="lwcContainer"
//         style={{
//           border: "1px solid #ccc",
//           padding: "16px",
//           marginTop: "20px",
//           minHeight: "120px",
//         }}
//       ></div>
//     </div>
//   );
// };

// export default LightningOut;

import { useEffect, useRef } from "react";

export default function LightningOutReact() {
  const lightningLoaded = useRef(false);

  // ⚠️ TESTING ONLY — never hardcode in prod
  const ACCESS_TOKEN =
    "00DgL000009aOQ2!AQEAQBqBfwfIYbWJycinlS7.IkFWkMV4vfau3LZCjNlC6l9u3YQ9VrP_VlC.Ld3iku7KM7ZXwgmkCzICZNHjssFWrpgwQzR3"; // shorten for sanity
  const INSTANCE_URL =
    "https://orgfarm-5ee5e22dc0-dev-ed.develop.my.salesforce.com";

  const AURA_APP = "c:LightningOutApp";
  const AURA_COMPONENT = "c:HelloWorldAura";

  useEffect(() => {
    if (document.getElementById("lightning-out")) return;

    const script = document.createElement("script");
    script.id = "lightning-out";
    script.src =
      INSTANCE_URL.replace(
        "my.salesforce.com",
        "lightning.force.com"
      ) + "/lightning/lightning.out.js";

    script.onload = initLightning;
    document.body.appendChild(script);
  }, []);

  function initLightning() {
    if (lightningLoaded.current) return;

    const lightningUrl = INSTANCE_URL.replace(
      "my.salesforce.com",
      "lightning.force.com"
    );

    window.$Lightning.use(
      AURA_APP,
      () => {
        lightningLoaded.current = true;
        renderAuraComponent();
      },
      lightningUrl,
      ACCESS_TOKEN
    );
  }

  function renderAuraComponent() {
    window.$Lightning.createComponent(
      AURA_COMPONENT,
      {}, // no attributes — your LWC doesn't need any
      "lexcontainer",
      () => {
        console.log("✅ Lightning Out component rendered");
      }
    );
  }

  return (
    <div style={{ padding: "16px" }}>
      <h3>Salesforce Lightning Out (React)</h3>

      <div
        id="lexcontainer"
        style={{
          minHeight: "250px",
          border: "1px solid #ddd",
          marginTop: "12px",
        }}
      />
    </div>
  );
}









