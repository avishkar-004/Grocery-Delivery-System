import { api, simulateApi } from './api';

// For demo purposes, use simulated API
const useSimulatedApi = true;

// Mock orders data for demo
const mockOrders = [
  {
    id: 'order1',
    items: [
      {
        id: 'product1',
        name: 'Organic Banana',
        price: 1.99,
        quantity: 2,
        image: 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8YmFuYW5hfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60',
        category: 'Fruits',
      },
      {
        id: 'product2',
        name: 'Fresh Milk',
        price: 3.49,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fG1pbGt8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60',
        category: 'Dairy',
      },
    ],
    totalAmount: 7.47,
    status: 'Delivered',
    createdAt: '2023-05-01T14:30:00Z',
    deliveredAt: '2023-05-01T15:30:00Z',
    paymentMethod: 'Card',
    address: {
      addressLine1: '123 Main St',
      addressLine2: 'Apt 4B',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
    },
    buyerId: 'buyer1',
    shopOwner: {
      id: 'owner1',
      name: 'Fresh Grocers',
      rating: 4.8,
      reviewCount: 120,
    },
  },
  {
    id: 'order2',
    items: [
      {
        id: 'product3',
        name: 'Whole Wheat Bread',
        price: 2.99,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YnJlYWR8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60',
        category: 'Bakery',
      },
      {
        id: 'product4',
        name: 'Free Range Eggs',
        price: 4.99,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZWdnc3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60',
        category: 'Dairy',
      },
      {
        id: 'product5',
        name: 'Organic Spinach',
        price: 2.49,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c3BpbmFjaHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60',
        category: 'Vegetables',
      },
    ],
    totalAmount: 10.47,
    status: 'Delivered',
    createdAt: '2023-05-03T12:15:00Z',
    deliveredAt: '2023-05-03T13:20:00Z',
    paymentMethod: 'Cash',
    address: {
      addressLine1: '456 Park Ave',
      addressLine2: 'Floor 8',
      city: 'New York',
      state: 'NY',
      zipCode: '10022',
    },
    buyerId: 'buyer1',
    shopOwner: {
      id: 'owner1',
      name: 'Fresh Grocers',
      rating: 4.8,
      reviewCount: 120,
    },
  },
  {
    id: 'order3',
    items: [
      {
        id: 'product6',
        name: 'Chicken Breast',
        price: 8.99,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8Y2hpY2tlbiUyMGJyZWFzdHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60',
        category: 'Meat',
      },
    ],
    totalAmount: 8.99,
    status: 'Placed',
    createdAt: '2023-05-10T10:00:00Z',
    paymentMethod: 'Card',
    address: {
      addressLine1: '789 Broadway',
      addressLine2: '',
      city: 'New York',
      state: 'NY',
      zipCode: '10003',
    },
    buyerId: 'buyer1',
  },
];

/**
 * Create a new order
 * @param {Object} orderData - Order data
 * @returns {Promise<Object>} Created order
 */
export const createNewOrder = async (orderData) => {
  if (useSimulatedApi) {
    const newOrder = {
      id: 'order-' + Math.random().toString(36).substring(2),
      ...orderData,
      status: 'Placed',
      createdAt: new Date().toISOString(),
      buyerId: 'buyer1',
    };
    
    return simulateApi.post('/orders', orderData, newOrder);
  }
  
  return api.post('/orders', orderData);
};

/**
 * Get all orders for current user
 * @returns {Promise<Array>} Orders list
 */
export const getOrders = async () => {
  if (useSimulatedApi) {
    return simulateApi.get('/orders', mockOrders);
  }
  
  return api.get('/orders');
};

/**
 * Get order by ID
 * @param {string} id - Order ID
 * @returns {Promise<Object>} Order data
 */
export const getOrderById = async (id) => {
  if (useSimulatedApi) {
    const order = mockOrders.find(o => o.id === id) || mockOrders[0];
    return simulateApi.get(`/orders/${id}`, order);
  }
  
  return api.get(`/orders/${id}`);
};

/**
 * Get nearby orders for shop owner
 * @param {number} radius - Radius in kilometers
 * @returns {Promise<Array>} Orders list
 */
export const getNearbyOrders = async (radius = 10) => {
  if (useSimulatedApi) {
    // For demo, filter orders with status 'Placed'
    const nearbyOrders = mockOrders.filter(o => o.status === 'Placed');
    return simulateApi.get(`/orders/nearby?radius=${radius}`, nearbyOrders);
  }
  
  return api.get(`/orders/nearby?radius=${radius}`);
};

/**
 * Accept an order (for shop owners)
 * @param {string} id - Order ID
 * @returns {Promise<Object>} Updated order
 */
export const acceptOrder = async (id) => {
  if (useSimulatedApi) {
    const order = mockOrders.find(o => o.id === id) || mockOrders[0];
    const updatedOrder = {
      ...order,
      status: 'Accepted',
      shopOwner: {
        id: 'owner1',
        name: 'Fresh Grocers',
        rating: 4.8,
        reviewCount: 120,
      },
    };
    
    return simulateApi.put(`/orders/${id}/accept`, {}, updatedOrder);
  }
  
  return api.put(`/orders/${id}/accept`);
};

/**
 * Update order status
 * @param {string} id - Order ID
 * @param {string} status - New status
 * @returns {Promise<Object>} Updated order
 */
export const updateOrderStatus = async (id, status) => {
  if (useSimulatedApi) {
    const order = mockOrders.find(o => o.id === id) || mockOrders[0];
    const updatedOrder = {
      ...order,
      status,
      ...(status === 'Delivered' ? { deliveredAt: new Date().toISOString() } : {}),
    };
    
    return simulateApi.put(`/orders/${id}/status`, { status }, updatedOrder);
  }
  
  return api.put(`/orders/${id}/status`, { status });
};

/**
 * Cancel an order
 * @param {string} id - Order ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<Object>} Updated order
 */
export const cancelOrder = async (id, reason) => {
  if (useSimulatedApi) {
    const order = mockOrders.find(o => o.id === id) || mockOrders[0];
    const updatedOrder = {
      ...order,
      status: 'Cancelled',
      cancellationReason: reason,
      cancelledAt: new Date().toISOString(),
    };
    
    return simulateApi.put(`/orders/${id}/cancel`, { reason }, updatedOrder);
  }
  
  return api.put(`/orders/${id}/cancel`, { reason });
};