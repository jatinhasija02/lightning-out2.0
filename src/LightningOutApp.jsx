// src/LightningOutApp.jsx
import { useState, useEffect } from "react";

const LightningOutApp = () => {
  // UI State
  const [username, setUsername] = useState("");
  const [started, setStarted] = useState(false);

  // App State
  const [loading, setLoading] = useState(false);
  const [logStatus, setLogStatus] = useState("Waiting for user input...");

  // 1. NEW: Check Local Storage on Mount
  useEffect(() => {
    const savedUser = localStorage.getItem("sf_username");
    if (savedUser) {
      console.log("Found saved user:", savedUser);
      setUsername(savedUser);
      // Automatically connect using the saved user
      startLWC(savedUser);
    }
  }, []);

  // 2. Updated startLWC to accept an optional argument (for auto-login)
  const startLWC = async (userOverride) => {
    // If called by button click, userOverride is an event, so we use state.
    // If called by useEffect, userOverride is a string, so we use that.
    const userToUse = typeof userOverride === "string" ? userOverride : username;

    if (!userToUse) {
      alert("Please enter Salesforce username");
      return;
    }

    setStarted(true);
    setLoading(true);
    setLogStatus(`Connecting as ${userToUse}...`);

    try {
      console.log("LOG [1]: Requesting session for:", userToUse);

      const response = await fetch(
        `/api/get-url?username=${encodeURIComponent(userToUse)}`
      );

      const result = await response.json();
      console.log("LOG [2]: API Result received:", result);

      if (result.success && result.url) {
        // 3. NEW: Save to Local Storage on Success
        localStorage.setItem("sf_username", userToUse);
        
        setLogStatus("Session active. Loading Salesforce scripts...");

        const script = document.createElement("script");
        // Ensure this URL matches your instance (Sandbox vs Prod)
        script.src = "https://algocirrus-b6-dev-ed.develop.my.salesforce.com/lightning/lightning.out.latest/index.iife.prod.js";

        script.onload = () => {
          console.log("LOG [3]: Lightning Out script loaded");

          const loApp = document.querySelector("lightning-out-application");

          if (loApp) {
            console.log("LOG [4]: Attaching frontdoor URL");

            loApp.addEventListener("ready", () => {
              console.log("LOG [5]: Lightning Out ready");
              setLoading(false);
            });

            loApp.setAttribute("frontdoor-url", result.url);

            // Failsafe
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
        // Optional: Clear invalid user from storage if auth fails
        // localStorage.removeItem("sf_username"); 
      }
    } catch (err) {
      console.error(err);
      setLogStatus("Runtime error: " + err.message);
      setLoading(false);
    }
  };

  // 4. NEW: Handle Disconnect
  const handleDisconnect = () => {
    localStorage.removeItem("sf_username"); // Clear storage
    setStarted(false);
    setUsername("");
    setLoading(false);
    // Reload to clear Lightning Out scripts/session from memory
    window.location.reload();
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
      
      {/* Disconnect Button */}
      <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 100 }}>
        <button 
          onClick={handleDisconnect}
          style={{ padding: '8px 16px', backgroundColor: '#c23934', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Disconnect ({username})
        </button>
      </div>

      {loading && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <p>{logStatus}</p>
        </div>
      )}

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
