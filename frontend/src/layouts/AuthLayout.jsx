import { Outlet, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

import '../styles/auth.css';

const AuthLayout = () => {
  const { currentUser, loading } = useContext(AuthContext);

  // If user is already logged in, redirect to their respective dashboard
  if (!loading && currentUser) {
    if (currentUser.role === 'owner') {
      return <Navigate to="/owner" replace />;
    } else if (currentUser.role === 'buyer') {
      return <Navigate to="/buyer" replace />;
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="auth-content">
          <div className="auth-logo">
            <h1><span className="text-primary">Quick</span>Grocery</h1>
            <p className="auth-tagline">Fast, fresh groceries at your doorstep</p>
          </div>
          <Outlet />
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-image"></div>
      </div>
    </div>
  );
};

export default AuthLayout;