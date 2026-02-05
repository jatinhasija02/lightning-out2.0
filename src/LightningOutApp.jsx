/**
 * COMPONENT: LightningOutApp
 * -------------------------
 * This component manages the full lifecycle of embedding a Salesforce LWC.
 * * LOGIC FLOW:
 * 1. Checks LocalStorage for a previous session (Auto-Login).
 * 2. Authenticates via Backend API to get a "Frontdoor URL".
 * 3. Renders the <lightning-out-application> tag FIRST.
 * 4. Loads the Salesforce 'index.iife.prod.js' script SECOND.
 * (This order is critical to prevent "Tag Missing" errors).
*/

import { useState, useEffect } from "react";
const LightningOutApp = () => {
  // --- STATE MANAGEMENT ---
  const [usernameInput, setUsernameInput] = useState("");
  const [isStarted, setIsStarted] = useState(false); // Controls View (Login vs Connected)
  const [loading, setLoading] = useState(true);      // Controls Loading Overlay
  const [logStatus, setLogStatus] = useState("Initializing...");
  
  // This state holds the config from the API. 
  // IMPORTANT: Changing this state triggers the React Re-render that creates the DOM tag.
  const [sessionData, setSessionData] = useState(null);

  // --- EFFECT 1: AUTO-LOGIN ---
  // Runs once on mount. Checks if the user was already logged in.
  useEffect(() => {
    const savedUser = localStorage.getItem("sf_debug_user");
    if (savedUser) {
      console.log("Found saved user:", savedUser);
      setUsernameInput(savedUser);
      connectToSalesforce(savedUser);
    }
  }, []);

  // --- EFFECT 2: SCRIPT LOADER (The Race Condition Fix) ---
  // This watcher waits until 'sessionData' is set. 
  // Because 'sessionData' causes a re-render, we know that when this effect runs,
  // the <lightning-out-application> tag is arguably in the DOM (or will be momentarily).
  useEffect(() => {
    if (sessionData && sessionData.appId) {
        loadSalesforceScript();
    }
  }, [sessionData]);

  // --- STEP 1: AUTHENTICATION ---
  // Calls the backend to get the secure session URL.
  const connectToSalesforce = async (userToConnect) => {
    if (!userToConnect) return;

    setIsStarted(true);
    setLogStatus(`Restoring session for ${userToConnect}...`);

    try {
      console.log("LOG [1]: Requesting session...", userToConnect);
      
      const response = await fetch(`/api/get-url?username=${encodeURIComponent(userToConnect)}`);
      const result = await response.json();

      if (result.success && result.url) {
        // Success! Persist user for next time
        localStorage.setItem("sf_debug_user", userToConnect);
        
        // Setting this state triggers the render of the <lightning-out-application> tag below.
        setSessionData({
            appId: result.appId,
            instanceUrl: result.instanceUrl,
            frontdoorUrl: result.url
        });

      } else {
        setLogStatus(`API Error: ${result.authData?.error || 'Unknown Error'}`);
      }
    } catch (err) {
      setLogStatus("Crash: " + err.message);
    }
  };

  // --- STEP 2: LOAD SCRIPT & HANDSHAKE ---
  // Injects the Salesforce script and listens for the 'ready' event.
  const loadSalesforceScript = () => {
    setLogStatus("Session active. Loading Salesforce scripts...");
        
    const script = document.createElement("script");
    // Dynamic URL ensures we load the script from the correct Salesforce Org (Prod/Sandbox)
    script.src = `${sessionData.instanceUrl}/lightning/lightning.out.latest/index.iife.prod.js`;
    
    script.onload = () => {
      console.log("LOG [3]: Salesforce script loaded.");
      const loApp = document.querySelector("lightning-out-application");
      
      if (loApp) {
        console.log("LOG [4]: Attaching handshake...");
        
        // The 'ready' event is fired by Salesforce when it has successfully
        // authenticated using the frontdoor-url and is ready to show the component.
        loApp.addEventListener("ready", () => {
          console.log("LOG [5]: SUCCESS! 'ready' event captured.");
          setLoading(false);
        });

        // Set the secure URL on the DOM element to trigger the boot process
        loApp.setAttribute("frontdoor-url", sessionData.frontdoorUrl);

        // FAILSAFE: Sometimes 'ready' fires too fast or is missed.
        // If the inner component appears, we know it worked, so we hide the loading screen.
        setTimeout(() => {
          const component = document.querySelector("c-hello-world-lwc");
          if (component) setLoading(false);
        }, 4000); 

      } else {
        // If this happens, it means React didn't paint the tag fast enough.
        setLogStatus("Error: <lightning-out-application> tag missing (DOM Issue).");
      }
    };

    script.onerror = (err) => {
        console.error(err);
        setLogStatus("Network Error: Could not load Salesforce script.");
    };

    document.body.appendChild(script);
  };

  // --- EVENT HANDLERS ---
  
  const handleStart = (e) => {
    e.preventDefault();
    if (!usernameInput) return alert("Please enter a username");
    connectToSalesforce(usernameInput);
  };

  const handleDisconnect = () => {
    localStorage.removeItem("sf_debug_user");
    // Reloading is the cleanest way to clear Salesforce's global JavaScript variables
    window.location.reload();
  };

  // --- RENDER: VIEW 1 (LOGIN FORM) ---
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

  // --- RENDER: VIEW 2 (CONNECTED APP) ---
  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#242424', position: 'relative' }}>
      
      {/* Top Right Disconnect Button */}
      <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 100 }}>
        <button onClick={handleDisconnect} style={{ padding: '8px 16px', backgroundColor: '#c23934', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          Disconnect ({usernameInput})
        </button>
      </div>

      {/* Loading Overlay (Visible until 'ready' event) */}
      {loading && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50 }}>
           <p>{logStatus}</p>
        </div>
      )}

      {/* CRITICAL: This div is conditionally rendered.
          It only appears once 'sessionData.appId' is available.
          This ensures the tag exists before the script tries to find it.
      */}
      {sessionData && sessionData.appId && (
          <div style={{ opacity: loading ? 0 : 1 }}>
            {/* The Wrapper Web Component provided by Salesforce */}
            <lightning-out-application
              components="c-hello-world-lwc"
              app-id={sessionData.appId} 
            ></lightning-out-application>

            {/* The Actual LWC Container */}
            <div className="slds-scope">
              <c-hello-world-lwc></c-hello-world-lwc>
            </div>
          </div>
      )}
    </div>
  );
};

export default LightningOutApp;
