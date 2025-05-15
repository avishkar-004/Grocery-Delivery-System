import { api, simulateApi } from './api';

// For demo purposes, use simulated API
const useSimulatedApi = true;

// Mock user data for demo
const mockUsers = [
  {
    id: 'buyer1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    role: 'buyer',
  },
  {
    id: 'owner1',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '0987654321',
    role: 'owner',
  },
];

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User data with token
 */
export const loginUser = async (email, password) => {
  if (useSimulatedApi) {
    // For demo, accept any email/password combination
    // In a real app, this would validate credentials
    const user = mockUsers.find(u => u.email === email) || mockUsers[0];
    
    const mockResponse = {
      ...user,
      token: 'mock-token-' + Math.random().toString(36).substring(2),
    };
    
    // Save token to localStorage
    localStorage.setItem('token', mockResponse.token);
    
    return simulateApi.post('/auth/login', { email, password }, mockResponse);
  }
  
  const response = await api.post('/auth/login', { email, password });
  
  // Save token to localStorage
  if (response.token) {
    localStorage.setItem('token', response.token);
  }
  
  return response;
};

/**
 * Register new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} User data with token
 */
export const registerUser = async (userData) => {
  if (useSimulatedApi) {
    const mockResponse = {
      id: 'user-' + Math.random().toString(36).substring(2),
      ...userData,
      token: 'mock-token-' + Math.random().toString(36).substring(2),
    };
    
    // Save token to localStorage
    localStorage.setItem('token', mockResponse.token);
    
    return simulateApi.post('/auth/register', userData, mockResponse);
  }
  
  const response = await api.post('/auth/register', userData);
  
  // Save token to localStorage
  if (response.token) {
    localStorage.setItem('token', response.token);
  }
  
  return response;
};

/**
 * Logout user
 * @returns {Promise<Object>} Success message
 */
export const logoutUser = async () => {
  // Remove token from localStorage
  localStorage.removeItem('token');
  
  if (useSimulatedApi) {
    return simulateApi.post('/auth/logout', {}, { success: true });
  }
  
  return api.post('/auth/logout');
};

/**
 * Get current user from token
 * @returns {Promise<Object>} User data
 */
export const getCurrentUser = async () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return null;
  }
  
  if (useSimulatedApi) {
    // For demo, extract user role from token
    const isOwner = token.includes('owner') || Math.random() > 0.5;
    const mockUser = mockUsers[isOwner ? 1 : 0];
    
    return simulateApi.get('/auth/me', mockUser);
  }
  
  return api.get('/auth/me');
};

/**
 * Update user profile
 * @param {Object} userData - User profile data
 * @returns {Promise<Object>} Updated user data
 */
export const updateProfile = async (userData) => {
  if (useSimulatedApi) {
    return simulateApi.put('/auth/profile', userData);
  }
  
  return api.put('/auth/profile', userData);
};

/**
 * Change user password
 * @param {Object} passwordData - Password data
 * @returns {Promise<Object>} Success message
 */
export const changePassword = async (passwordData) => {
  if (useSimulatedApi) {
    return simulateApi.put('/auth/password', passwordData, { success: true });
  }
  
  return api.put('/auth/password', passwordData);
};