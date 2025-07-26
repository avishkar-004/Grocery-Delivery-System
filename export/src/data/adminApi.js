// services/adminApi.js
// Centralized API service for admin operations

const API_BASE_URL = 'http://localhost:3000/api';

class AdminApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    // Get auth token from localStorage
    getAuthToken() {
        return localStorage.getItem('admin_token');
    }

    // Set auth token in localStorage
    setAuthToken(token) {
        localStorage.setItem('auth_token', token);
    }

    // Remove auth token
    removeAuthToken() {
        localStorage.removeItem('auth_token');
    }

    // Generic API call method
    async apiCall(endpoint, options = {}) {
        const token = this.getAuthToken();

        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers,
            },
        };

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, config);

            if (!response.ok) {
                // Handle different error status codes
                if (response.status === 401) {
                    this.removeAuthToken();
                    window.location.href = '/login';
                    throw new Error('Authentication failed. Please login again.');
                }

                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API call failed for ${endpoint}:`, error);
            throw error;
        }
    }

    // ========================================
    // AUTH METHODS
    // ========================================

    async login(email, password, role = 'admin') {
        const response = await this.apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password, role })
        });

        if (response.success && response.data.token) {
            this.setAuthToken(response.data.token);
        }

        return response;
    }

    async logout() {
        try {
            await this.apiCall('/auth/logout', { method: 'POST' });
        } catch (error) {
            console.warn('Logout API call failed:', error);
        } finally {
            this.removeAuthToken();
        }
    }

    // ========================================
    // USER MANAGEMENT METHODS
    // ========================================

    async getBuyers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.apiCall(`/admin/users/buyers${queryString ? `?${queryString}` : ''}`);
    }

    async getSellers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.apiCall(`/admin/users/sellers${queryString ? `?${queryString}` : ''}`);
    }

    async getAdmins() {
        return this.apiCall('/admin/users/admins');
    }

    async createAdmin(adminData) {
        return this.apiCall('/admin/create-admin', {
            method: 'POST',
            body: JSON.stringify(adminData)
        });
    }

    async suspendUser(userId) {
        return this.apiCall(`/admin/users/${userId}/suspend`, {
            method: 'PUT'
        });
    }

    async activateUser(userId) {
        return this.apiCall(`/admin/users/${userId}/activate`, {
            method: 'PUT'
        });
    }

    async removeUser(userId) {
        return this.apiCall(`/admin/users/${userId}/remove`, {
            method: 'DELETE'
        });
    }

    // ========================================
    // PRODUCT MANAGEMENT METHODS
    // ========================================

    async getCategories() {
        return this.apiCall('/products/categories');
    }

    async addCategory(categoryData) {
        return this.apiCall('/admin/categories/add', {
            method: 'POST',
            body: JSON.stringify(categoryData)
        });
    }

    async editCategory(categoryId, categoryData) {
        return this.apiCall(`/admin/categories/${categoryId}/edit`, {
            method: 'PUT',
            body: JSON.stringify(categoryData)
        });
    }

    async removeCategory(categoryId) {
        return this.apiCall(`/admin/categories/${categoryId}/remove`, {
            method: 'DELETE'
        });
    }

    async addProduct(productData) {
        return this.apiCall('/admin/products/add', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
    }

    async editProduct(productId, productData) {
        return this.apiCall(`/admin/products/${productId}/edit`, {
            method: 'PUT',
            body: JSON.stringify(productData)
        });
    }

    async removeProduct(productId) {
        return this.apiCall(`/admin/products/${productId}/remove`, {
            method: 'DELETE'
        });
    }

    async searchProducts(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.apiCall(`/products/search${queryString ? `?${queryString}` : ''}`);
    }

    // ========================================
    // ANALYTICS METHODS
    // ========================================

    async getBusinessMetrics() {
        return this.apiCall('/admin/analytics/business-metrics');
    }

    async getUserActivityStats() {
        return this.apiCall('/admin/analytics/active-users');
    }

    async getRevenueAnalytics(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.apiCall(`/admin/analytics/revenue${queryString ? `?${queryString}` : ''}`);
    }

    // ========================================
    // UTILITY METHODS
    // ========================================

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.getAuthToken();
    }

    // Get current user info (decode JWT token)
    getCurrentUser() {
        const token = this.getAuthToken();
        if (!token) return null;

        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Failed to decode token:', error);
            return null;
        }
    }

    // Format error message for display
    formatError(error) {
        if (error.response?.data?.message) {
            return error.response.data.message;
        }
        if (error.message) {
            return error.message;
        }
        return 'An unexpected error occurred';
    }
}

// Create singleton instance
const adminApi = new AdminApiService();

export default adminApi;

// Example usage in components:
/*
import adminApi from '@/services/adminApi';

// In your component:
const fetchUsers = async () => {
  try {
    const response = await adminApi.getBuyers({ page: 1, limit: 20 });
    setBuyers(response.data);
  } catch (error) {
    console.error('Failed to fetch buyers:', error);
    showToast(adminApi.formatError(error), 'error');
  }
};

const suspendUser = async (userId) => {
  try {
    await adminApi.suspendUser(userId);
    showToast('User suspended successfully');
    fetchUsers(); // Refresh the list
  } catch (error) {
    showToast(adminApi.formatError(error), 'error');
  }
};
*/