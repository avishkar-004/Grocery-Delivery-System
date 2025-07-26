import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for routing
import BuyerDashboardNavbar from './BuyerDashboardNavbar'; // This should be the path to your navbar component

// Base URL for your backend API
const API_BASE_URL = 'http://localhost:3000'; // Replace with your actual backend URL

// Helper function to get the correct emoji for a category
const getCategoryDisplay = (category) => {
  if (category.icon) {
    return category.icon;
  }
  return '📦'; // Fallback to a generic emoji
};

const BuyerDashboard = () => {
  const navigate = useNavigate(); // Initialize useNavigate hook

  // State for categories
  const [categories, setCategories] = useState([]);
  // State for products
  const [products, setProducts] = useState([]);
  // State for cart items
  const [cartItems, setCartItems] = useState([]);
  // State for selected category filter
  const [selectedCategory, setSelectedCategory] = useState(null);
  // State for search query
  const [searchQuery, setSearchQuery] = useState('');
  // Loading state for API calls
  const [loading, setLoading] = useState(true);
  // Error state for API calls
  const [error, setError] = useState(null);

  // Pagination states for products
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20); // Matches backend default limit

  // State for theme, initialized from local storage
  const [theme, setTheme] = useState(() => {
    const savedMode = localStorage.getItem('theme');
    return savedMode || 'light';
  });

  // State for buyer token and user, initialized from local storage
  const [buyerToken, setBuyerToken] = useState(() => localStorage.getItem('buyer_token'));
  const [buyerUser, setBuyerUser] = useState(() => {
    const savedUser = localStorage.getItem('buyer_user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error("Failed to parse buyer_user from localStorage", e);
      return null;
    }
  });

  // New state to manage active product card for showing details
  const [activeProductId, setActiveProductId] = useState(null);

  // CART TOGGLE STATE - START WITH CART OPEN
  const [isCartOpen, setIsCartOpen] = useState(true);

  // Ref for scrolling to the products section (still useful if we want to scroll *within* the product section later)
  const productsSectionRef = useRef(null);
  // Ref for the main content container to ensure sticky cart works
  const mainContentRef = useRef(null);
  // Ref to store the product card being clicked for outside click detection
  const productCardRefs = useRef({});


  // Effect to apply theme class to document HTML element and save to local storage
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Function to toggle between light and dark themes
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Function to get authorization headers for API calls
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('buyer_token');
    if (token) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };
    }
    return { 'Content-Type': 'application/json' };
  }, []);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/categories`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setCategories([{ id: null, name: 'All', icon: '🛒' }, ...data.data]);
      } else {
        setError(data.message || 'Failed to fetch categories');
      }
    } catch (err) {
      console.error('Fetch categories error:', err);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch products based on category or search query with pagination
  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_BASE_URL}/api/products/search?page=${page}&limit=${itemsPerPage}`;
      if (searchQuery) {
        url += `&q=${encodeURIComponent(searchQuery)}`;
      }
      if (selectedCategory !== null) {
        url += `&category=${selectedCategory}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setProducts(data.data.products.map(p => ({
          ...p,
          // Initialize selected quantity and notes for each product
          selectedQuantityId: p.quantities && p.quantities.length > 0 ? p.quantities[0].id : null,
          requestedQuantity: 1,
          notes: ''
        })));
        setCurrentPage(data.data.pagination.currentPage);
        setTotalPages(data.data.pagination.totalPages);
        setItemsPerPage(data.data.pagination.itemsPerPage);
        // Scroll to the very top of the page after new products are loaded
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(data.message || 'Failed to fetch products');
      }
    } catch (err) {
      console.error('Fetch products error:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, itemsPerPage]);

  // Fetch cart items
  const fetchCartItems = useCallback(async () => {
    const token = localStorage.getItem('buyer_token');
    if (!token) {
      setCartItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('buyer_token');
          localStorage.removeItem('buyer_user');
          setBuyerToken(null);
          setBuyerUser(null);
          alert('Session expired or unauthorized. Please log in again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        // --- START OF MODIFICATION FOR CART ORDER ---
        setCartItems(prevItems => {
          const newItems = data.data.items; // Items received from the backend

          // Create a Map for quick lookup of new items by their cart_item_id
          const newItemsMap = new Map(newItems.map(item => [item.cart_item_id, item]));

          const updatedCart = [];
          const processedNewItemIds = new Set(); // To keep track of new items already added

          // 1. Preserve order for existing items and update their details
          for (const prevItem of prevItems) {
            if (newItemsMap.has(prevItem.cart_item_id)) {
              // Item exists in both previous and new data, add the updated version
              updatedCart.push(newItemsMap.get(prevItem.cart_item_id));
              processedNewItemIds.add(prevItem.cart_item_id); // Mark as processed
            }
            // If prevItem is not in newItemsMap, it means it was removed from cart
            // We simply skip it, effectively removing it from the UI.
          }

          // 2. Append any truly new items (that weren't in prevItems)
          for (const newItem of newItems) {
            if (!processedNewItemIds.has(newItem.cart_item_id)) {
              // This is a new item that wasn't in the previous cart or wasn't processed yet
              updatedCart.push(newItem);
            }
          }

          // Fallback for initial load or if prevItems was empty (e.g., cart was just cleared)
          // or if, for some reason, the merging logic resulted in an empty array but new data exists.
          if (prevItems.length === 0 || updatedCart.length === 0) {
            return newItems; // Use the backend's order directly for the first load or if cart becomes empty
          }

          return updatedCart;
        });
        // --- END OF MODIFICATION FOR CART ORDER ---
      } else {
        setError(data.message || 'Failed to fetch cart items');
      }
    } catch (err) {
      console.error('Fetch cart items error:', err);
      setError('Failed to load cart. Please log in or try again.');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  // Handle product-specific quantity/notes changes
  const handleProductChange = (productId, field, value) => {
    setProducts(prevProducts =>
        prevProducts.map(p =>
            p.id === productId ? { ...p, [field]: value } : p
        )
    );
  };

  // Add item to cart
  const handleAddToCart = async (product) => {
    const token = localStorage.getItem('buyer_token');
    if (!token) {
      alert('Please log in to add items to your cart.');
      return;
    }
    if (!product.selectedQuantityId) {
      alert('Please select a quantity option for the product.');
      return;
    }
    if (product.requestedQuantity < 1) {
      alert('Quantity must be at least 1.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/add`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          product_id: product.id,
          quantity_id: product.selectedQuantityId,
          requested_quantity: product.requestedQuantity,
          notes: product.notes || null
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        fetchCartItems();
      } else {
        setError(data.message || 'Failed to add item to cart');
      }
    } catch (err) {
      console.error('Add to cart error:', err);
      setError('Failed to add item to cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update cart item quantity
  const handleUpdateCartItem = async (cartItemId, newQuantity) => {
    const token = localStorage.getItem('buyer_token');
    if (!token || newQuantity < 1) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/update/${cartItemId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ requested_quantity: newQuantity }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        fetchCartItems();
      } else {
        setError(data.message || 'Failed to update cart item');
      }
    } catch (err) {
      console.error('Update cart item error:', err);
      setError('Failed to update cart item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Remove item from cart
  const handleRemoveFromCart = async (cartItemId) => {
    const token = localStorage.getItem('buyer_token');
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/remove/${cartItemId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        fetchCartItems();
      } else {
        setError(data.message || 'Failed to remove item from cart');
      }
    } catch (err) {
      console.error('Remove from cart error:', err);
      setError('Failed to remove item from cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Clear entire cart
  const handleClearCart = async () => {
    const token = localStorage.getItem('buyer_token');
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/clear`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        fetchCartItems();
      } else {
        setError(data.message || 'Failed to clear cart');
      }
    } catch (err) {
      console.error('Clear cart error:', err);
      setError('Failed to clear cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle product card click to open details (only set, not toggle)
  const handleCardClick = (productId) => {
    setActiveProductId(productId); // Always set the clicked product as active
  };

  // Effect to handle clicks outside the active product card
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if there's an active product card and if the click happened outside its ref
      if (activeProductId && productCardRefs.current[activeProductId] &&
          !productCardRefs.current[activeProductId].contains(event.target)) {
        setActiveProductId(null); // Close the card
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeProductId]);


  // Initial data fetch on component mount
  useEffect(() => {
    fetchCategories();
    fetchProducts(1);
    fetchCartItems();
  }, [fetchCategories, fetchProducts, fetchCartItems]);

  // Handle category selection
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setSearchQuery('');
    setCurrentPage(1);
    fetchProducts(1);
  };

  // Handle search input change
  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
    setSelectedCategory(null);
  };

  // Handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts(1);
  };

  // Handle pagination clicks
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchProducts(newPage);
    }
  };

  return (
      <div className={`min-h-screen font-inter transition-colors duration-300 ${
          theme === 'light' ? 'bg-gradient-to-br from-green-50 to-green-200 text-gray-900' : 'bg-gray-900 text-gray-100'
      }`}>
        <BuyerDashboardNavbar
            theme={theme}
            toggleTheme={toggleTheme}
            buyerUser={buyerUser}
            cartItemCount={cartItems.length}
        />

        {/* FLOATING CART BUTTON - LEFT SIDE - ONLY WHEN CART CLOSED */}
        {!isCartOpen && (
            <button
                onClick={() => setIsCartOpen(true)}
                className="fixed right-4 top-[30%] z-[9999]
               bg-green-500 hover:bg-green-600 text-white rounded-full
               w-16 h-16 shadow-lg flex items-center justify-center
               transition-all duration-300 ease-in-out hover:scale-110
               text-2xl font-bold"
            >
              🛒
              {cartItems.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white
                       rounded-full w-7 h-7 text-sm flex items-center justify-center
                       font-bold animate-pulse">
        {cartItems.length}
      </span>
              )}
            </button>
        )}




        <div ref={mainContentRef} className="container mx-auto p-4 flex flex-col lg:flex-row gap-6">
          {/* MAIN CONTENT - DYNAMIC WIDTH BASED ON CART STATE */}
          <div className={`${isCartOpen ? 'lg:w-2/3' : 'w-full'} flex-grow transition-all duration-300 ease-in-out`}>
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="mb-6 flex items-center bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <input
                  type="text"
                  placeholder="Search for food items, vendors, categories..."
                  className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-100"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
              />
              <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-r-lg transition duration-300 ease-in-out"
              >
                Search
              </button>
            </form>

            {/* Shop by Categories */}
            <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-green-700 dark:text-green-400">Shop by Categories</h2>
              {loading && !categories.length ? (
                  <p>Loading categories...</p>
              ) : error ? (
                  <p className="text-red-500">{error}</p>
              ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
                    {categories.map((category) => (
                        <button
                            key={category.id || 'all'}
                            onClick={() => handleCategorySelect(category.id)}
                            className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition duration-300 ease-in-out
                      ${selectedCategory === category.id ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-green-400 hover:bg-gray-50 dark:hover:bg-gray-700'}
                    `}
                        >
                          {/* Display emoji from backend 'icon' field */}
                          <span className="w-10 h-10 mb-2 flex items-center justify-center text-2xl" role="img" aria-label={category.name}>
                      {getCategoryDisplay(category)}
                    </span>
                          {/* Added overflow classes for text truncation */}
                          <span className="text-xs text-center font-medium mt-1 whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                      {category.name}
                    </span>
                        </button>
                    ))}
                  </div>
              )}
            </div>

            {/* Fresh Products Near You */}
            <div ref={productsSectionRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-green-700 dark:text-green-400">Fresh Products Near You</h2>
              {loading && !products.length ? (
                  <p>Loading products...</p>
              ) : error ? (
                  <p className="text-red-500">{error}</p>
              ) : products.length === 0 ? (
                  <p>No products found for the selected category or search.</p>
              ) : (
                  <div className={`grid grid-cols-1 sm:grid-cols-2 ${isCartOpen ? 'lg:grid-cols-3' : 'lg:grid-cols-4 xl:grid-cols-5'} gap-6 transition-all duration-300`}>
                    {products.map((product) => (
                        <div
                            key={product.id}
                            ref={el => productCardRefs.current[product.id] = el}
                            onClick={() => handleCardClick(product.id)} // This will now only set the activeProductId, not toggle
                            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 ease-in-out dark:hover:shadow-green-500/30 relative flex flex-col cursor-pointer"
                        >
                          {/* Highlight Effect on Click */}
                          <div className={`absolute inset-0 bg-gradient-to-br from-transparent via-green-200/10 to-transparent transition-opacity duration-500 pointer-events-none ${activeProductId === product.id ? 'opacity-100' : 'opacity-0'}`}></div>

                          {/* Image and Basic Info */}
                          <img
                              src={product.image || `https://placehold.co/300x200/F0FDF4/15803D?text=Product+Image`}
                              alt={product.name}
                              className="w-full h-40 object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://placehold.co/300x200/F0FDF4/15803D?text=Product+Image`;
                              }}
                          />
                          <div className="p-4">
                            <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">{product.description}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Category: {product.category_name}</p>
                          </div>

                          {/* Details on Click */}
                          {activeProductId === product.id && ( // Conditionally render based on activeProductId
                              <div className="p-4 pt-0 flex flex-col gap-3 transition-all duration-500 ease-in-out opacity-100">

                                {/* Quantity Dropdown */}
                                {product.quantities && product.quantities.length > 0 ? (
                                    <div>
                                      <label htmlFor={`quantity-select-${product.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Select quantity:
                                      </label>
                                      <select
                                          id={`quantity-select-${product.id}`}
                                          value={product.selectedQuantityId || ''}
                                          onChange={(e) => handleProductChange(product.id, 'selectedQuantityId', parseInt(e.target.value))}
                                          onClick={(e) => e.stopPropagation()} // Stop propagation for clicks on the select
                                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                      >
                                        {product.quantities.map((pq) => (
                                            <option key={pq.id} value={pq.id}>
                                              {pq.quantity} {pq.unit_type}
                                            </option>
                                        ))}
                                      </select>
                                    </div>
                                ) : (
                                    <p className="text-sm text-red-500">No quantities available</p>
                                )}

                                {/* Quantity Needed */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Quantity needed:
                                  </label>
                                  <div className="flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded-md">
                                    <button
                                        onClick={(e) => {
                                          e.stopPropagation(); // Prevent closing card
                                          handleProductChange(product.id, 'requestedQuantity', Math.max(1, product.requestedQuantity - 1));
                                        }}
                                        disabled={product.requestedQuantity <= 1 || !product.selectedQuantityId}
                                        className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-md disabled:opacity-50"
                                    >
                                      −
                                    </button>
                                    <input
                                        type="number"
                                        value={product.requestedQuantity}
                                        onChange={(e) => handleProductChange(product.id, 'requestedQuantity', parseInt(e.target.value) || 1)}
                                        onClick={(e) => e.stopPropagation()} // Stop propagation for clicks on the input
                                        className="w-16 text-center border-x border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        min="1"
                                        disabled={!product.selectedQuantityId}
                                    />
                                    <button
                                        onClick={(e) => {
                                          e.stopPropagation(); // Prevent closing card
                                          handleProductChange(product.id, 'requestedQuantity', product.requestedQuantity + 1);
                                        }}
                                        disabled={!product.selectedQuantityId}
                                        className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-md disabled:opacity-50"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>

                                {/* Special Notes */}
                                <div>
                                  <label htmlFor={`notes-${product.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Special notes (optional):
                                  </label>
                                  <textarea
                                      id={`notes-${product.id}`}
                                      placeholder="Add notes for this product"
                                      value={product.notes}
                                      onChange={(e) => handleProductChange(product.id, 'notes', e.target.value)}
                                      onClick={(e) => e.stopPropagation()} // Stop propagation for clicks on the textarea
                                      rows="2"
                                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                                      disabled={!product.selectedQuantityId}
                                  ></textarea>
                                </div>

                                {/* Add to Cart Button */}
                                <button
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent card click from propagating when clicking add to cart
                                      handleAddToCart(product);
                                    }}
                                    className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-md transition-all duration-300 ease-in-out hover:scale-105 disabled:opacity-50"
                                    disabled={!product.selectedQuantityId || product.requestedQuantity < 1 || loading}
                                >
                                  {loading ? (
                                      <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            Adding...
          </span>
                                  ) : (
                                      '🛒 Add to Cart'
                                  )}
                                </button>
                              </div>
                          )}
                        </div>
                    ))}

                  </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                  <div className="flex justify-center items-center mt-6 space-x-4">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1 || loading}
                        className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-gray-700 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages || loading}
                        className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
              )}
            </div>
          </div>

          {/* SHOPPING CART - ONLY SHOW WHEN isCartOpen IS TRUE */}
          {isCartOpen && (
              <div className="w-full lg:w-1/3 sticky top-28 h-fit self-start">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 pt-4">
                  {/* CART HEADER WITH CLOSE BUTTON */}
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-green-700 dark:text-green-400">
                      Shopping Cart
                    </h2>
                    <button
                        onClick={() => setIsCartOpen(false)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
                               p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700
                               transition-all duration-200 text-xl font-bold"
                        aria-label="Close cart"
                        title="Close cart"
                    >
                      ✕
                    </button>
                  </div>

                  {loading && !cartItems.length ? (
                      <p>Loading cart...</p>
                  ) : error ? (
                      <p className="text-red-500">{error}</p>
                  ) : cartItems.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400">Your cart is empty.</p>
                  ) : (
                      <>
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                          {cartItems.map((item) => (
                              <div key={item.cart_item_id} className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                                <div>
                                  <p className="font-medium">{item.product_name}</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {item.quantity_value} {item.quantity_unit}
                                  </p>
                                  {item.notes && (
                                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Notes: {item.notes}</p>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                      onClick={() => handleUpdateCartItem(item.cart_item_id, item.requested_quantity - 1)}
                                      disabled={item.requested_quantity <= 1}
                                      className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                                  >
                                    −
                                  </button>
                                  <span className="font-bold">{item.requested_quantity}</span>
                                  <button
                                      onClick={() => handleUpdateCartItem(item.cart_item_id, item.requested_quantity + 1)}
                                      className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                  >
                                    +
                                  </button>
                                  <button
                                      onClick={() => handleRemoveFromCart(item.cart_item_id)}
                                      className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                      aria-label="Remove item"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                          ))}
                        </div>
                        <div className="mt-6 space-y-3">
                          <button
                              onClick={handleClearCart}
                              className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400"
                          >
                            Clear Cart
                          </button>
                          <button
                              onClick={() => navigate('/buyer/cart')}
                              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out"
                          >
                            Proceed to Order »
                          </button>
                        </div>
                      </>
                  )}
                </div>
              </div>
          )}
        </div>
      </div>
  );
};

export default BuyerDashboard;