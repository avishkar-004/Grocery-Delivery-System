// ========================================
// SELLER API SERVICE
// Handles all seller-related API calls
// ========================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class SellerAPIService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth token from localStorage
  getAuthToken() {
    return localStorage.getItem('seller_token');
  }

  // Create headers with auth token
  getHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Generic API request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // ========================================
  // ORDER MANAGEMENT APIs
  // ========================================

  // Get available orders for quotations
  async getAvailableOrders(params = {}) {
    const queryParams = new URLSearchParams({
      max_distance: params.maxDistance || 1,
      page: params.page || 1,
      limit: params.limit || 10
    });

    return this.request(`/seller/orders/available?${queryParams}`);
  }

  // Filter orders with advanced criteria
  async filterOrders(filters = {}) {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    return this.request(`/seller/orders/filter?${queryParams}`);
  }
  

  // Get detailed order information
  async getOrderDetails(orderId) {
    return this.request(`/seller/orders/${orderId}/details`);
  }

  // Get accepted orders
  async getAcceptedOrders(params = {}) {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10
    });

    return this.request(`/seller/orders/accepted?${queryParams}`);
  }

  // Mark order as complete
  async completeOrder(orderId) {
    return this.request(`/seller/orders/${orderId}/complete`, {
      method: 'PUT'
    });
  }

  // Get order history
  async getOrderHistory(filters = {}) {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    return this.request(`/seller/orders/history?${queryParams}`);
  }

  // ========================================
  // QUOTATION MANAGEMENT APIs
  // ========================================

  // Create new quotation
  async createQuotation(quotationData) {
    return this.request('/seller/quotations/create', {
      method: 'POST',
      body: JSON.stringify(quotationData)
    });
  }

  // Get seller's quotations
  async getMyQuotations(params = {}) {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    return this.request(`/seller/quotations/my-quotations?${queryParams}`);
  }

  // **FIXED/ADDED: Get quotation details**
  async getQuotationDetails(quotationId) {
    return this.request(`/seller/quotations/${quotationId}/details`);
  }

  // Edit existing quotation
  async editQuotation(quotationId, quotationData) {
    return this.request(`/seller/quotations/${quotationId}/edit`, {
      method: 'PUT',
      body: JSON.stringify(quotationData)
    });
  }

  // Cancel quotation
  async cancelQuotation(quotationId) {
    return this.request(`/seller/quotations/${quotationId}/cancel`, {
      method: 'DELETE'
    });
  }

  // ========================================
  // ANALYTICS APIs
  // ========================================

  // Get dashboard analytics
  async getDashboardAnalytics() {
    return this.request('/seller/analytics/dashboard');
  }

  // Get sales analytics
  async getSalesAnalytics(params = {}) {
    const queryParams = new URLSearchParams({
      period: params.period || 'monthly',
      year: params.year || new Date().getFullYear()
    });

    return this.request(`/seller/analytics/sales?${queryParams}`);
  }

  // Get product performance analytics
  async getProductAnalytics() {
    return this.request('/seller/analytics/products');
  }

  // Get custom range analytics
  async getCustomRangeAnalytics(startDate, endDate) {
    const queryParams = new URLSearchParams({
      start_date: startDate,
      end_date: endDate
    });

    return this.request(`/seller/analytics/custom-range?${queryParams}`);
  }
}

// Create singleton instance
const sellerAPI = new SellerAPIService();

export default sellerAPI;