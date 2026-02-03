import { useEffect, useState } from "react";

const LightningOutApp = () => {
  const [errorLog, setErrorLog] = useState("Waiting for response...");

  useEffect(() => {
    // We are calling the API directly to see the RAW HTML or Error
    fetch("/api/get-url")
      .then(async (res) => {
        const text = await res.text();
        if (!res.ok) {
          setErrorLog(`SERVER CRASHED: ${text.substring(0, 200)}...`);
        } else {
          setErrorLog(`SUCCESS: ${text}`);
        }
      })
      .catch(err => setErrorLog(`FETCH ERROR: ${err.message}`));
  }, []);

  return (
    <div style={{color: 'white', padding: '20px', background: '#333'}}>
      <h1>System Status</h1>
      <pre>{errorLog}</pre>
    </div>
  );
};

export default LightningOutApp;
