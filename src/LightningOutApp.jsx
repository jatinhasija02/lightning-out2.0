// src/LightningOutApp.jsx
import { useState, useEffect } from "react";

const LightningOutApp = () => {
  const [usernameInput, setUsernameInput] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logStatus, setLogStatus] = useState("Initializing...");
  
  // New State to hold dynamic config
  const [dynamicConfig, setDynamicConfig] = useState({ appId: null });

  // 1. On Mount: Check for saved user
  useEffect(() => {
    const savedUser = localStorage.getItem("sf_debug_user");
    if (savedUser) {
      console.log("Found saved user:", savedUser);
      setUsernameInput(savedUser);
      connectToSalesforce(savedUser);
    }
  }, []);

  // 2. Connection Logic
  const connectToSalesforce = async (userToConnect) => {
    if (!userToConnect) return;

    setIsStarted(true);
    setLogStatus(`Restoring session for ${userToConnect}...`);

    try {
      console.log("LOG [1]: Requesting session...", userToConnect);
      
      const response = await fetch(`/api/get-url?username=${encodeURIComponent(userToConnect)}`);
      const result = await response.json();

      if (result.success && result.url) {
        localStorage.setItem("sf_debug_user", userToConnect);
        
        // Save the dynamic App ID for rendering below
        setDynamicConfig({ appId: result.appId });

        setLogStatus("Session active. Loading Salesforce scripts...");
        
        const script = document.createElement("script");
        
        // CHANGE: Dynamic Instance URL instead of hardcoded string
        // This ensures it works for Dev Hub, Sandboxes, or Production automatically
        script.src = `${result.instanceUrl}/lightning/lightning.out.latest/index.iife.prod.js`;
        
        script.onload = () => {
          console.log("LOG [3]: Salesforce script loaded.");
          const loApp = document.querySelector("lightning-out-application");
          
          if (loApp) {
            console.log("LOG [4]: Attaching handshake...");
            
            loApp.addEventListener("ready", () => {
              console.log("LOG [5]: SUCCESS! 'ready' event captured.");
              setLoading(false);
            });

            loApp.setAttribute("frontdoor-url", result.url);

            // FAILSAFE
            setTimeout(() => {
              const component = document.querySelector("c-hello-world-lwc");
              if (component) setLoading(false);
            }, 3000); 

          } else {
            setLogStatus("Error: <lightning-out-application> tag missing.");
          }
        };

        script.onerror = (err) => {
            console.error(err);
            setLogStatus("Network Error: Could not load Salesforce script (CORS or Blocked).");
        };

        document.body.appendChild(script);
      } else {
        setLogStatus(`API Error: ${result.authData?.error || 'Unknown Error'}`);
      }
    } catch (err) {
      setLogStatus("Crash: " + err.message);
    }
  };

  const handleStart = (e) => {
    e.preventDefault();
    if (!usernameInput) return alert("Please enter a username");
    connectToSalesforce(usernameInput);
  };

  const handleDisconnect = () => {
    localStorage.removeItem("sf_debug_user");
    window.location.reload();
  };

  // RENDER: Login Screen
  if (!isStarted) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#242424', color: 'white', gap: '20px' }}>
        <h2>Lightning Out Debugger</h2>
        <form onSubmit={handleStart} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input 
            type="text" placeholder="Enter Salesforce Username" 
            value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)}
            style={{ padding: '10px', width: '300px', borderRadius: '4px', border: 'none' }}
          />
          <button type="submit" style={{ padding: '10px', cursor: 'pointer', backgroundColor: '#0070d2', color: 'white', border: 'none', borderRadius: '4px' }}>
            Connect & Load LWC
          </button>
        </form>
      </div>
    );
  }

  // RENDER: Connected Screen
  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#242424', position: 'relative' }}>
      
      <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 100 }}>
        <button onClick={handleDisconnect} style={{ padding: '8px 16px', backgroundColor: '#c23934', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          Disconnect
        </button>
      </div>

      {loading && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50 }}>
           <p>{logStatus}</p>
        </div>
      )}

      {/* CHANGE: Only render this when we have the App ID */}
      {dynamicConfig.appId && (
          <div style={{ opacity: loading ? 0 : 1 }}>
            <lightning-out-application
              components="c-hello-world-lwc"
              app-id={dynamicConfig.appId} 
            ></lightning-out-application>

            <div className="slds-scope">
              <c-hello-world-lwc></c-hello-world-lwc>
            </div>
          </div>
      )}
    </div>
  );
};

export default LightningOutApp;
