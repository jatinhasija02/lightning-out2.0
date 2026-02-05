import { useState, useEffect } from "react";

const LightningOutApp = () => {
  // Input state
  const [usernameInput, setUsernameInput] = useState("");
  const [isStarted, setIsStarted] = useState(false);

  // App logic state
  const [loading, setLoading] = useState(true);
  const [logStatus, setLogStatus] = useState("Initializing...");

  // 1. On Mount: Check if we have a saved user
  useEffect(() => {
    const savedUser = localStorage.getItem("sf_debug_user");
    if (savedUser) {
      console.log("Found saved user:", savedUser);
      setUsernameInput(savedUser);
      // Auto-connect with the saved user
      connectToSalesforce(savedUser);
    }
  }, []);

  // 2. The Reusable Connection Logic
  const connectToSalesforce = async (userToConnect) => {
    if (!userToConnect) return;

    setIsStarted(true); // Switch UI immediately
    setLogStatus(`Restoring session for ${userToConnect}...`);

    try {
      console.log("LOG [1]: Requesting session from Vercel API for:", userToConnect);
      
      const response = await fetch(`/api/get-url?username=${encodeURIComponent(userToConnect)}`);
      const result = await response.json();
      console.log("LOG [2]: API Result received:", result);

      if (result.success && result.url) {
        // SUCCESS: Save the user to localStorage so it persists on refresh
        localStorage.setItem("sf_debug_user", userToConnect);

        setLogStatus("Session active. Loading Salesforce scripts...");
        
        const script = document.createElement("script");
        // Ensure this URL matches your environment (Sandbox vs Prod)
        script.src = "https://algocirrus-b6-dev-ed.develop.my.salesforce.com/lightning/lightning.out.latest/index.iife.prod.js";
        
        script.onload = () => {
          console.log("LOG [3]: index.iife.prod.js loaded.");
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
              if (component) {
                console.log("LOG [7]: Failsafe triggered. Hiding overlay.");
                setLoading(false);
              }
            }, 3000); 

          } else {
            setLogStatus("Error: <lightning-out-application> not found in DOM.");
          }
        };

        script.onerror = (err) => {
          console.error("LOG [ERR]: Script failed to load.", err);
          setLogStatus("Network Error: Could not load Salesforce script.");
        };

        document.body.appendChild(script);
      } else {
        console.error("LOG [ERR]: API failure status.", result);
        setLogStatus(`API Error: ${result.authData?.error_description || result.status || 'Unknown'}`);
      }
    } catch (err) {
      console.error("LOG [ERR]: Runtime crash.", err);
      setLogStatus("Crash: " + err.message);
    }
  };

  // 3. Handle Form Submit
  const handleStart = (e) => {
    e.preventDefault();
    if (!usernameInput) return alert("Please enter a username");
    connectToSalesforce(usernameInput);
  };

  // 4. Handle Disconnect (Logout)
  const handleDisconnect = () => {
    localStorage.removeItem("sf_debug_user"); // Clear storage
    setIsStarted(false); // Go back to login screen
    setUsernameInput(""); // Clear input
    setLoading(true); // Reset loading state
    window.location.reload(); // Force reload to clear any Salesforce scripts/sessions
  };

  // RENDER: Login Screen
  if (!isStarted) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center',
        background: '#242424',
        color: 'white',
        gap: '20px'
      }}>
        <h2>Lightning Out Debugger</h2>
        <form onSubmit={handleStart} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="Enter Salesforce Username" 
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            style={{ padding: '10px', width: '300px', borderRadius: '4px', border: 'none' }}
          />
          <button 
            type="submit" 
            style={{ padding: '10px', cursor: 'pointer', backgroundColor: '#0070d2', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Connect & Load LWC
          </button>
        </form>
      </div>
    );
  }

  // RENDER: Connected Screen (Lightning Out)
  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#242424', padding: '0', position: 'relative' }}>
      
      {/* Top Bar with Disconnect Button */}
      <div style={{
        position: 'absolute', top: '10px', right: '10px', zIndex: 100
      }}>
        <button 
          onClick={handleDisconnect}
          style={{
            padding: '8px 16px', backgroundColor: '#c23934', color: 'white', 
            border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
          }}
        >
          Disconnect ({usernameInput})
        </button>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.8)', color: 'white', display: 'flex', 
          justifyContent: 'center', alignItems: 'center', zIndex: 50
        }}>
           <p>{logStatus}</p>
        </div>
      )}

      <div style={{ 
        opacity: loading ? 0 : 1, 
        width: '100%',
        backgroundColor: 'transparent' 
      }}>
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
