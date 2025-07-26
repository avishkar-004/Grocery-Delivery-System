import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BuyerDashboardNavbar from './BuyerDashboardNavbar'; // Ensure this path is correct
import { Loader2, MapPin, Edit, X, PlusCircle, CheckCircle, ShoppingCart, ArrowRight, AlertTriangle } from 'lucide-react'; // Icons from lucide-react
import { motion, AnimatePresence } from 'framer-motion'; // Ensure framer-motion is installed

// Base URL for your backend API
const API_BASE_URL = 'http://localhost:3000'; // Replace with your actual backend URL

const Cart = () => {
    const navigate = useNavigate();

    // --- State Management ---
    const [currentStep, setCurrentStep] = useState(1); // 1: Review Cart, 2: Choose Address, 3: Order Summary
    const [cartItems, setCartItems] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [generalNotes, setGeneralNotes] = useState(''); // General notes for the order
    const [orderName, setOrderName] = useState(''); // User-defined order name (initialized to empty string)

    // Loading states
    const [loadingCart, setLoadingCart] = useState(true);
    const [loadingAddresses, setLoadingAddresses] = useState(true);
    const [isProcessingOrder, setIsProcessingOrder] = useState(false);
    const [addingToCartItemId, setAddingToCartItemId] = useState(null); // For individual item update loading

    const [error, setError] = useState(null);
    const [showCancelOrderModal, setShowCancelOrderModal] = useState(false); // State for the custom cancel order modal

    // Theme state (for Navbar)
    const [theme, setTheme] = useState(() => {
        const savedMode = localStorage.getItem('theme');
        return savedMode || 'light';
    });

    // Buyer user info (for Navbar)
    const [buyerUser, setBuyerUser] = useState(() => {
        const savedUser = localStorage.getItem('buyer_user');
        try {
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (e) {
            console.error("Failed to parse buyer_user from localStorage", e);
            return null;
        }
    });

    // Ref for continuous quantity change interval
    const intervalRef = useRef(null);

    // --- Utility Functions ---

    // Dummy toast function (replace with a real toast library like react-hot-toast)
    const showToast = (message, type = 'info') => {
        console.log(`Toast (${type}): ${message}`);
        // Example for a real toast library (e.g., react-hot-toast):
        // if (type === 'success') toast.success(message);
        // else if (type === 'error') toast.error(message);
        // else toast(message);
    };

    // Toggle theme (for Navbar)
    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    // Get authentication token from local storage
    const getAuthToken = useCallback(() => {
        return localStorage.getItem('buyer_token');
    }, []);

    // --- API Calls ---

    // Fetches all items currently in the user's cart
    const fetchCartItems = useCallback(async () => {
        setLoadingCart(true);
        setError(null);
        try {
            const token = getAuthToken();
            if (!token) {
                setCartItems([]);
                setLoadingCart(false);
                showToast('Please log in to view your cart.', 'info');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/cart`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                // Handle unauthorized/forbidden: clear token and redirect to login
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('buyer_token');
                    localStorage.removeItem('buyer_user');
                    showToast('Session expired or unauthorized. Please log in again.', 'error');
                    navigate('/buyer/login'); // Redirect to login page
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                setCartItems(data.data.items);
            } else {
                setError(data.message || 'Failed to fetch cart items');
                showToast(data.message || 'Failed to fetch cart items', 'error');
            }
        } catch (err) {
            console.error('Fetch cart items error:', err);
            setError('Failed to load cart. Please try again.');
            showToast('Failed to load cart. Please try again.', 'error');
        } finally {
            setLoadingCart(false);
        }
    }, [getAuthToken, navigate]); // Dependencies for useCallback

    // Fetches all addresses for the current user
    const fetchUserAddresses = useCallback(async () => {
        setLoadingAddresses(true);
        setError(null);
        try {
            const token = getAuthToken();
            if (!token) {
                setAddresses([]);
                setSelectedAddress(null);
                setLoadingAddresses(false);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/addresses/my-addresses`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                // Handle unauthorized/forbidden: clear token and redirect to login
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('buyer_token');
                    localStorage.removeItem('buyer_user');
                    showToast('Session expired or unauthorized. Please log in again.', 'error');
                    navigate('/buyer/login'); // Redirect to login page
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                setAddresses(data.data || []);
                // Automatically select default address or the first one if no default exists
                const defaultAddr = (data.data || []).find(addr => addr.is_default) || (data.data && data.data.length > 0 ? data.data[0] : null);
                setSelectedAddress(defaultAddr);
            } else {
                setError(data.message || 'Failed to fetch addresses');
                showToast(data.message || 'Failed to fetch addresses', 'error');
            }
        } catch (err) {
            console.error('Fetch addresses error:', err);
            setError('Failed to load addresses. Please try again.');
            showToast('Failed to load addresses. Please try again.', 'error');
        } finally {
            setLoadingAddresses(false);
        }
    }, [getAuthToken, navigate]); // Dependencies for useCallback

    // Updates quantity or notes for a specific cart item
    const updateCartItem = useCallback(async (cartItemId, newQuantity, notes) => {
        setAddingToCartItemId(cartItemId); // Indicate loading for this specific item
        setError(null);
        try {
            const token = getAuthToken();
            if (!token) {
                showToast('Please log in to update your cart.', 'error');
                setAddingToCartItemId(null);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/cart/update/${cartItemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ requested_quantity: newQuantity, notes }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                showToast('Cart item updated!', 'success');
                fetchCartItems(); // Re-fetch cart to get the latest state from backend
            } else {
                setError(data.message || 'Failed to update cart item');
                showToast(data.message || 'Failed to update cart item', 'error');
            }
        } catch (err) {
            console.error('Update cart item error:', err);
            setError('Failed to update cart item. Please try again.');
            showToast('Failed to update cart item. Please try again.', 'error');
        } finally {
            setAddingToCartItemId(null); // Clear loading for this item
        }
    }, [getAuthToken, fetchCartItems]); // Dependencies for useCallback

    // Removes a single item from the cart
    const removeCartItem = useCallback(async (cartItemId) => {
        // Confirmation dialog (replace with a custom modal in a real app)
        if (!window.confirm('Are you sure you want to remove this item from your cart?')) return;

        setLoadingCart(true); // Set general cart loading
        setError(null);
        try {
            const token = getAuthToken();
            if (!token) {
                showToast('Please log in to modify your cart.', 'error');
                setLoadingCart(false);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/cart/remove/${cartItemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                showToast('Item removed from cart!', 'success');
                fetchCartItems(); // Re-fetch cart to update UI
            } else {
                setError(data.message || 'Failed to remove item');
                showToast(data.message || 'Failed to remove item', 'error');
            }
        } catch (err) {
            console.error('Remove cart item error:', err);
            setError('Failed to remove item. Please try again.');
            showToast('Failed to remove item. Please try again.', 'error');
        } finally {
            setLoadingCart(false);
        }
    }, [getAuthToken, fetchCartItems]); // Dependencies for useCallback

    // Clears all items from the cart
    const clearCart = useCallback(async () => {
        // Confirmation dialog (replace with a custom modal in a real app)
        // Removed window.confirm here, as it's handled by the custom modal now
        setLoadingCart(true);
        setError(null);
        try {
            const token = getAuthToken();
            if (!token) {
                showToast('Please log in to clear your cart.', 'error');
                setLoadingCart(false);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/cart/clear`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                showToast('Cart cleared successfully!', 'success');
                setCartItems([]); // Clear local state immediately for responsiveness
            } else {
                setError(data.message || 'Failed to clear cart');
                showToast(data.message || 'Failed to clear cart', 'error');
            }
        } catch (err) {
            console.error('Clear cart error:', err);
            setError('Failed to clear cart. Please try again.');
            showToast('Failed to clear cart. Please try again.', 'error');
        } finally {
            setLoadingCart(false);
        }
    }, [getAuthToken]); // Dependencies for useCallback

    // --- Handlers for Cart Items (Step 1) ---

    // Handles quantity changes for a specific cart item
    const handleQuantityChange = (cartItemId, delta) => {
        setCartItems(prevItems =>
            prevItems.map(item => {
                if (item.cart_item_id === cartItemId) {
                    const newQuantity = Math.max(1, item.requested_quantity + delta);
                    // Update local state immediately for UI responsiveness
                    // The actual API call is debounced or triggered by stopContinuousChange
                    return { ...item, requested_quantity: newQuantity };
                }
                return item;
            })
        );
    };

    // Handles notes changes for a specific cart item
    const handleNotesChange = (cartItemId, newNotes) => {
        setCartItems(prevItems =>
            prevItems.map(item => {
                if (item.cart_item_id === cartItemId) {
                    // Update local state immediately for UI responsiveness
                    return { ...item, notes: newNotes };
                }
                return item;
            })
        );
    };

    // Handles blur event for notes to trigger API update
    const handleNotesBlur = (cartItemId, currentNotes) => {
        const itemToUpdate = cartItems.find(item => item.cart_item_id === cartItemId);
        if (itemToUpdate && itemToUpdate.notes !== currentNotes) { // Only update if notes actually changed
            updateCartItem(cartItemId, itemToUpdate.requested_quantity, currentNotes);
        }
    };


    // Functions for continuous quantity change on button hold
    const startContinuousChange = useCallback((cartItemId, type) => {
        // Initial immediate change
        handleQuantityChange(cartItemId, type === 'increment' ? 1 : -1);

        // Set up interval for continuous change
        intervalRef.current = setInterval(() => {
            setCartItems(prevItems =>
                prevItems.map(item => {
                    if (item.cart_item_id === cartItemId) {
                        let updatedQuantity = item.requested_quantity;
                        if (type === 'increment') {
                            updatedQuantity += 1;
                        } else if (type === 'decrement') {
                            updatedQuantity = Math.max(1, updatedQuantity - 1);
                        }
                        // Trigger API update for the continuous change
                        // This might lead to many API calls; for high-frequency updates, consider debouncing
                        updateCartItem(cartItemId, updatedQuantity, item.notes);
                        return { ...item, requested_quantity: updatedQuantity };
                    }
                    return item;
                })
            );
        }, 150); // Interval time in ms
    }, [cartItems, updateCartItem]); // Dependencies for useCallback

    const stopContinuousChange = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []); // No dependencies as it only clears the interval

    // --- Navigation Handlers ---

    const handleProceedToAddress = () => {
        if (cartItems.length === 0) {
            showToast("Your cart is empty. Please add items before proceeding.", "error");
            return;
        }
        setCurrentStep(2);
        fetchUserAddresses(); // Fetch addresses when moving to step 2
    };

    const handleProceedToOrderSummary = () => {
        if (!selectedAddress) {
            showToast("Please select a delivery address.", "error");
            return;
        }
        setCurrentStep(3);
        // Set a default order name, can be edited by user
        setOrderName(`Order ${new Date().toLocaleDateString()} - ${buyerUser?.name || 'Guest'}`);
    };

    // Handles placing the order using the new API endpoint
    // Handles placing the order using the new API endpoint
    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            showToast("No address selected for the order.", "error");
            return;
        }
        if (cartItems.length === 0) {
            showToast("Cart is empty. Cannot place order.", "error");
            return;
        }
        if (!orderName.trim()) {
            showToast("Please provide a name for your order.", "error");
            return;
        }

        setIsProcessingOrder(true); // Set loading state for order placement
        setError(null);

        // FIXED: Prepare productNotes object using quantity_id as key (not product_id)
        const productNotesPayload = {};
        cartItems.forEach(item => {
            if (item.notes && item.notes.trim()) {
                // Use quantity_id as the key since that's what the backend expects first
                productNotesPayload[item.quantity_id] = item.notes.trim();
            }
        });

        try {
            const token = getAuthToken();
            if (!token) {
                showToast('Please log in to place an order.', 'error');
                setIsProcessingOrder(false);
                navigate('/buyer/login');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/buyer/orders/create-from-cart`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    order_name: orderName.trim(),
                    delivery_address: selectedAddress.address_line,
                    delivery_latitude: selectedAddress.latitude,
                    delivery_longitude: selectedAddress.longitude,
                    general_notes: generalNotes.trim() || null, // Ensure empty string becomes null
                    productNotes: productNotesPayload // Pass the fixed product notes with quantity_id as key
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showToast('Order placed successfully!', 'success');
                // Cart is cleared automatically by the backend API, so no explicit clearCart() here
                setCartItems([]); // Manually clear local cart state to reflect backend change
                // Redirect to buyer dashboard after successful order
                navigate('/buyer/dashboard');
                // Reset all order-related states
                setGeneralNotes('');
                setOrderName('');
                setSelectedAddress(null);
            } else {
                setError(data.message || 'Failed to place order.');
                showToast(data.message || 'Failed to place order.', 'error');
            }
        } catch (err) {
            console.error('Order placement error:', err);
            setError('Network error. Please try again.');
            showToast('Network error. Please try again.', 'error');
        } finally {
            setIsProcessingOrder(false); // Clear loading state
        }
    };

    // Modified handleCancelOrder to show custom modal
    const handleCancelOrder = () => {
        setShowCancelOrderModal(true);
    };

    // Handler for "Clear Cart & Go to Dashboard" button in modal
    const handleConfirmClearCartAndGoToDashboard = async () => {
        setShowCancelOrderModal(false); // Close modal
        await clearCart(); // Clear the cart
        navigate('/buyer/dashboard'); // Navigate to dashboard
    };

    // Handler for "Go to Dashboard (Keep Cart)" button in modal
    const handleGoToDashboardKeepCart = () => {
        setShowCancelOrderModal(false); // Close modal
        navigate('/buyer/dashboard'); // Navigate to dashboard without clearing cart
    };


    // --- useEffect Hooks ---

    // Initial fetch of cart items when the component mounts
    useEffect(() => {
        fetchCartItems();
    }, [fetchCartItems]); // Dependency on fetchCartItems useCallback

    // Effect to apply the theme class to the document's HTML element
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]); // Re-run when theme state changes

    // Determine card header gradient and text color based on current theme
    const cardHeaderGradient = theme === 'dark'
        ? 'bg-gradient-to-r from-gray-700 to-gray-900' // Dark theme gradient
        : 'bg-gradient-to-r from-green-500 to-green-600'; // Light theme gradient

    const cardHeaderTextColor = theme === 'dark' ? 'text-green-300' : 'text-white'; // Text color for header

    return (
        // Updated background with gradient for light mode
        <div className={`min-h-screen font-inter transition-colors duration-300 ${
            theme === 'light' ? 'bg-gradient-to-br from-green-50 to-green-100 text-gray-900' : 'bg-gray-900 text-gray-100'
        }`}>
            {/* Buyer Dashboard Navbar */}
            <BuyerDashboardNavbar
                theme={theme}
                toggleTheme={toggleTheme}
                buyerUser={buyerUser}
                cartItemCount={cartItems.length} // Pass the actual number of items in the cart
            />

            <div className="container mx-auto p-4 py-8">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-3xl font-bold text-center text-green-700 dark:text-green-400 mb-8"
                >
                    Your Shopping Cart
                </motion.h1>

                {/* Progress Indicator / Stepper */}
                <div className="flex justify-center mb-10 flex-wrap gap-4">
                    <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300
              ${currentStep >= 1 ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                            1
                        </div>
                        <span className={`mt-2 text-sm font-medium ${currentStep >= 1 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
              Review Cart
            </span>
                    </div>
                    <div className={`flex-grow h-1 rounded-full mx-4 self-center hidden sm:block transition-all duration-300 ${currentStep >= 2 ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}></div>

                    <div className="flex flex-col items-center m-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300
              ${currentStep >= 2 ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                            2
                        </div>
                        <span className={`mt-2 text-sm font-medium ${currentStep >= 2 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
              Choose Address
            </span>
                    </div>
                    <div className={`flex-grow h-1 rounded-full mx-4 self-center hidden sm:block transition-all duration-300 ${currentStep >= 3 ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}></div>

                    <div className="flex flex-col items-center m-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300
              ${currentStep >= 3 ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                            3
                        </div>
                        <span className={`mt-2 text-sm font-medium ${currentStep >= 3 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
              Confirm Order
            </span>
                    </div>
                </div>

                {/* Main Card Container for All Steps */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden mb-8 transform hover:scale-[1.005] transition-transform duration-300 ease-in-out border border-gray-200 dark:border-gray-700 max-w-3xl mx-auto"
                >
                    <div className={`p-5 ${cardHeaderGradient} rounded-t-xl flex items-center justify-between`}>
                        {currentStep === 1 && <h2 className={`text-2xl font-semibold ${cardHeaderTextColor}`}>Review Your Cart</h2>}
                        {currentStep === 2 && <h2 className={`text-2xl font-semibold ${cardHeaderTextColor}`}>Choose Delivery Address</h2>}
                        {currentStep === 3 && <h2 className={`text-2xl font-semibold ${cardHeaderTextColor}`}>Order Summary</h2>}
                        {currentStep === 1 && <ShoppingCart className={`w-7 h-7 ${cardHeaderTextColor}`} />}
                        {currentStep === 2 && <MapPin className={`w-7 h-7 ${cardHeaderTextColor}`} />}
                        {currentStep === 3 && <CheckCircle className={`w-7 h-7 ${cardHeaderTextColor}`} />}
                    </div>

                    <div className="p-6">
                        <AnimatePresence mode="wait">
                            {/* --- Step 1: Review Cart Content --- */}
                            {currentStep === 1 && (
                                <motion.div
                                    key="step1-content"
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 50 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {loadingCart ? (
                                        <div className="flex justify-center items-center py-10">
                                            <Loader2 className="animate-spin text-green-500" size={32} />
                                            <p className="ml-3 text-gray-600 dark:text-gray-400">Loading cart items...</p>
                                        </div>
                                    ) : error ? (
                                        <p className="text-red-500 text-center py-10">{error}</p>
                                    ) : cartItems.length === 0 ? (
                                        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                                            <ShoppingCart className="w-20 h-20 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                                            <p className="text-xl font-medium">Your cart is empty!</p>
                                            <p className="text-md mt-2">Start adding some fresh products from the dashboard.</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                                {cartItems.map((item) => (
                                                    <div
                                                        key={item.cart_item_id}
                                                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
                                                    >
                                                        <div className="flex-grow mb-3 sm:mb-0">
                                                            <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">{item.product_name}</p>
                                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                                {item.quantity_value} {item.quantity_unit}
                                                            </p>
                                                            {/* Individual Notes */}
                                                            <label htmlFor={`notes-${item.cart_item_id}`} className="sr-only">Notes for {item.product_name}</label>
                                                            <textarea
                                                                id={`notes-${item.cart_item_id}`}
                                                                value={item.notes || ''}
                                                                onChange={(e) => handleNotesChange(item.cart_item_id, e.target.value)}
                                                                onBlur={(e) => handleNotesBlur(item.cart_item_id, e.target.value)}
                                                                placeholder="Add notes for this item (e.g., 'ripe', 'less spicy')"
                                                                rows="1"
                                                                className="w-full mt-2 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-green-500 text-sm resize-y"
                                                            />
                                                        </div>
                                                        <div className="flex items-center space-x-2 flex-shrink-0 mt-3 sm:mt-0">
                                                            {/* Quantity Controls */}
                                                            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
                                                                <button
                                                                    onMouseDown={() => startContinuousChange(item.cart_item_id, 'decrement')}
                                                                    onMouseUp={stopContinuousChange}
                                                                    onMouseLeave={stopContinuousChange}
                                                                    onClick={() => updateCartItem(item.cart_item_id, Math.max(1, item.requested_quantity - 1), item.notes)}
                                                                    disabled={item.requested_quantity <= 1 || addingToCartItemId === item.cart_item_id}
                                                                    className="p-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    −
                                                                </button>
                                                                <span className="w-10 text-center font-bold bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 py-2">
                                  {item.requested_quantity}
                                </span>
                                                                <button
                                                                    onMouseDown={() => startContinuousChange(item.cart_item_id, 'increment')}
                                                                    onMouseUp={stopContinuousChange}
                                                                    onMouseLeave={stopContinuousChange}
                                                                    onClick={() => updateCartItem(item.cart_item_id, item.requested_quantity + 1, item.notes)}
                                                                    disabled={addingToCartItemId === item.cart_item_id}
                                                                    className="p-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-r-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                            {/* Remove Item Button */}
                                                            <button
                                                                onClick={() => removeCartItem(item.cart_item_id)}
                                                                disabled={addingToCartItemId === item.cart_item_id}
                                                                className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                aria-label="Remove item"
                                                            >
                                                                <X className="w-6 h-6" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* General Notes for Vendor */}
                                            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                                                <label htmlFor="generalNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    General Notes for Vendor (Optional)
                                                </label>
                                                <textarea
                                                    id="generalNotes"
                                                    value={generalNotes}
                                                    onChange={(e) => setGeneralNotes(e.target.value)}
                                                    placeholder="Any special instructions for the vendor regarding this order..."
                                                    rows="3"
                                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 resize-y"
                                                ></textarea>
                                            </div>

                                            <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
                                                <button
                                                    onClick={clearCart}
                                                    disabled={loadingCart || isProcessingOrder}
                                                    className="w-full sm:w-auto bg-red-100 hover:bg-red-200 text-red-700 font-bold py-3 px-8 rounded-full transition duration-300 ease-in-out dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                                                >
                                                    Clear Cart
                                                </button>
                                                <button
                                                    onClick={handleProceedToAddress}
                                                    disabled={loadingCart || cartItems.length === 0 || isProcessingOrder}
                                                    className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center"
                                                >
                                                    Proceed to Address <ArrowRight className="ml-2 w-5 h-5" />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            )}

                            {/* --- Step 2: Choose Address Content --- */}
                            {currentStep === 2 && (
                                <motion.div
                                    key="step2-content"
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 50 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {loadingAddresses ? (
                                        <div className="flex justify-center items-center py-10">
                                            <Loader2 className="animate-spin text-green-500" size={32} />
                                            <p className="ml-3 text-gray-600 dark:text-gray-400">Loading addresses...</p>
                                        </div>
                                    ) : error ? (
                                        <p className="text-red-500 text-center py-10">{error}</p>
                                    ) : addresses.length === 0 ? (
                                        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                                            <MapPin className="w-20 h-20 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                                            <p className="text-xl font-medium">No addresses found.</p>
                                            <p className="text-md mt-2">Please add an address to proceed with your order.</p>
                                            <button
                                                onClick={() => navigate('/buyer/address')}
                                                className="mt-6 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-full transition duration-300 ease-in-out shadow-md hover:shadow-lg"
                                            >
                                                <PlusCircle className="inline-block mr-2 w-5 h-5" /> Add New Address
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                                {addresses.map((address) => (
                                                    <label
                                                        key={address.id}
                                                        className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-200
                            ${selectedAddress?.id === address.id ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md' : 'border-gray-200 dark:border-gray-700 hover:border-green-400 hover:bg-gray-50 dark:hover:bg-gray-700'}
                          `}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="addressSelection"
                                                            value={address.id}
                                                            checked={selectedAddress?.id === address.id}
                                                            onChange={() => setSelectedAddress(address)}
                                                            className="form-radio h-5 w-5 text-green-600 dark:text-green-400 transition-colors duration-200 focus:ring-green-500"
                                                        />
                                                        <div className="ml-4 flex-grow">
                                                            <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">{address.name} {address.is_default && <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full ml-2 dark:bg-green-700 dark:text-green-100">Default</span>}</p>
                                                            <p className="text-sm text-gray-600 dark:text-gray-300">{address.address_line}</p>
                                                            {address.landmark && <p className="text-xs text-gray-500 dark:text-gray-400">Landmark: {address.landmark}</p>}
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); navigate('/buyer/address'); }} // Stop propagation to prevent radio button click
                                                            className="ml-auto p-2 text-blue-500 hover:text-blue-700 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                            aria-label="Edit address"
                                                        >
                                                            <Edit className="w-6 h-6" />
                                                        </button>
                                                    </label>
                                                ))}
                                            </div>
                                            <div className="mt-6 flex justify-center">
                                                <button
                                                    onClick={() => navigate('/buyer/address')}
                                                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold py-2 px-6 rounded-full transition duration-300 ease-in-out dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 shadow-md hover:shadow-lg"
                                                >
                                                    <PlusCircle className="inline-block mr-2 w-5 h-5" /> Add New Address
                                                </button>
                                            </div>
                                            <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
                                                <button
                                                    onClick={() => setCurrentStep(1)}
                                                    className="w-full sm:w-auto bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-8 rounded-full transition duration-300 ease-in-out dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 shadow-md hover:shadow-lg"
                                                >
                                                    « Back to Cart
                                                </button>
                                                <button
                                                    onClick={handleProceedToOrderSummary}
                                                    disabled={!selectedAddress}
                                                    className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center"
                                                >
                                                    Proceed to Order Summary <ArrowRight className="ml-2 w-5 h-5" />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            )}

                            {/* --- Step 3: Order Summary Content --- */}
                            {currentStep === 3 && (
                                <motion.div
                                    key="step3-content"
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 50 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-inner">
                                        <label htmlFor="orderName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Order Name
                                        </label>
                                        <input
                                            type="text"
                                            id="orderName"
                                            value={orderName}
                                            onChange={(e) => setOrderName(e.target.value)}
                                            placeholder="Give your order a name (e.g., 'Weekly Grocery')"
                                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                                            required
                                        />
                                    </div>

                                    <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700 shadow-inner">
                                        <h3 className="font-semibold text-lg mb-2 text-green-600 dark:text-green-400">Delivery Address:</h3>
                                        {selectedAddress ? (
                                            <>
                                                <p className="text-gray-800 dark:text-gray-200 font-medium">{selectedAddress.name}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-300">{selectedAddress.address_line}</p>
                                                {selectedAddress.landmark && <p className="text-xs text-gray-500 dark:text-gray-400">Landmark: {selectedAddress.landmark}</p>}
                                            </>
                                        ) : (
                                            <p className="text-red-500 text-sm">No address selected.</p>
                                        )}
                                    </div>

                                    <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700 shadow-inner">
                                        <h3 className="font-semibold text-lg mb-2 text-green-600 dark:text-green-400">Cart Summary:</h3>
                                        <p className="text-gray-800 dark:text-gray-200">Total Products: <span className="font-bold">{cartItems.length}</span></p>
                                        {generalNotes && (
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                                                General Notes: <span className="italic">"{generalNotes}"</span>
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
                                        <button
                                            onClick={() => setCurrentStep(2)}
                                            className="w-full sm:w-auto bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-8 rounded-full transition duration-300 ease-in-out dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 shadow-md hover:shadow-lg"
                                        >
                                            « Back to Address
                                        </button>
                                        {/* This now triggers the custom modal */}
                                        <button
                                            onClick={handleCancelOrder}
                                            disabled={isProcessingOrder}
                                            className="w-full sm:w-auto bg-red-100 hover:bg-red-200 text-red-700 font-bold py-3 px-8 rounded-full transition duration-300 ease-in-out dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                                        >
                                            Cancel Order
                                        </button>
                                        <button
                                            onClick={handlePlaceOrder}
                                            disabled={isProcessingOrder || !selectedAddress || cartItems.length === 0 || !orderName.trim()}
                                            className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center"
                                        >
                                            {isProcessingOrder ? (
                                                <span className="flex items-center justify-center">
                          <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                          Placing Order...
                        </span>
                                            ) : (
                                                <>
                                                    Place Order <CheckCircle className="ml-2 inline-block h-5 w-5" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Custom Cancel Order Modal */}
                <AnimatePresence>
                    {showCancelOrderModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 50 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 50 }}
                                className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-md text-center border border-gray-200 dark:border-gray-700"
                            >
                                <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">Cancel Order?</h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-6">
                                    Are you sure you want to cancel this order? You have two options:
                                </p>
                                <div className="flex flex-col gap-4">
                                    <button
                                        onClick={handleConfirmClearCartAndGoToDashboard}
                                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 ease-in-out shadow-md hover:shadow-lg flex items-center justify-center"
                                    >
                                        <X className="mr-2 w-5 h-5" /> Clear Cart & Go to Dashboard
                                    </button>
                                    <button
                                        onClick={handleGoToDashboardKeepCart}
                                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 ease-in-out shadow-md hover:shadow-lg flex items-center justify-center"
                                    >
                                        <ArrowRight className="mr-2 w-5 h-5" /> Go to Dashboard (Keep Cart)
                                    </button>
                                    <button
                                        onClick={() => setShowCancelOrderModal(false)}
                                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-full transition duration-300 ease-in-out dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 shadow-md hover:shadow-lg"
                                    >
                                        Keep Editing
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Cart;
