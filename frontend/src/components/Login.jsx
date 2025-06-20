// components/Login.jsx

import React, { useState } from 'react';

const Login = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const endpoint = isLogin ? '/login' : '/register';
            const response = await fetch(`http://localhost:5000${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                if (isLogin) {
                    onLogin(data.user);
                } else {
                    // After successful registration, switch to login
                    setIsLogin(true);
                    setError('Registration successful! Please log in.');
                    setPassword('');
                }
            } else {
                setError(data.error);
            }
        } catch (error) {
            setError('Network error. Please try again.');
            console.error('Auth error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-form">
                <h2>{isLogin ? 'Login' : 'Register'}</h2>
                {error && <div className="error-message">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    
                    <button type="submit" disabled={loading}>
                        {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
                    </button>
                </form>
                
                <p className="switch-mode">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button 
                        type="button" 
                        className="link-button"
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                            setPassword('');
                        }}
                    >
                        {isLogin ? 'Register' : 'Login'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Login;