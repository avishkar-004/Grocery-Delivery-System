import { api, simulateApi } from './api';

// For demo purposes, use simulated API
const useSimulatedApi = true;

// Mock product data for demo
const mockProducts = [
  {
    id: 'product1',
    name: 'Organic Banana',
    description: 'Sweet and nutritious organic bananas, perfect for snacking or smoothies.',
    price: 1.99,
    category: 'Fruits',
    image: 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8YmFuYW5hfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60',
    stock: 50,
    inStock: true,
    weight: '1 kg',
    origin: 'Ecuador',
    shelfLife: '5-7 days',
    storage: 'Store at room temperature',
    createdAt: '2023-05-01T12:00:00Z',
    ownerId: 'owner1',
  },
  {
    id: 'product2',
    name: 'Fresh Milk',
    description: 'Farm-fresh whole milk, pasteurized for safety and rich in calcium.',
    price: 3.49,
    category: 'Dairy',
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fG1pbGt8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60',
    stock: 20,
    inStock: true,
    weight: '1 L',
    origin: 'Local',
    shelfLife: '7 days',
    storage: 'Keep refrigerated',
    createdAt: '2023-05-02T14:30:00Z',
    ownerId: 'owner1',
  },
  {
    id: 'product3',
    name: 'Whole Wheat Bread',
    description: 'Freshly baked whole wheat bread, made with organic flour and no preservatives.',
    price: 2.99,
    category: 'Bakery',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YnJlYWR8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60',
    stock: 15,
    inStock: true,
    weight: '500g',
    origin: 'Local Bakery',
    shelfLife: '3 days',
    storage: 'Store in a cool, dry place',
    createdAt: '2023-05-03T09:15:00Z',
    ownerId: 'owner1',
  },
  {
    id: 'product4',
    name: 'Free Range Eggs',
    description: 'Farm-fresh free-range eggs from hens raised on open pastures.',
    price: 4.99,
    category: 'Dairy',
    image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZWdnc3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60',
    stock: 30,
    inStock: true,
    weight: '12 eggs',
    origin: 'Local Farm',
    shelfLife: '14 days',
    storage: 'Keep refrigerated',
    createdAt: '2023-05-04T11:45:00Z',
    ownerId: 'owner1',
  },
  {
    id: 'product5',
    name: 'Organic Spinach',
    description: 'Fresh organic spinach, washed and ready to eat. Rich in iron and vitamins.',
    price: 2.49,
    category: 'Vegetables',
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c3BpbmFjaHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60',
    stock: 25,
    inStock: true,
    weight: '200g',
    origin: 'Local Farm',
    shelfLife: '3-5 days',
    storage: 'Keep refrigerated',
    createdAt: '2023-05-05T15:20:00Z',
    ownerId: 'owner1',
  },
  {
    id: 'product6',
    name: 'Chicken Breast',
    description: 'Boneless, skinless chicken breast from free-range chickens. High in protein.',
    price: 8.99,
    category: 'Meat',
    image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8Y2hpY2tlbiUyMGJyZWFzdHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60',
    stock: 10,
    inStock: true,
    weight: '500g',
    origin: 'Local Farm',
    shelfLife: '2-3 days',
    storage: 'Keep refrigerated',
    createdAt: '2023-05-06T10:30:00Z',
    ownerId: 'owner1',
  },
];

// Mock categories data for demo
const mockCategories = [
  'Fruits',
  'Vegetables',
  'Dairy',
  'Bakery',
  'Meat',
  'Seafood',
  'Beverages',
  'Snacks',
  'Canned Goods',
  'Frozen Foods',
];

/**
 * Get all products
 * @returns {Promise<Array>} Products list
 */
export const getProducts = async () => {
  if (useSimulatedApi) {
    return simulateApi.get('/products', mockProducts);
  }
  
  return api.get('/products');
};

/**
 * Get products by category
 * @param {string} category - Category name
 * @returns {Promise<Array>} Products list
 */
export const getProductsByCategory = async (category) => {
  if (useSimulatedApi) {
    const filteredProducts = mockProducts.filter(p => p.category === category);
    return simulateApi.get(`/products?category=${category}`, filteredProducts);
  }
  
  return api.get(`/products?category=${category}`);
};

/**
 * Get products by owner
 * @returns {Promise<Array>} Products list
 */
export const getProductsByOwner = async () => {
  if (useSimulatedApi) {
    return simulateApi.get('/products/owner', mockProducts);
  }
  
  return api.get('/products/owner');
};

/**
 * Get product by ID
 * @param {string} id - Product ID
 * @returns {Promise<Object>} Product data
 */
export const getProductById = async (id) => {
  if (useSimulatedApi) {
    const product = mockProducts.find(p => p.id === id) || mockProducts[0];
    return simulateApi.get(`/products/${id}`, product);
  }
  
  return api.get(`/products/${id}`);
};

/**
 * Create new product
 * @param {Object} productData - Product data
 * @returns {Promise<Object>} Created product
 */
export const createProduct = async (productData) => {
  if (useSimulatedApi) {
    const newProduct = {
      id: 'product-' + Math.random().toString(36).substring(2),
      ...productData,
      createdAt: new Date().toISOString(),
      ownerId: 'owner1',
    };
    
    return simulateApi.post('/products', productData, newProduct);
  }
  
  return api.post('/products', productData);
};

/**
 * Update product
 * @param {string} id - Product ID
 * @param {Object} productData - Product data
 * @returns {Promise<Object>} Updated product
 */
export const updateProduct = async (id, productData) => {
  if (useSimulatedApi) {
    const updatedProduct = {
      id,
      ...productData,
      updatedAt: new Date().toISOString(),
    };
    
    return simulateApi.put(`/products/${id}`, productData, updatedProduct);
  }
  
  return api.put(`/products/${id}`, productData);
};

/**
 * Delete product
 * @param {string} id - Product ID
 * @returns {Promise<Object>} Success message
 */
export const deleteProduct = async (id) => {
  if (useSimulatedApi) {
    return simulateApi.delete(`/products/${id}`, { success: true });
  }
  
  return api.delete(`/products/${id}`);
};

/**
 * Get all categories
 * @returns {Promise<Array>} Categories list
 */
export const getCategories = async () => {
  if (useSimulatedApi) {
    return simulateApi.get('/categories', mockCategories);
  }
  
  return api.get('/categories');
};