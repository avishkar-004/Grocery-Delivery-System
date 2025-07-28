import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BuyerDashboardNavbar from './BuyerDashboardNavbar'; // Ensure this path is correct
import { Loader2, MapPin, Edit, X, PlusCircle, CheckCircle, ShoppingCart, ArrowRight, AlertTriangle, Search } from 'lucide-react'; // Icons from lucide-react
import { motion, AnimatePresence } from 'framer-motion'; // Ensure framer-motion is installed
import { toast, Toaster } from 'react-hot-toast'; // Import react-hot-toast for toasts

// Base URL for your backend API
const API_BASE_URL = 'http://localhost:3000'; // Replace with your actual backend URL

const Cart = () => {
    const navigate = useNavigate();

    // --- State Management ---
    const [currentStep, setCurrentStep] = useState(1); // 1: Review Cart, 2: Choose Address, 3: Order Summary
    const [cartItems, setCartItems] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [generalNotes, setGeneralNotes] = useState(() => localStorage.getItem('generalNotes') || ''); // Load from localStorage
    const [orderName, setOrderName] = useState('');
    const [searchQuery, setSearchQuery] = useState(''); // State for the search bar

    // Loading states
    const [loadingCart, setLoadingCart] = useState(true);
    const [loadingAddresses, setLoadingAddresses] = useState(true);
    const [isProcessingOrder, setIsProcessingOrder] = useState(false);
    const [updatingItemId, setUpdatingItemId] = useState(null); // For individual item update loading

    const [error, setError] = useState(null);
    const [showCancelOrderModal, setShowCancelOrderModal] = useState(false);

    // Theme state
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

    // Buyer user info
    const [buyerUser, setBuyerUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem('buyer_user');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (e) {
            console.error("Failed to parse buyer_user from localStorage", e);
            return null;
        }
    });

    // --- Utility Functions ---

    // Toast function using react-hot-toast
    const showToast = useCallback((message, type = 'info') => {
        switch (type) {
            case 'success':
                toast.success(message);
                break;
            case 'error':
                toast.error(message);
                break;
            case 'info':
                toast(message);
                break;
            default:
                toast(message);
        }
    }, []);

    // Toggle theme
    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    // Get auth token
    const getAuthToken = useCallback(() => localStorage.getItem('buyer_token'), []);

    // --- API Calls ---

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
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('buyer_token');
                    localStorage.removeItem('buyer_user');
                    showToast('Session expired. Please log in again.', 'error');
                    navigate('/buyer/login');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                const processedItems = data.data.items.map(item => ({
                    ...item,
                    product_group_name: item.product_name.split(' - ')[0]
                }));
                setCartItems(processedItems);
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
    }, [getAuthToken, navigate, showToast]);

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
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('buyer_token');
                    localStorage.removeItem('buyer_user');
                    showToast('Session expired. Please log in again.', 'error');
                    navigate('/buyer/login');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                setAddresses(data.data || []);
                const defaultAddr = (data.data || []).find(addr => addr.is_default) || (data.data?.[0] || null);
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
    }, [getAuthToken, navigate, showToast]);

    const updateCartItem = useCallback(async (cartItemId, newQuantity, notes) => {
        setUpdatingItemId(cartItemId);
        setError(null);
        try {
            const token = getAuthToken();
            if (!token) {
                showToast('Please log in to update your cart.', 'error');
                return;
            }

            // Optimistic update of the specific item in the local state
            setCartItems(prevItems =>
                prevItems.map(item =>
                    item.cart_item_id === cartItemId
                        ? { ...item, requested_quantity: newQuantity, notes: notes }
                        : item
                )
            );

            const response = await fetch(`${API_BASE_URL}/api/cart/update/${cartItemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ requested_quantity: newQuantity, notes }),
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                // Revert on failure
                showToast(data.message || 'Failed to update item. Reverting changes.', 'error');
                fetchCartItems(); // Re-fetch to sync state with DB
                throw new Error(data.message || 'Failed to update item');
            }
            showToast('Cart item updated!', 'success');

        } catch (err) {
            console.error('Update cart item error:', err);
            if (!err.message.includes('Reverting changes')) { // Avoid double toast for specific error
                showToast(err.message || 'Failed to update item. Please try again.', 'error');
            }
        } finally {
            setUpdatingItemId(null);
        }
    }, [getAuthToken, fetchCartItems, showToast]);

    const removeCartItem = useCallback(async (cartItemId) => {
        // Replace window.confirm with toast for confirmation
        toast((t) => (
            <div className="flex flex-col items-center">
                <p className="font-semibold mb-2 text-gray-800 dark:text-gray-100">Are you sure you want to remove this item?</p>
                <div className="flex gap-2 mt-2">
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            // Optimistic UI update
                            const originalItems = [...cartItems];
                            setCartItems(prevItems => prevItems.filter(item => item.cart_item_id !== cartItemId));
                            setUpdatingItemId(cartItemId);

                            const executeRemoval = async () => {
                                try {
                                    const token = getAuthToken();
                                    if (!token) throw new Error('Please log in to modify your cart.');

                                    const response = await fetch(`${API_BASE_URL}/api/cart/remove/${cartItemId}`, {
                                        method: 'DELETE',
                                        headers: { 'Authorization': `Bearer ${token}` },
                                    });

                                    const data = await response.json();
                                    if (!response.ok || !data.success) {
                                        throw new Error(data.message || 'Failed to remove item');
                                    }
                                    showToast('Item removed from cart!', 'success');
                                } catch (err) {
                                    console.error('Remove cart item error:', err);
                                    showToast(err.message, 'error');
                                    // Revert on failure
                                    setCartItems(originalItems);
                                } finally {
                                    setUpdatingItemId(null);
                                }
                            };
                            executeRemoval();
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full"
                    >
                        Yes, Remove
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-full"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ), {
            duration: Infinity, // Keep toast open until action is taken
            icon: <AlertTriangle className="text-yellow-500" />,
            style: {
                background: theme === 'dark' ? '#374151' : '#fff',
                color: theme === 'dark' ? '#F3F4F6' : '#1F2937',
            }
        });
    }, [getAuthToken, cartItems, showToast, theme]);


    const clearCart = useCallback(async () => {
        setLoadingCart(true);
        try {
            const token = getAuthToken();
            if (!token) throw new Error('Please log in to clear your cart.');

            const response = await fetch(`${API_BASE_URL}/api/cart/clear`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to clear cart');
            }
            showToast('Cart cleared successfully!', 'success');
            setCartItems([]); // Clear local state immediately
        } catch (err) {
            console.error('Clear cart error:', err);
            showToast(err.message, 'error');
        } finally {
            setLoadingCart(false);
        }
    }, [getAuthToken, showToast]);

    // --- Handlers for Cart Items (Step 1) ---

    const handleQuantityChange = (cartItemId, delta) => {
        // Optimistically update the quantity in state
        setCartItems(prevItems => {
            const updatedItems = prevItems.map(item => {
                if (item.cart_item_id === cartItemId) {
                    const newQuantity = Math.max(1, item.requested_quantity + delta);
                    return { ...item, requested_quantity: newQuantity };
                }
                return item;
            });
            const updatedItem = updatedItems.find(item => item.cart_item_id === cartItemId);
            if (updatedItem) {
                updateCartItem(cartItemId, updatedItem.requested_quantity, updatedItem.notes);
            }
            return updatedItems;
        });
    };

    const handleNotesChange = (cartItemId, newNotes) => {
        // Only update the notes in local state immediately
        setCartItems(prevItems =>
            prevItems.map(item => item.cart_item_id === cartItemId ? { ...item, notes: newNotes } : item)
        );
    };

    const handleNotesBlur = (cartItemId) => {
        // Trigger DB update when textarea loses focus
        const itemToUpdate = cartItems.find(item => item.cart_item_id === cartItemId);
        if (itemToUpdate) {
            updateCartItem(itemToUpdate.cart_item_id, itemToUpdate.requested_quantity, itemToUpdate.notes);
        }
    };

    // --- Grouping and Filtering Logic ---
    const groupedAndFilteredCart = useMemo(() => {
        const filtered = cartItems.filter(item =>
            item.product_name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const grouped = filtered.reduce((acc, item) => {
            const key = item.product_group_name; // Group by the base product name
            if (!acc[key]) {
                acc[key] = {
                    product_group_name: key,
                    items: []
                };
            }
            acc[key].items.push(item);
            return acc;
        }, {});

        // Sort groups by name for stable rendering
        const sortedGroups = Object.values(grouped).sort((a, b) =>
            a.product_group_name.localeCompare(b.product_group_name)
        );

        return sortedGroups;
    }, [cartItems, searchQuery]);


    // --- Navigation Handlers ---
    const handleProceedToAddress = () => {
        if (cartItems.length === 0) {
            showToast("Your cart is empty.", "error");
            return;
        }
        setCurrentStep(2);
        fetchUserAddresses();
    };

    const handleProceedToOrderSummary = () => {
        if (!selectedAddress) {
            showToast("Please select a delivery address.", "error");
            return;
        }
        setCurrentStep(3);
        setOrderName(`Order for ${buyerUser?.name || 'Guest'} on ${new Date().toLocaleDateString()}`);
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddress || cartItems.length === 0 || !orderName.trim()) {
            showToast("Please complete all fields: order name, address, and have items in your cart.", "error");
            return;
        }
        setIsProcessingOrder(true);
        setError(null);

        const productNotesPayload = {};
        cartItems.forEach(item => {
            if (item.notes && item.notes.trim()) {
                productNotesPayload[item.quantity_id] = item.notes.trim();
            }
        });

        try {
            const token = getAuthToken();
            if (!token) {
                showToast('Please log in to place an order.', 'error');
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
                    general_notes: generalNotes.trim() || null,
                    productNotes: productNotesPayload
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showToast('Order placed successfully! Redirecting...', 'success');
                setCartItems([]);
                localStorage.removeItem('generalNotes'); // Clear general notes on successful order
                navigate('/buyer/orders'); // <-- UPDATED: Redirect to orders page
            } else {
                setError(data.message || 'Failed to place order.');
                showToast(data.message || 'Failed to place order.', 'error');
            }
        } catch (err) {
            console.error('Order placement error:', err);
            setError('Network error. Please try again.');
            showToast('Network error. Please try again.', 'error');
        } finally {
            setIsProcessingOrder(false);
        }
    };

    const handleCancelOrder = () => setShowCancelOrderModal(true);

    const handleConfirmClearCartAndGoToDashboard = async () => {
        setShowCancelOrderModal(false);
        await clearCart();
        navigate('/buyer/dashboard');
    };

    const handleGoToDashboardKeepCart = () => {
        setShowCancelOrderModal(false);
        navigate('/buyer/dashboard');
    };

    // --- useEffect Hooks ---
    useEffect(() => {
        fetchCartItems();
    }, [fetchCartItems]);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    // Persist general notes to localStorage
    useEffect(() => {
        localStorage.setItem('generalNotes', generalNotes);
    }, [generalNotes]);

    const cardHeaderGradient = theme === 'dark' ? 'bg-gradient-to-r from-gray-700 to-gray-900' : 'bg-gradient-to-r from-green-500 to-green-600';
    const cardHeaderTextColor = theme === 'dark' ? 'text-green-300' : 'text-white';

    return (
        <div className={`min-h-screen font-inter transition-colors duration-300 ${theme === 'light' ? 'bg-gradient-to-br from-green-50 to-green-100 text-gray-900' : 'bg-gray-900 text-gray-100'}`}>
            <BuyerDashboardNavbar
                theme={theme}
                toggleTheme={toggleTheme}
                buyerUser={buyerUser}
                cartItemCount={cartItems.length}
            />
            {/* Toaster for react-hot-toast, positioned at top-left */}
            <Toaster
                position="top-left"
                reverseOrder={false}
                toastOptions={{
                    style: {
                        background: theme === 'dark' ? '#374151' : '#fff',
                        color: theme === 'dark' ? '#F3F4F6' : '#1F2937',
                    },
                }}
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

                {/* Stepper */}
                <div className="flex justify-center mb-10 flex-wrap gap-4">
                    {[1, 2, 3].map((step, index) => (
                        <React.Fragment key={step}>
                            <div className="flex flex-col items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${currentStep >= step ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                                    {step}
                                </div>
                                <span className={`mt-2 text-sm font-medium ${currentStep >= step ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                    {step === 1 && 'Review Cart'}
                                    {step === 2 && 'Choose Address'}
                                    {step === 3 && 'Confirm Order'}
                                </span>
                            </div>
                            {index < 2 && <div className={`flex-grow h-1 rounded-full mx-4 self-center hidden sm:block transition-all duration-300 ${currentStep > step ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}></div>}
                        </React.Fragment>
                    ))}
                </div>


                {/* Main Card Container */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 max-w-4xl mx-auto"
                >
                    <div className={`p-5 ${cardHeaderGradient} rounded-t-xl flex items-center justify-between`}>
                        <h2 className={`text-2xl font-semibold ${cardHeaderTextColor}`}>
                            {currentStep === 1 && 'Review Your Cart'}
                            {currentStep === 2 && 'Choose Delivery Address'}
                            {currentStep === 3 && 'Order Summary'}
                        </h2>
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
                                            {/* Search Bar */}
                                            <div className="mb-6 relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    placeholder="Search for a product in your cart..."
                                                    className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                                                />
                                            </div>

                                            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                                {groupedAndFilteredCart.length > 0 ? groupedAndFilteredCart.map((group) => (
                                                    <div key={group.product_group_name} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                                        <h3 className="text-xl font-bold text-green-700 dark:text-green-400 mb-3">{group.product_group_name}</h3>
                                                        <div className="space-y-4">
                                                            {group.items.map(item => (
                                                                <div
                                                                    key={item.cart_item_id} // Use stable key
                                                                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" // Added gap-3 for spacing
                                                                >
                                                                    <div className="flex-grow mb-3 sm:mb-0">
                                                                        <p className="font-semibold text-md text-gray-800 dark:text-gray-200">
                                                                            {item.quantity_value} {item.quantity_unit}
                                                                        </p>
                                                                        <textarea
                                                                            id={`notes-${item.cart_item_id}`}
                                                                            value={item.notes || ''}
                                                                            onChange={(e) => handleNotesChange(item.cart_item_id, e.target.value)}
                                                                            onBlur={() => handleNotesBlur(item.cart_item_id)} // Save on blur
                                                                            placeholder="Add item notes..."
                                                                            rows="1"
                                                                            className="w-full mt-2 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white text-black dark:bg-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                                                        />
                                                                    </div>
                                                                    <div className="flex items-center space-x-2 flex-shrink-0 self-center"> {/* Added self-center */}
                                                                        <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md">
                                                                            <button
                                                                                onClick={() => handleQuantityChange(item.cart_item_id, -1)}
                                                                                disabled={item.requested_quantity <= 1 || updatingItemId === item.cart_item_id}
                                                                                className="p-2 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                                                                            >−</button>
                                                                            <span className="w-10 text-center font-bold py-1">{item.requested_quantity}</span>
                                                                            <button
                                                                                onClick={() => handleQuantityChange(item.cart_item_id, 1)}
                                                                                disabled={updatingItemId === item.cart_item_id}
                                                                                className="p-2 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                                                                            >+</button>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => removeCartItem(item.cart_item_id)}
                                                                            disabled={updatingItemId === item.cart_item_id}
                                                                            className="p-2 text-red-500 hover:text-red-700 disabled:opacity-50"
                                                                            aria-label="Remove item"
                                                                        ><X className="w-5 h-5" /></button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                                                        <Search className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                                                        <p className="text-lg font-medium">No products match your search.</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* General Notes */}
                                            <div className="mt-6">
                                                <label htmlFor="generalNotes" className="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">
                                                    General Notes for Vendor (Optional)
                                                </label>
                                                <textarea
                                                    id="generalNotes"
                                                    value={generalNotes}
                                                    onChange={(e) => setGeneralNotes(e.target.value)}
                                                    placeholder="Any special instructions for the entire order..."
                                                    rows="3"
                                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white text-black dark:bg-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                                ></textarea>
                                            </div>


                                            {/* Action Buttons */}
                                            <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
                                                <button onClick={clearCart} disabled={loadingCart} className="w-full sm:w-auto bg-red-100 hover:bg-red-200 text-red-700 font-bold py-3 px-6 rounded-full transition">
                                                    Clear Cart
                                                </button>
                                                <button onClick={handleProceedToAddress} disabled={cartItems.length === 0} className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full transition disabled:opacity-50 flex items-center justify-center">
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
                                    ) : addresses.length === 0 ? (
                                        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                                            <MapPin className="w-20 h-20 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                                            <p className="text-xl font-medium">No addresses found.</p>
                                            <button onClick={() => navigate('/buyer/address')} className="mt-6 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full transition">
                                                <PlusCircle className="inline-block mr-2 w-5 h-5" /> Add New Address
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                                {addresses.map((address) => (
                                                    <label key={address.id} className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${selectedAddress?.id === address.id ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                                                        <input
                                                            type="radio"
                                                            name="addressSelection"
                                                            checked={selectedAddress?.id === address.id}
                                                            onChange={() => setSelectedAddress(address)}
                                                            className="form-radio h-5 w-5 text-green-600"
                                                        />
                                                        <div className="ml-4 flex-grow">
                                                            <p className="font-semibold text-lg text-gray-800 dark:text-gray-200">{address.name} {address.is_default == 1 && <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full ml-2">Default</span>}</p>
                                                            <p className="text-sm text-gray-600 dark:text-gray-300">{address.address_line}</p>
                                                        </div>
                                                        <button onClick={(e) => { e.stopPropagation(); navigate('/buyer/address'); }} className="ml-auto p-2 text-blue-500 hover:text-blue-700" aria-label="Edit address">
                                                            <Edit className="w-6 h-6" />
                                                        </button>
                                                    </label>
                                                ))}
                                            </div>
                                            {/* Add New Address Button */}
                                            <div className="mt-6 text-center">
                                                <button onClick={() => navigate('/buyer/address')} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full transition flex items-center justify-center mx-auto">
                                                    <PlusCircle className="inline-block mr-2 w-5 h-5" /> Add New Address
                                                </button>
                                            </div>
                                            <div className="flex justify-between items-center mt-8 gap-4">
                                                <button onClick={() => setCurrentStep(1)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-full transition">
                                                    « Back to Cart
                                                </button>
                                                <button onClick={handleProceedToOrderSummary} disabled={!selectedAddress} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full transition flex items-center justify-center">
                                                    Proceed to Summary <ArrowRight className="ml-2 w-5 h-5 inline" />
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
                                    {/* Order Name Input */}
                                    <div className="mb-6">
                                        <label htmlFor="orderName" className="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">Order Name</label>
                                        <input
                                            type="text"
                                            id="orderName"
                                            value={orderName}
                                            onChange={(e) => setOrderName(e.target.value)}
                                            placeholder="e.g., 'Weekly Groceries'"
                                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white text-black dark:bg-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                            required
                                        />
                                    </div>
                                    {/* Delivery Address */}
                                    <div className="mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-700">
                                        <h3 className="font-semibold text-lg mb-2 text-gray-800 dark:text-gray-200">Delivery Address:</h3>
                                        <p className="text-gray-700 dark:text-gray-300">{selectedAddress.name}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{selectedAddress.address_line}</p>
                                    </div>
                                    {/* Cart Summary */}
                                    <div className="mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-700">
                                        <h3 className="font-semibold text-lg mb-2 text-gray-800 dark:text-gray-200">Cart Summary:</h3>
                                        <p className="text-gray-700 dark:text-gray-300">Total Unique Products: <span className="font-bold">{groupedAndFilteredCart.length}</span></p>
                                        <p className="text-gray-700 dark:text-gray-300">Total Items: <span className="font-bold">{cartItems.reduce((total, item) => total + item.requested_quantity, 0)}</span></p>
                                    </div>
                                    {/* General Notes Display */}
                                    {generalNotes && (
                                        <div className="mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-700">
                                            <h3 className="font-semibold text-lg mb-2 text-gray-800 dark:text-gray-200">General Notes:</h3>
                                            <p className="text-gray-700 dark:text-gray-300 text-sm italic">{generalNotes}</p>
                                        </div>
                                    )}

                                    {/* Product-Specific Notes Display */}
                                    <div className="mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-700">
                                        <h3 className="font-semibold text-lg mb-2 text-gray-800 dark:text-gray-200">Product Notes:</h3>
                                        {cartItems.filter(item => item.notes && item.notes.trim()).length > 0 ? (
                                            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
                                                {cartItems.filter(item => item.notes && item.notes.trim()).map(item => (
                                                    <li key={item.cart_item_id} className="mb-1">
                                                        <span className="font-medium">{item.product_name}:</span> {item.notes}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm italic text-gray-500 dark:text-gray-400">No specific notes for products.</p>
                                        )}
                                    </div>

                                    {/* Buttons */}
                                    <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
                                        <button onClick={() => setCurrentStep(2)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-full transition">« Back</button>
                                        <button onClick={handleCancelOrder} disabled={isProcessingOrder} className="bg-red-100 hover:bg-red-200 text-red-700 font-bold py-3 px-6 rounded-full transition">Cancel Order</button>
                                        <button onClick={handlePlaceOrder} disabled={isProcessingOrder} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full transition flex items-center justify-center">
                                            {isProcessingOrder ? <Loader2 className="animate-spin mr-2 w-5 h-5" /> : <CheckCircle className="mr-2 w-5 h-5" />}
                                            {isProcessingOrder ? 'Placing Order...' : 'Place Order'}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Cancel Order Modal */}
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
                                className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-md text-center"
                            >
                                <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">Cancel Order?</h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-6">Are you sure you want to cancel?</p>
                                <div className="flex flex-col gap-4">
                                    <button onClick={handleConfirmClearCartAndGoToDashboard} className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-full transition">Clear Cart & Go to Dashboard</button>
                                    <button onClick={handleGoToDashboardKeepCart} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full transition">Go to Dashboard (Keep Cart)</button>
                                    <button onClick={() => setShowCancelOrderModal(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-full transition">Keep Editing</button>
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