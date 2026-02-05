// src/LightningOutApp.jsx
import { useState, useEffect } from "react";

const LightningOutApp = () => {
  const [usernameInput, setUsernameInput] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logStatus, setLogStatus] = useState("Initializing...");
  
  // Store all necessary session data here
  const [sessionData, setSessionData] = useState(null);

  // 1. On Mount: Check for saved user in LocalStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("sf_debug_user");
    if (savedUser) {
      console.log("Found saved user:", savedUser);
      setUsernameInput(savedUser);
      connectToSalesforce(savedUser);
    }
  }, []);

  // 2. WATCHER: Only load the script AFTER the App ID is rendered
  useEffect(() => {
    if (sessionData && sessionData.appId) {
        // The component has re-rendered, so the <lightning-out-application> tag 
        // is guaranteed to be in the DOM now.
        loadSalesforceScript();
    }
  }, [sessionData]);

  // 3. Step 1: Just get the Data
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
        
        // This triggers a re-render. React will put the <lightning-out-application> 
        // tag in the DOM. The useEffect above will catch this change.
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

  // 4. Step 2: Load the Script (Called by useEffect)
  const loadSalesforceScript = () => {
    setLogStatus("Session active. Loading Salesforce scripts...");
        
    const script = document.createElement("script");
    script.src = `${sessionData.instanceUrl}/lightning/lightning.out.latest/index.iife.prod.js`;
    
    script.onload = () => {
      console.log("LOG [3]: Salesforce script loaded.");
      const loApp = document.querySelector("lightning-out-application");
      
      if (loApp) {
        console.log("LOG [4]: Attaching handshake...");
        
        loApp.addEventListener("ready", () => {
          console.log("LOG [5]: SUCCESS! 'ready' event captured.");
          setLoading(false);
        });

        loApp.setAttribute("frontdoor-url", sessionData.frontdoorUrl);

        // FAILSAFE: If the event misses for some reason
        setTimeout(() => {
          const component = document.querySelector("c-hello-world-lwc");
          if (component) setLoading(false);
        }, 4000); 

      } else {
        // This should theoretically never happen now
        setLogStatus("Error: <lightning-out-application> tag missing (DOM Issue).");
      }
    };

    script.onerror = (err) => {
        console.error(err);
        setLogStatus("Network Error: Could not load Salesforce script.");
    };

    document.body.appendChild(script);
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
          Disconnect ({usernameInput})
        </button>
      </div>

      {loading && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50 }}>
           <p>{logStatus}</p>
        </div>
      )}

      {/* RENDER CHECK: The tag is only created if appId exists */}
      {sessionData && sessionData.appId && (
          <div style={{ opacity: loading ? 0 : 1 }}>
            <lightning-out-application
              components="c-hello-world-lwc"
              app-id={sessionData.appId} 
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
