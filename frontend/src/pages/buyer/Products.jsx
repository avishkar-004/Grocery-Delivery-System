import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BuyerDashboardNavbar from './BuyerDashboardNavbar';
import {
    Loader2,
    ShoppingCart,
    Search,
    Filter,
    Package,
    Eye,
    X,
    MessageSquare,
    CheckCircle,
    AlertTriangle,
    ChevronDown, ChevronUp,
    MapPin,
    Calendar,
    Tag,
    DollarSign,
    Info,
    List,
    Quote,
    Send,
    Ban // For cancelled status
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Base URL for your backend API
const API_BASE_URL = 'http://localhost:3000'; // Replace with your actual backend URL

const MyOrder = () => {
    const navigate = useNavigate();

    // --- State Management for Orders List ---
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [error, setError] = useState(null);

    // Filters for main order list
    const [statusFilter, setStatusFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage] = useState(10);

    // --- State Management for Order Details Modal ---
    const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
    const [orderDetailError, setOrderDetailError] = useState(null);
    const [activeOrderTab, setActiveOrderTab] = useState('details'); // 'details' or 'quotations'

    // --- State Management for Quotations ---
    const [quotations, setQuotations] = useState([]);
    const [loadingQuotations, setLoadingQuotations] = useState(false);
    const [quotationError, setQuotationError] = useState(null);
    const [quotationSort, setQuotationSort] = useState('price_asc'); // 'price_asc', 'price_desc', 'distance_asc', 'distance_desc'
    const [quotationItemFilter, setQuotationItemFilter] = useState('all'); // 'all', 'full', 'partial', 'missing'
    const [quotationSummary, setQuotationSummary] = useState([]); // To store summary from /quotation-summary API

    // --- State Management for Individual Quotation Details / Chat Modal ---
    const [showQuotationItemDetailsModal, setShowQuotationItemDetailsModal] = useState(false);
    const [selectedQuotation, setSelectedQuotation] = useState(null);
    const [quotationMessages, setQuotationMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingChat, setLoadingChat] = useState(false);
    const [chatError, setChatError] = useState(null);
    const chatMessagesEndRef = useRef(null);

    // New state for quotation items (for a specific quotation's details)
    const [quotationItems, setQuotationItems] = useState([]);
    const [loadingQuotationItems, setLoadingQuotationItems] = useState(false);
    const [quotationItemError, setQuotationItemError] = useState(null);

    // Confirmation Modal State
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [confirmAction, setConfirmAction] = useState(null);

    // --- General UI States ---
    const [theme, setTheme] = useState(() => {
        const savedMode = localStorage.getItem('theme');
        return savedMode || 'light';
    });
    const [buyerUser, setBuyerUser] = useState(() => {
        const savedUser = localStorage.getItem('buyer_user');
        try {
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (e) {
            console.error("Failed to parse buyer_user from localStorage", e);
            return null;
        }
    });

    const searchTimeoutRef = useRef(null);

    // --- Utility Functions ---
    const showToast = (message, type = 'info') => {
        console.log(`Toast (${type}): ${message}`);
        // In a real app, integrate a proper toast library (e.g., react-hot-toast)
    };

    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const getAuthToken = useCallback(() => {
        return localStorage.getItem('buyer_token');
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-500 text-white';
            case 'in_progress':
                return 'bg-blue-500 text-white';
            case 'accepted':
                return 'bg-green-500 text-white';
            case 'completed':
                return 'bg-purple-500 text-white';
            case 'cancelled':
                return 'bg-red-500 text-white';
            default:
                return 'bg-gray-500 text-white';
        }
    };

    const getMatchStatusColor = (status) => {
        switch (status) {
            case '✅ Full match':
                return 'text-green-600';
            case '⚠️ Partial match':
                return 'text-yellow-600';
            case '❌ Missing items':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    // --- API Calls ---

    // Fetch orders for the buyer
    const fetchOrders = useCallback(async () => {
        setLoadingOrders(true);
        setError(null);
        try {
            const token = getAuthToken();
            if (!token) {
                setOrders([]);
                setLoadingOrders(false);
                showToast('Please log in to view your orders.', 'info');
                return;
            }

            const queryParams = new URLSearchParams();
            if (statusFilter) {
                queryParams.append('status', statusFilter);
            }
            if (searchQuery) {
                queryParams.append('search', searchQuery);
            }
            queryParams.append('page', currentPage);
            queryParams.append('limit', itemsPerPage);
            queryParams.append('sort', 'created_at');
            queryParams.append('order', 'desc');

            const response = await fetch(`${API_BASE_URL}/api/orders/advanced-filter?${queryParams.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('buyer_token');
                    localStorage.removeItem('buyer_user');
                    showToast('Session expired or unauthorized. Please log in again.', 'error');
                    navigate('/buyer/login');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                // For each order, also fetch quotation summary to display total quotations and item match status
                const ordersWithSummary = await Promise.all(data.data.orders.map(async (order) => {
                    const summaryResponse = await fetch(`${API_BASE_URL}/api/orders/${order.id}/quotation-summary`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    });
                    if (summaryResponse.ok) {
                        const summaryData = await summaryResponse.json();
                        return { ...order, total_quotations_received: summaryData.data ? summaryData.data.length : 0 };
                    }
                    return { ...order, total_quotations_received: 0 };
                }));
                setOrders(ordersWithSummary);
                setTotalPages(data.data.pagination.totalPages);
                setCurrentPage(data.data.pagination.currentPage);
            } else {
                setError(data.message || 'Failed to fetch orders');
                showToast(data.message || 'Failed to fetch orders', 'error');
            }
        } catch (err) {
            console.error('Fetch orders error:', err);
            setError('Failed to load orders. Please try again.');
            showToast('Failed to load orders. Please try again.', 'error');
        } finally {
            setLoadingOrders(false);
        }
    }, [getAuthToken, statusFilter, searchQuery, currentPage, itemsPerPage, navigate]);

    // Fetch details for a specific order
    const fetchOrderDetails = useCallback(async (orderId) => {
        setLoadingOrderDetails(true);
        setOrderDetailError(null);
        try {
            const token = getAuthToken();
            if (!token) {
                showToast('Please log in to view order details.', 'error');
                setLoadingOrderDetails(false);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/details`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                setSelectedOrder(data.data);
            } else {
                setOrderDetailError(data.message || 'Failed to fetch order details');
                showToast(data.message || 'Failed to fetch order details', 'error');
            }
        } catch (err) {
            console.error('Fetch order details error:', err);
            setOrderDetailError('Failed to load order details. Please try again.');
            showToast('Failed to load order details. Please try again.', 'error');
        } finally {
            setLoadingOrderDetails(false);
        }
    }, [getAuthToken]);

    // Fetch quotations for a specific order
    const fetchQuotationsForOrder = useCallback(async (orderId) => {
        setLoadingQuotations(true);
        setQuotationError(null);
        try {
            const token = getAuthToken();
            if (!token) {
                showToast('Please log in to view quotations.', 'error');
                setLoadingQuotations(false);
                return;
            }

            // Fetch main quotations list
            const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/quotations`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                let mappedQuotations = data.data.quotations.map(q => ({
                    ...q,
                    total_price: parseFloat(q.total_amount),
                    price_per_unit: q.price_per_unit ? parseFloat(q.price_per_unit) : 0,
                    available_quantity: q.available_quantity || 'N/A',
                    is_available: q.is_available === 1 || q.is_available === true,
                }));

                // Fetch quotation summary for filtering item match status
                const summaryResponse = await fetch(`${API_BASE_URL}/api/orders/${orderId}/quotation-summary`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (summaryResponse.ok) {
                    const summaryData = await summaryResponse.json();
                    setQuotationSummary(summaryData.data || []);
                    mappedQuotations = mappedQuotations.map(q => {
                        const summary = (summaryData.data || []).find(s => s.quotation_id === q.id);
                        return { ...q, match_status: summary ? summary.match_status : 'N/A' };
                    });
                }

                // Apply filters and sorting
                let filteredAndSortedQuotations = mappedQuotations;

                if (quotationItemFilter !== 'all') {
                    filteredAndSortedQuotations = filteredAndSortedQuotations.filter(q => {
                        if (quotationItemFilter === 'full') return q.match_status === '✅ Full match';
                        if (quotationItemFilter === 'partial') return q.match_status === '⚠️ Partial match';
                        if (quotationItemFilter === 'missing') return q.match_status === '❌ Missing items';
                        return true;
                    });
                }

                if (quotationSort === 'price_asc') {
                    filteredAndSortedQuotations.sort((a, b) => a.total_price - b.total_price);
                } else if (quotationSort === 'price_desc') {
                    filteredAndSortedQuotations.sort((a, b) => b.total_price - a.total_price);
                }
                // Assuming 'distance' field exists in quotation data for sorting
                // else if (quotationSort === 'distance_asc') {
                //     filteredAndSortedQuotations.sort((a, b) => a.distance - b.distance);
                // } else if (quotationSort === 'distance_desc') {
                //     filteredAndSortedQuotations.sort((a, b) => b.distance - a.distance);
                // }
                setQuotations(filteredAndSortedQuotations);
            } else {
                setQuotationError(data.message || 'Failed to fetch quotations');
                showToast(data.message || 'Failed to fetch quotations', 'error');
            }
        } catch (err) {
            console.error('Fetch quotations error:', err);
            setQuotationError('Failed to load quotations. Please try again.');
            showToast('Failed to load quotations. Please try again.', 'error');
        } finally {
            setLoadingQuotations(false);
        }
    }, [getAuthToken, quotationSort, quotationItemFilter]);


    // Fetch messages for a specific quotation
    const fetchQuotationMessages = useCallback(async (quotationId) => {
        setLoadingChat(true);
        setChatError(null);
        try {
            const token = getAuthToken();
            if (!token) {
                showToast('Please log in to view chat messages.', 'error');
                setLoadingChat(false);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/messages/quotation/${quotationId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                setQuotationMessages(data.data.messages);
            } else {
                setChatError(data.message || 'Failed to fetch messages');
                showToast(data.message || 'Failed to fetch messages', 'error');
            }
        } catch (err) {
            console.error('Fetch messages error:', err);
            setChatError('Failed to load messages. Please try again.');
            showToast('Failed to load messages. Please try again.', 'error');
        } finally {
            setLoadingChat(false);
        }
    }, [getAuthToken]);

    // Send a message in a quotation chat
    const handleSendMessage = useCallback(async () => {
        if (!newMessage.trim() || !selectedQuotation?.id) return;
        setLoadingChat(true);
        setChatError(null);
        try {
            const token = getAuthToken();
            if (!token) {
                showToast('Please log in to send messages.', 'error');
                setLoadingChat(false);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/messages/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    quotation_id: selectedQuotation.id,
                    message: newMessage.trim(),
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                setNewMessage('');
                fetchQuotationMessages(selectedQuotation.id); // Refresh messages
            } else {
                setChatError(data.message || 'Failed to send message');
                showToast(data.message || 'Failed to send message', 'error');
            }
        } catch (err) {
            console.error('Send message error:', err);
            setChatError('Failed to send message. Please try again.');
            showToast('Failed to send message. Please try again.', 'error');
        } finally {
            setLoadingChat(false);
        }
    }, [newMessage, selectedQuotation, getAuthToken, fetchQuotationMessages]);

    // Fetch items for a specific quotation (details of items within a quotation)
    const fetchQuotationItemsDetails = useCallback(async (quotationId) => {
        setLoadingQuotationItems(true);
        setQuotationItemError(null);
        try {
            const token = getAuthToken();
            if (!token) {
                showToast('Please log in to view quotation items.', 'error');
                setLoadingQuotationItems(false);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/quotations/${quotationId}/details`, { // Using the new API
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                setQuotationItems(data.data.items);
            } else {
                setQuotationItemError(data.message || 'Failed to fetch quotation items');
                showToast(data.message || 'Failed to fetch quotation items', 'error');
            }
        } catch (err) {
            console.error('Fetch quotation items error:', err);
            setQuotationItemError('Failed to load quotation items. Please try again.');
            showToast('Failed to load quotation items. Please try again.', 'error');
        } finally {
            setLoadingQuotationItems(false);
        }
    }, [getAuthToken]);

    // Cancel Order Handler
    const handleCancelOrder = useCallback(async (orderId) => {
        setConfirmMessage('Are you sure you want to cancel this order? This action cannot be undone.');
        setConfirmAction(async () => {
            setShowConfirmModal(false); // Close confirmation modal immediately
            try {
                const token = getAuthToken();
                if (!token) {
                    showToast('Please log in to cancel order.', 'error');
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/cancel`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showToast('Order cancelled successfully!', 'success');
                    fetchOrders(); // Refresh the order list
                } else {
                    showToast(data.message || 'Failed to cancel order.', 'error');
                }
            } catch (err) {
                console.error('Cancel order error:', err);
                showToast('Failed to cancel order. Please try again.', 'error');
            }
        });
        setShowConfirmModal(true);
    }, [getAuthToken, fetchOrders]);

    // Accept Quotation Handler
    const handleAcceptQuotation = useCallback(async (orderId, quotationId) => {
        setConfirmMessage('Are you sure you want to accept this quotation? This will finalize the order with this seller.');
        setConfirmAction(async () => {
            setShowConfirmModal(false); // Close confirmation modal immediately
            try {
                const token = getAuthToken();
                if (!token) {
                    showToast('Please log in to accept quotation.', 'error');
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/accept-quotation`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ quotation_id: quotationId }),
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showToast('Quotation accepted successfully!', 'success');
                    // Optionally close quotation details modal and refresh orders/order details
                    setShowQuotationItemDetailsModal(false);
                    setShowOrderDetailsModal(false);
                    fetchOrders(); // Refresh main order list
                } else {
                    showToast(data.message || 'Failed to accept quotation.', 'error');
                }
            } catch (err) {
                console.error('Accept quotation error:', err);
                showToast('Failed to accept quotation. Please try again.', 'error');
            }
        });
        setShowConfirmModal(true);
    }, [getAuthToken, fetchOrders]);


    // Effect to fetch orders on component mount and when filters/page change
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            fetchOrders();
        }, 500); // Debounce search
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [fetchOrders]);

    // Effect to scroll chat to bottom
    useEffect(() => {
        if (chatMessagesEndRef.current) {
            chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [quotationMessages]);

    // Handle view details click for an order
    const handleViewDetails = (order) => {
        setSelectedOrder(order);
        setShowOrderDetailsModal(true);
        fetchOrderDetails(order.id);
        fetchQuotationsForOrder(order.id); // Fetch quotations when modal opens
    };

    // Handle view details for a specific quotation item (opens chat/quotation items modal)
    const handleViewQuotationDetails = (quotation) => {
        setSelectedQuotation(quotation);
        setShowQuotationItemDetailsModal(true);
        fetchQuotationMessages(quotation.id);
        fetchQuotationItemsDetails(quotation.id); // Fetch detailed items for this quotation
    };


    const handleCloseOrderDetailsModal = () => {
        setShowOrderDetailsModal(false);
        setSelectedOrder(null);
        setActiveOrderTab('details'); // Reset to details tab
    };

    const handleCloseQuotationDetailsModal = () => {
        setShowQuotationItemDetailsModal(false);
        setSelectedQuotation(null);
        setNewMessage(''); // Clear new message
    };

    const OrderCard = ({ order }) => {
        const isPendingOrInProgress = ['pending', 'in_progress'].includes(order.status);
        const hasQuotations = order.total_quotations_received > 0;

        return (
            <motion.div
                layoutId={`order-card-${order.id}`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out p-6 mb-4 flex flex-col justify-between border border-gray-200 dark:border-gray-700"
            >
                <div>
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                            <Tag className="inline-block mr-2 text-green-500" size={20} />
                            {order.order_name || `Order #${order.id}`}
                        </h3>
                        {isPendingOrInProgress && (
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                {order.status.replace(/_/g, ' ')}
                            </span>
                        )}
                    </div>

                    <div className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                        <p className="flex items-center mb-1">
                            <List className="inline-block mr-2 text-blue-400" size={16} />
                            Total Products: {order.total_products || 'N/A'}
                        </p>
                        <p className="flex items-start mb-1">
                            <MapPin className="inline-block mr-2 text-red-400 mt-0.5" size={16} />
                            Address: {order.delivery_address || 'N/A'}
                        </p>
                        <p className="flex items-center">
                            <Quote className="inline-block mr-2 text-purple-400" size={16} />
                            Quotations Received: {order.total_quotations_received}
                        </p>
                    </div>
                </div>
                <div className="flex justify-end space-x-3 mt-4">
                    {['pending', 'in_progress'].includes(order.status) && (
                        <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition duration-300 ease-in-out shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 neon-red"
                        >
                            <Ban size={16} className="mr-1" />
                            Cancel Order
                        </button>
                    )}
                    <button
                        onClick={() => handleViewDetails(order)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition duration-300 ease-in-out shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 neon-blue-dark"
                    >
                        <Eye size={16} className="mr-1" />
                        View More
                    </button>
                </div>
            </motion.div>
        );
    };

    const ConfirmationModal = ({ message, onConfirm, onCancel }) => (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Confirm Action</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-6">{message}</p>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-300"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </motion.div>
    );


    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'} transition-colors duration-300`}>
            <BuyerDashboardNavbar theme={theme} toggleTheme={toggleTheme} buyerUser={buyerUser} />

            <main className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">My Orders</h1>

                {/* Filters and Search */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
                    <div className="relative w-full md:w-1/3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1); // Reset to first page on search
                            }}
                        />
                    </div>

                    <div className="relative w-full md:w-1/3">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <select
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1); // Reset to first page on filter change
                            }}
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="accepted">Accepted</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                    </div>

                    {/* Pagination - Simplified, can be expanded */}
                    <div className="flex-grow flex justify-end items-center space-x-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1 || loadingOrders}
                            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="text-gray-700 dark:text-gray-300">Page {currentPage} of {totalPages}</span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || loadingOrders}
                            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>

                {loadingOrders && (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="w-10 h-10 animate-spin text-green-500" />
                    </div>
                )}

                {error && (
                    <div className="text-red-500 text-center py-4">{error}</div>
                )}

                {!loadingOrders && orders.length === 0 && !error && (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                        <ShoppingCart size={48} className="mx-auto mb-4" />
                        <p>No orders found.</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {orders.map((order) => (
                        <OrderCard key={order.id} order={order} />
                    ))}
                </div>
            </main>

            {/* Order Details Modal */}
            <AnimatePresence>
                {showOrderDetailsModal && selectedOrder && (
                    <motion.div
                        layoutId={`order-card-${selectedOrder.id}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{
                            layout: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 }
                        }}
                        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto"
                    >
                        <motion.div
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-4xl relative min-h-[80vh] flex flex-col"
                        >
                            {/* Close Button */}
                            <button
                                onClick={handleCloseOrderDetailsModal}
                                className="absolute top-4 right-4 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition duration-300"
                            >
                                <X size={24} />
                            </button>

                            {/* Order Header */}
                            <div className="mb-6 border-b pb-4 border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-2">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                                        <Tag className="inline-block mr-2 text-green-500" size={24} />
                                        {selectedOrder.order_name || `Order #${selectedOrder.id}`}
                                    </h2>
                                    {selectedOrder.status && (
                                        <span className={`px-4 py-1 rounded-full text-md font-medium ${getStatusColor(selectedOrder.status)}`}>
                                            {selectedOrder.status.replace(/_/g, ' ')}
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 flex items-start">
                                    <MapPin className="inline-block mr-2 text-red-400 mt-0.5" size={18} />
                                    Address: {selectedOrder.delivery_address || 'N/A'}
                                </p>
                            </div>

                            {/* Sub-navbar for Details/Quotations */}
                            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                                <button
                                    className={`py-2 px-4 text-lg font-medium ${activeOrderTab === 'details' ? 'border-b-2 border-green-500 text-green-500' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
                                    onClick={() => setActiveOrderTab('details')}
                                >
                                    Order Details
                                </button>
                                <button
                                    className={`py-2 px-4 text-lg font-medium ${activeOrderTab === 'quotations' ? 'border-b-2 border-green-500 text-green-500' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
                                    onClick={() => setActiveOrderTab('quotations')}
                                >
                                    Quotations ({quotations.length})
                                </button>
                            </div>

                            {/* Content based on active tab */}
                            {activeOrderTab === 'details' && (
                                <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                                    {loadingOrderDetails ? (
                                        <div className="flex justify-center items-center h-full">
                                            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                                        </div>
                                    ) : orderDetailError ? (
                                        <div className="text-red-500 text-center py-4">{orderDetailError}</div>
                                    ) : (
                                        <div>
                                            {/* Other details from selectedOrder that are available */}
                                            {selectedOrder.total_amount && (
                                                <p className="text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                                    <DollarSign size={18} className="mr-2 text-yellow-500" />
                                                    Total Order Value: ${parseFloat(selectedOrder.total_amount).toFixed(2)}
                                                </p>
                                            )}
                                            {selectedOrder.created_at && (
                                                <p className="text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                                    <Calendar size={18} className="mr-2 text-indigo-500" />
                                                    Created On: {new Date(selectedOrder.created_at).toLocaleDateString()}
                                                </p>
                                            )}
                                            {selectedOrder.accepted_seller_name && (
                                                <p className="text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                                    <CheckCircle size={18} className="mr-2 text-green-500" />
                                                    Accepted Seller: {selectedOrder.accepted_seller_name} ({selectedOrder.seller_phone})
                                                </p>
                                            )}
                                            {selectedOrder.general_note && (
                                                <p className="text-gray-700 dark:text-gray-300 mb-4 flex items-start">
                                                    <Info size={18} className="mr-2 text-blue-500 mt-0.5" />
                                                    General Note: {selectedOrder.general_note}
                                                </p>
                                            )}

                                            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3 mt-6 border-t pt-4 border-gray-200 dark:border-gray-700">Order Items</h3>
                                            {selectedOrder.items && selectedOrder.items.length > 0 ? (
                                                <ul className="space-y-3">
                                                    {selectedOrder.items.map((item, index) => (
                                                        <li key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md shadow-sm border border-gray-100 dark:border-gray-600">
                                                            <p className="font-medium text-gray-900 dark:text-white flex items-center mb-1">
                                                                <Package size={18} className="mr-2 text-purple-500" />
                                                                {item.product_name} (<span className="text-sm text-gray-600 dark:text-gray-400">{item.category_name}</span>)
                                                            </p>
                                                            <p className="text-gray-700 dark:text-gray-300 ml-7 mb-1">
                                                                Quantity: {item.requested_quantity} {item.unit_type}
                                                            </p>
                                                            {item.note && (
                                                                <p className="text-gray-700 dark:text-gray-300 ml-7 flex items-start">
                                                                    <Info size={16} className="mr-1 text-gray-500 mt-0.5" />
                                                                    Note: {item.note}
                                                                </p>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-gray-500 dark:text-gray-400">No items found for this order.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeOrderTab === 'quotations' && (
                                <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                                    <div className="flex flex-wrap gap-3 mb-4 sticky top-0 bg-white dark:bg-gray-800 py-2 z-10 border-b border-gray-200 dark:border-gray-700 -mx-6 px-6">
                                        {/* Item Match Filters */}
                                        <div className="flex items-center space-x-2">
                                            <span className="text-gray-700 dark:text-gray-300">Match Status:</span>
                                            {['all', 'full', 'partial', 'missing'].map(filter => (
                                                <button
                                                    key={filter}
                                                    onClick={() => setQuotationItemFilter(filter)}
                                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200
                                                        ${quotationItemFilter === filter
                                                        ? 'bg-green-500 text-white shadow-md'
                                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`
                                                    }
                                                >
                                                    {filter === 'full' ? 'Full Match' : filter === 'partial' ? 'Partial Match' : filter === 'missing' ? 'Missing Items' : 'All'}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Price/Distance Sort */}
                                        <div className="flex items-center space-x-2 ml-auto">
                                            <span className="text-gray-700 dark:text-gray-300">Sort By:</span>
                                            <select
                                                value={quotationSort}
                                                onChange={(e) => setQuotationSort(e.target.value)}
                                                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                                            >
                                                <option value="price_asc">Price: Low to High</option>
                                                <option value="price_desc">Price: High to Low</option>
                                                {/* <option value="distance_asc">Distance: Low to High</option>
                                                <option value="distance_desc">Distance: High to Low</option> */}
                                            </select>
                                        </div>
                                    </div>

                                    {loadingQuotations ? (
                                        <div className="flex justify-center items-center h-full">
                                            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                                        </div>
                                    ) : quotationError ? (
                                        <div className="text-red-500 text-center py-4">{quotationError}</div>
                                    ) : quotations.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {quotations.map((quotation) => (
                                                <div key={quotation.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg shadow-md p-5 border border-gray-100 dark:border-gray-600">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                            {quotation.seller_name || `Seller #${quotation.seller_id}`}
                                                        </h4>
                                                        <span className={`text-sm font-medium ${getMatchStatusColor(quotation.match_status)}`}>
                                                            {quotation.match_status}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                                        <MapPin size={16} className="mr-2 text-indigo-400" />
                                                        Distance: {quotation.distance ? `${quotation.distance.toFixed(1)} km` : 'N/A'}
                                                    </p>
                                                    <p className="text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                                                        <DollarSign size={16} className="mr-2 text-green-500" />
                                                        Total Price: ${parseFloat(quotation.total_price).toFixed(2)}
                                                    </p>
                                                    <div className="flex justify-end space-x-2">
                                                        {selectedOrder.status === 'pending' || selectedOrder.status === 'in_progress' ? (
                                                            <button
                                                                onClick={() => handleAcceptQuotation(selectedOrder.id, quotation.id)}
                                                                className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition duration-300"
                                                            >
                                                                <CheckCircle size={14} className="inline-block mr-1" /> Accept
                                                            </button>
                                                        ) : (
                                                            <span className="text-sm text-gray-500 dark:text-gray-400">Order {selectedOrder.status}</span>
                                                        )}
                                                        <button
                                                            onClick={() => handleViewQuotationDetails(quotation)}
                                                            className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition duration-300"
                                                        >
                                                            <MessageSquare size={14} className="inline-block mr-1" /> Chat / Details
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">No quotations received for this order yet.</p>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* Individual Quotation Details / Chat Modal */}
            <AnimatePresence>
                {showQuotationItemDetailsModal && selectedQuotation && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto"
                    >
                        <motion.div
                            initial={{ y: "100vh", opacity: 0 }}
                            animate={{ y: "0", opacity: 1 }}
                            exit={{ y: "100vh", opacity: 0 }}
                            transition={{ type: "spring", damping: 20, stiffness: 100 }}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-3xl h-[90vh] flex flex-col relative"
                        >
                            {/* Close Button */}
                            <button
                                onClick={handleCloseQuotationDetailsModal}
                                className="absolute top-4 right-4 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition duration-300"
                            >
                                <X size={24} />
                            </button>

                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 border-b pb-3 border-gray-200 dark:border-gray-700">
                                Chat with {selectedQuotation.seller_name || `Seller #${selectedQuotation.seller_id}`}
                            </h3>

                            {/* Quotation Details (Left Half) */}
                            <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
                                <div className="md:w-1/2 pr-4 overflow-y-auto custom-scrollbar border-r border-gray-200 dark:border-gray-700 md:pb-0 pb-4">
                                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Quotation Details</h4>
                                    <p className="text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                        <DollarSign size={16} className="mr-2 text-green-500" />
                                        Total Price: ${parseFloat(selectedQuotation.total_price).toFixed(2)}
                                    </p>
                                    {selectedQuotation.match_status && (
                                        <p className={`text-gray-700 dark:text-gray-300 mb-2 flex items-center ${getMatchStatusColor(selectedQuotation.match_status)}`}>
                                            <Info size={16} className="mr-2" />
                                            Item Match Status: {selectedQuotation.match_status}
                                        </p>
                                    )}
                                    {selectedQuotation.accepted_at && (
                                        <p className="text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                            <CheckCircle size={16} className="mr-2 text-green-500" />
                                            Accepted On: {new Date(selectedQuotation.accepted_at).toLocaleDateString()}
                                        </p>
                                    )}
                                    <h5 className="text-md font-semibold text-gray-800 dark:text-white mt-4 mb-2">Quoted Items:</h5>
                                    {loadingQuotationItems ? (
                                        <div className="flex justify-center py-4">
                                            <Loader2 className="w-6 h-6 animate-spin text-green-500" />
                                        </div>
                                    ) : quotationItemError ? (
                                        <div className="text-red-500">{quotationItemError}</div>
                                    ) : quotationItems.length > 0 ? (
                                        <ul className="space-y-2">
                                            {quotationItems.map(item => (
                                                <li key={item.id} className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                                                    <p className="font-medium text-gray-900 dark:text-white">{item.product_name}</p>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                                        Available: {item.available_quantity} {item.unit_type || ''} | Price: ${parseFloat(item.price_per_unit).toFixed(2)} / {item.unit_type || 'unit'}
                                                    </p>
                                                    {item.note && <p className="text-xs text-gray-600 dark:text-gray-400">Note: {item.note}</p>}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-gray-500 dark:text-gray-400">No items found for this quotation.</p>
                                    )}
                                </div>

                                {/* Chat Section (Right Half) */}
                                <div className="md:w-1/2 flex flex-col md:pl-4 mt-4 md:mt-0">
                                    <div className="flex-grow bg-gray-50 dark:bg-gray-700 rounded-lg p-4 overflow-y-auto custom-scrollbar mb-4 chat-box">
                                        {loadingChat ? (
                                            <div className="flex justify-center items-center h-full">
                                                <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                                            </div>
                                        ) : chatError ? (
                                            <div className="text-red-500 text-center">{chatError}</div>
                                        ) : quotationMessages.length > 0 ? (
                                            quotationMessages.map((msg) => (
                                                <div
                                                    key={msg.id}
                                                    className={`mb-3 p-3 rounded-lg max-w-[80%] ${msg.sender_id === buyerUser?.id ? 'bg-green-500 text-white ml-auto' : 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 mr-auto'}`}
                                                >
                                                    <p className="font-semibold text-sm mb-1">
                                                        {msg.sender_id === buyerUser?.id ? 'You' : (selectedQuotation.seller_name || `Seller #${selectedQuotation.seller_id}`)}
                                                    </p>
                                                    <p>{msg.message}</p>
                                                    <span className="block text-xs text-right opacity-75 mt-1">
                                                        {new Date(msg.timestamp).toLocaleString()}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 dark:text-gray-400 text-center">No messages yet. Start the conversation!</p>
                                        )}
                                        <div ref={chatMessagesEndRef} />
                                    </div>

                                    {/* Chat Input */}
                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="text"
                                            placeholder="Type your message..."
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') handleSendMessage();
                                            }}
                                            className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                                            disabled={loadingChat}
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={loadingChat || !newMessage.trim()}
                                            className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-full transition duration-300 ease-in-out shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Send size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Global Confirmation Modal */}
            <AnimatePresence>
                {showConfirmModal && (
                    <ConfirmationModal
                        message={confirmMessage}
                        onConfirm={() => confirmAction && confirmAction()}
                        onCancel={() => setShowConfirmModal(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default MyOrder;