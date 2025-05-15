// Base API configuration
const API_URL = 'https://api.quickgrocery.com/v1'; // This is a hypothetical API URL

// Common headers
const getHeaders = () => {
  const token = localStorage.getItem('token');
  
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// Helper to handle response
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || `Error: ${response.status} ${response.statusText}`;
    throw new Error(errorMessage);
  }
  
  return response.json();
};

// For demo purposes, simulate API delays
const simulateDelay = (data, delay = 500) => {
  return new Promise(resolve => setTimeout(() => resolve(data), delay));
};

// Generic error handler
const handleError = (error, customMessage) => {
  console.error(customMessage || 'API Error:', error);
  throw error;
};

export const api = {
  get: async (endpoint) => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: getHeaders(),
      });
      
      return handleResponse(response);
    } catch (error) {
      handleError(error, `GET request failed: ${endpoint}`);
    }
  },
  
  post: async (endpoint, data) => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      
      return handleResponse(response);
    } catch (error) {
      handleError(error, `POST request failed: ${endpoint}`);
    }
  },
  
  put: async (endpoint, data) => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      
      return handleResponse(response);
    } catch (error) {
      handleError(error, `PUT request failed: ${endpoint}`);
    }
  },
  
  delete: async (endpoint) => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      
      return handleResponse(response);
    } catch (error) {
      handleError(error, `DELETE request failed: ${endpoint}`);
    }
  },
};

// For demo purposes, simulate API responses with mock data
export const simulateApi = {
  get: (endpoint, mockData) => simulateDelay(mockData),
  post: (endpoint, data, mockResponse) => simulateDelay(mockResponse || data),
  put: (endpoint, data, mockResponse) => simulateDelay(mockResponse || data),
  delete: (endpoint, mockResponse) => simulateDelay(mockResponse || { success: true }),
};