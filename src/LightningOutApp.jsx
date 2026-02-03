import { useEffect, useState } from "react";

const LightningOutApp = () => {
  const [loading, setLoading] = useState(true);
  const [logStatus, setLogStatus] = useState("Initializing...");

  useEffect(() => {
    const startLWC = async () => {
      try {
        console.log("LOG [1]: Requesting session from Vercel API...");
        const response = await fetch("/api/get-url");
        const result = await response.json();
        console.log("LOG [2]: API Result received:", result);

        if (result.success && result.url) {
          setLogStatus("Session active. Loading Salesforce scripts...");
          
          const script = document.createElement("script");
          script.src = "https://algocirrus-b6-dev-ed.develop.my.salesforce.com/lightning/lightning.out.latest/index.iife.prod.js";
          
          script.onload = () => {
            console.log("LOG [3]: index.iife.prod.js loaded successfully.");
            const loApp = document.querySelector("lightning-out-application");
            
            if (loApp) {
              console.log("LOG [4]: <lightning-out-application> found. Attaching 'ready' listener...");
              
              // Attach listener BEFORE setting the attribute
              loApp.addEventListener("ready", (event) => {
                console.log("LOG [5]: SUCCESS! 'ready' event captured.", event);
                setLoading(false);
              });

              console.log("LOG [6]: Setting frontdoor-url to trigger handshake...");
              loApp.setAttribute("frontdoor-url", result.url);
            } else {
              console.error("LOG [ERR]: <lightning-out-application> tag missing from DOM.");
              setLogStatus("Error: Container tag not found.");
            }
          };

          script.onerror = (err) => {
            console.error("LOG [ERR]: Script failed to load. Check CORS/CSP.", err);
            setLogStatus("Network Error: Could not load Salesforce script.");
          };

          document.body.appendChild(script);
        } else {
          console.error("LOG [ERR]: API returned failure status.", result);
          setLogStatus(`API Error: ${result.status || 'Unknown'}`);
