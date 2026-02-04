// src/App.jsx
import { useEffect, useState } from 'react';
import './App.css';
import { account } from './lib/appwrite';
import Login from './components/Login';
import LightningOutApp from './LightningOutApp';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if the user is logged into Appwrite via Okta
    account.get()
      .then((res) => {
        setUser(res);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '100px' }}>Checking Session...</div>;

  return (
    <>
      {!user ? (
        <Login /> 
      ) : (
        /* PASSING THE EMAIL HERE IS CRITICAL */
        <LightningOutApp userEmail={user.email} /> 
      )}
    </>
  );
}

export default App;