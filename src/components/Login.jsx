import { account } from '../lib/appwrite';

const Login = () => {
    const handleOktaLogin = () => {
        // This will redirect to Okta, then back to your React app
        account.createOAuth2Session('okta', window.location.origin);
    };

    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>Enterprise Portal</h2>
            <button onClick={handleOktaLogin}>Login with Okta SSO</button>
        </div>
    );
};

export default Login;