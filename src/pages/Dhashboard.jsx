// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { account } from '../lib/appwrite';

export default function Dashboard() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        account.get()
            .then(res => setUser(res))
            .catch(() => window.location.href = '/');
    }, []);

    return user ? <h1>Welcome, {user.name}</h1> : <p>Loading...</p>;
}