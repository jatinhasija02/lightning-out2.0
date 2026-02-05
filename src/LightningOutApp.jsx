// src/LightningOutApp.jsx
import { useState } from "react";

const LightningOutApp = () => {
  // UI State
  const [username, setUsername] = useState("");
  const [started, setStarted] = useState(false);

  // App State
  const [loading, setLoading] = useState(false);
  const [logStatus, setLogStatus] = useState("Waiting for user input...");

  const startLWC = async () => {
    if (!username) {
      alert("Please enter Salesforce username");
      return;
    }

    setStarted(true);
    setLoading(true);
    setLogStatus(`Connecting as ${username}...`);

    try {
      console.log("LOG [1]: Requesting session for:", username);

      // 1. Fetch the Frontdoor URL from your Vercel API
      const response = await fetch(
        `/api/get-url?username=${encodeURIComponent(username)}`
      );

      const result = await response.json();
      console.log("LOG [2]: API Result received:", result);

      if (result.success && result.url) {
        setLogStatus("Session active. Loading Salesforce scripts...");

        // 2. Create and inject the Lightning Out 2.0 script
        const script = document.createElement("script");
        // Ensure this URL matches your instance (Sandbox vs Prod)
        script.src = "https://algocirrus-b6-dev-ed.develop.my.salesforce.com/lightning/lightning.out.latest/index.iife.prod.js";

        script.onload = () => {
          console.log("LOG [3]: Lightning Out script loaded");

          const loApp = document.querySelector("lightning-out-application");

          if (loApp) {
            console.log("LOG [4]: Attaching frontdoor URL");

            // 3. Listen for the 'ready' event
            loApp.addEventListener("ready", () => {
              console.log("LOG [5]: Lightning Out ready");
              setLoading(false);
            });

            // 4. Set the frontdoor URL to start the handshake
            loApp.setAttribute("frontdoor-url", result.url);

            // Failsafe: Sometimes 'ready' fires too early or late
            setTimeout(() => {
              const component = document.querySelector("c-hello-world-lwc");
              if (component) {
                setLoading(false);
              }
            }, 3000);
          }
        };

        script.onerror = () => {
          setLogStatus("Failed to load Salesforce script");
          setLoading(false);
        };

        document.body.appendChild(script);
      } else {
        console.error("Auth Failed:", result);
        setLogStatus(`Authentication failed: ${result.error || result.message || "Unknown Error"}`);
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLogStatus("Runtime error: " + err.message);
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  if (!started) {
    return (
      <div style={{ height: "100vh", background: "#242424", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white", gap: "16px" }}>
        <h2>Lightning Out Launcher</h2>
        <input
          type="text"
          placeholder="Enter Salesforce Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ padding: "10px", width: "320px", borderRadius: "4px", border: "none" }}
        />
        <button
          onClick={startLWC}
          style={{ padding: "10px 20px", background: "#0070d2", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
        >
          Connect & Load LWC
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#242424", position: "relative" }}>
      {loading && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <p>{logStatus}</p>
        </div>
      )}

      <div style={{ opacity: loading ? 0 : 1 }}>
        {/* Using your specific App ID and Component Name */}
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
