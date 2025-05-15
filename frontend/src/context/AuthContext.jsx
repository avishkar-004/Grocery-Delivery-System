import { createContext, useState, useEffect } from 'react';
import { loginUser, registerUser, logoutUser, getCurrentUser } from '../services/auth.service';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const checkLoggedIn = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (err) {
        console.error('Failed to get current user:', err);
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const user = await loginUser(email, password);
      setCurrentUser(user);
      return user;
    } catch (err) {
      setError(err.message || 'Failed to login');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const user = await registerUser(userData);
      setCurrentUser(user);
      return user;
    } catch (err) {
      setError(err.message || 'Failed to register');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      setCurrentUser(null);
    } catch (err) {
      setError(err.message || 'Failed to logout');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!currentUser,
    isOwner: currentUser?.role === 'owner',
    isBuyer: currentUser?.role === 'buyer',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};