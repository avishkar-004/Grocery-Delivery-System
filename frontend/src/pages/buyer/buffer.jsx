import React, { useState, useEffect, useCallback, useRef } from 'react';
import { IndianRupee } from 'lucide-react';

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
// Removed Framer Motion imports: import { motion, AnimatePresence } from 'framer-motion';

// Base URL for your backend API
const API_BASE_URL = 'http://localhost:3000'; // Replace with your actual backend URL

// Correct and only ConfirmationModal definition
const ConfirmationModal = ({ isOpen, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        // Increased z-index for confirmation modal to be on top of everything
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1001] p-4">
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
        </div>
    );
};
// Resizable Layout Component
const ResizableLayout = ({
                             selectedQuotation,
                             loadingQuotationItems,
                             quotationItemError,
                             quotationItems,
                             loadingChat,
                             chatError,
                             quotationMessages,
                             buyerUser,
                             chatMessagesEndRef,
                             newMessage,
                             setNewMessage,
                             handleSendMessage,
                             formatDateTime
                         }) => {
    const [chatWidth, setChatWidth] = useState(33.33); // Initial width percentage
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef(null);

    const handleMouseDown = (e) => {
        setIsDragging(true);
        e.preventDefault();
    };

    const handleMouseMove = (e) => {
        if (!isDragging || !containerRef.current) return;

        const container = containerRef.current;
        const containerRect = container.getBoundingClientRect();
        const mouseX = e.clientX - containerRect.left;
        const containerWidth = containerRect.width;

        // Calculate new chat width percentage (minimum 20%, maximum 60%)
        const newWidth = Math.min(Math.max((containerWidth - mouseX) / containerWidth * 100, 20), 60);
        setChatWidth(newWidth);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging]);

    const quotationWidth = 100 - chatWidth;

    return (
        <div
            ref={containerRef}
            className="flex flex-col lg:flex-row flex-grow overflow-hidden gap-0 relative select-none"
            style={{ cursor: isDragging ? 'col-resize' : 'default' }}
        >
            {/* Quotation Details (Left Side) */}
            <div
                className="overflow-y-auto custom-scrollbar pr-3"
                style={{ width: `${quotationWidth}%` }}
            >
                {loadingQuotationItems ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                    </div>
                ) : quotationItemError ? (
                    <div className="text-red-500 text-center py-4">{quotationItemError}</div>
                ) : quotationItems && Object.keys(quotationItems).length > 0 ? (
                    <div className="space-y-6">
                        {/* Seller Information */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Seller Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-gray-700 dark:text-gray-300 mb-1">
                                        <strong>Name:</strong> {quotationItems.seller_info?.name || 'N/A'}
                                    </p>
                                    <p className="text-gray-700 dark:text-gray-300 mb-1">
                                        <strong>Phone:</strong> {quotationItems.seller_info?.phone || 'N/A'}
                                    </p>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        <strong>Email:</strong> {quotationItems.seller_info?.email || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-700 dark:text-gray-300 mb-1">
                                        <strong>Address:</strong> {quotationItems.seller_info?.address || 'N/A'}
                                    </p>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        <strong>Distance:</strong> {quotationItems.delivery_info?.distance_km ? `${quotationItems.delivery_info.distance_km.toFixed(1)} km` : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Quotation Summary */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Quotation Summary</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        ₹{parseFloat(quotationItems.quotation_info?.total_amount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-red-600">
                                        ₹{parseFloat(quotationItems.quotation_info?.discount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Discount</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        ₹{(quotationItems.quotation_info?.calculated_grand_total || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Grand Total</p>
                                </div>
                            </div>
                            {quotationItems.quotation_info?.seller_notes && (
                                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                    <p className="text-sm text-gray-800 dark:text-gray-200">
                                        <strong>Seller Notes:</strong> {quotationItems.quotation_info.seller_notes}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Products */}
                        <div>
                            <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Quoted Products</h4>
                            <div className="space-y-4">
                                {quotationItems.products?.map(product => (
                                    <div key={product.product_id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                                        <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                            {product.product_name}
                                        </h5>
                                        <div className="space-y-2">
                                            {product.quantities?.map(quantity => {
                                                const requestedQty = quantity.requested_quantity || 0;
                                                const availableQty = quantity.available_quantity || 0;
                                                const isFullMatch = requestedQty === availableQty && availableQty > 0;
                                                const isPartialMatch = availableQty > 0 && availableQty < requestedQty;
                                                const isMissing = availableQty === 0;
                                                const missingQuantity = requestedQty - availableQty;

                                                return (
                                                    <div key={quantity.quotation_item_id} className={`p-3 rounded-md border-l-4 ${
                                                        isFullMatch ? 'bg-green-50 dark:bg-green-900/20 border-green-500' :
                                                            isPartialMatch ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500' :
                                                                'bg-red-50 dark:bg-red-900/20 border-red-500'
                                                    }`}>
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-grow">
                                                                <p className="font-medium text-gray-900 dark:text-white">
                                                                    Size: {quantity.quantity_size} ({quantity.unit_type})
                                                                </p>
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm">
                                                                    <div>
                                                                        <span className="text-gray-600 dark:text-gray-400">Requested:</span>
                                                                        <p className="font-medium">{requestedQty}</p>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-gray-600 dark:text-gray-400">Available:</span>
                                                                        <p className={`font-medium ${
                                                                            isFullMatch ? 'text-green-600' :
                                                                                isPartialMatch ? 'text-yellow-600' :
                                                                                    'text-red-600'
                                                                        }`}>
                                                                            {availableQty}
                                                                        </p>
                                                                    </div>
                                                                    {isPartialMatch && (
                                                                        <div>
                                                                            <span className="text-gray-600 dark:text-gray-400">Missing:</span>
                                                                            <p className="font-medium text-red-600">{missingQuantity}</p>
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <span className="text-gray-600 dark:text-gray-400">Price/Unit:</span>
                                                                        <p className="font-medium">₹{parseFloat(quantity.quoted_price_per_unit || 0).toFixed(2)}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right ml-4">
                                                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                                    ₹{parseFloat(quantity.total_price || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                                                                </p>
                                                                <p className={`text-sm px-2 py-1 rounded-full ${
                                                                    isFullMatch ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
                                                                        isPartialMatch ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' :
                                                                            'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                                                                }`}>
                                                                    {isFullMatch ? 'Full Match' : isPartialMatch ? 'Partial Match' : 'Not Available'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }) || []}
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                            <p className="text-right text-lg font-semibold text-gray-900 dark:text-white">
                                                Product Total: ₹{(product.product_total || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                                            </p>
                                        </div>
                                    </div>
                                )) || []}
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">No quotation details available.</p>
                )}
            </div>

            {/* Resizable Divider */}
            <div
                className="w-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 cursor-col-resize flex items-center justify-center group transition-colors duration-200 relative"
                onMouseDown={handleMouseDown}
            >
                <div className="w-1 h-8 bg-gray-400 dark:bg-gray-500 rounded-full group-hover:bg-gray-500 dark:group-hover:bg-gray-400 transition-colors duration-200"></div>
                <div className="absolute inset-0 -left-1 -right-1"></div> {/* Expand hit area */}
            </div>

            {/* Chat Section (Right Side) */}
            <div
                className="flex flex-col h-full pl-3"
                style={{ width: `${chatWidth}%` }}
            >
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white">Chat</h4>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        {Math.round(chatWidth)}% width
                    </div>
                </div>

                {/* Chat Messages Container */}
                <div className="flex-grow bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
                    <div className="flex-grow p-4 overflow-y-auto custom-scrollbar chat-box">
                        {loadingChat ? (
                            <div className="flex justify-center items-center h-full">
                                <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                            </div>
                        ) : chatError ? (
                            <div className="flex justify-center items-center h-full">
                                <div className="text-red-500 text-center bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                                    <p className="font-medium">Error loading chat</p>
                                    <p className="text-sm mt-1">{chatError}</p>
                                </div>
                            </div>
                        ) : quotationMessages.length > 0 ? (
                            <div className="space-y-4">
                                {quotationMessages.map((msg, index) => {
                                    const isCurrentUser = msg.sender_id === buyerUser?.id;
                                    const showAvatar = index === 0 || quotationMessages[index - 1]?.sender_id !== msg.sender_id;

                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex items-end gap-2 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
                                        >
                                            {/* Avatar placeholder */}
                                            {showAvatar && (
                                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-medium ${
                                                    isCurrentUser
                                                        ? 'bg-green-500 text-white'
                                                        : 'bg-blue-500 text-white'
                                                }`}>
                                                    {isCurrentUser ? 'Y' : 'S'}
                                                </div>
                                            )}

                                            {/* Message bubble */}
                                            <div className={`flex flex-col max-w-[70%] min-w-0 ${isCurrentUser ? 'items-end' : 'items-start'} ${!showAvatar ? (isCurrentUser ? 'mr-10' : 'ml-10') : ''}`}>
                                                {/* Sender name - only show for first message in sequence */}
                                                {showAvatar && (
                                                    <span className={`text-xs font-medium mb-1 px-1 ${
                                                        isCurrentUser ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
                                                    }`}>
                                                        {isCurrentUser ? 'You' : (selectedQuotation.seller_name || `Seller #${selectedQuotation.seller_id}`)}
                                                    </span>
                                                )}

                                                {/* Message content */}
                                                <div className={`px-4 py-3 rounded-2xl shadow-sm max-w-full ${
                                                    isCurrentUser
                                                        ? 'bg-green-500 text-white rounded-br-md'
                                                        : 'bg-blue-500 text-white rounded-bl-md'
                                                }`}>
                                                    <p className="text-sm leading-relaxed break-words break-all whitespace-pre-wrap word-wrap overflow-wrap-anywhere">
                                                        {msg.message}
                                                    </p>
                                                </div>

                                                {/* Timestamp */}
                                                <span className={`text-xs mt-1 px-1 ${
                                                    isCurrentUser ? 'text-gray-500' : 'text-gray-500 dark:text-gray-400'
                                                }`}>
                                                    {formatDateTime(msg.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex justify-center items-center h-full">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Send size={24} className="text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 font-medium">No messages yet</p>
                                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Start the conversation!</p>
                                </div>
                            </div>
                        )}
                        <div ref={chatMessagesEndRef} />
                    </div>

                    {/* Chat Input Section */}
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex items-end gap-3">
                            {/* Multi-line input */}
                            <div className="flex-grow relative">
                                <textarea
                                    placeholder="Type your message..."
                                    value={newMessage}
                                    onChange={(e) => {
                                        setNewMessage(e.target.value);
                                        // Auto-resize textarea
                                        e.target.style.height = 'auto';
                                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                                    }}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    rows={1}
                                    className="w-full p-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none transition-all duration-200"
                                    style={{ minHeight: '44px', maxHeight: '120px' }}
                                    disabled={loadingChat}
                                />

                                {/* Character counter for long messages */}
                                {newMessage.length > 100 && (
                                    <div className="absolute -bottom-5 right-0 text-xs text-gray-400">
                                        {newMessage.length}/500
                                    </div>
                                )}
                            </div>

                            {/* Send button */}
                            <button
                                onClick={handleSendMessage}
                                disabled={loadingChat || !newMessage.trim()}
                                className="flex-shrink-0 w-11 h-11 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:dark:bg-gray-600 text-white rounded-2xl transition-all duration-200 ease-in-out shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
                            >
                                {loadingChat ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <Send size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
                                )}
                            </button>
                        </div>

                        {/* Helper text */}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 px-1">
                            Press Enter to send, Shift + Enter for new line
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
const MyOrders = () => {

    const navigate = useNavigate();

    // --- State Management for Orders List ---
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [error, setError] = useState(null);

    // Filters for main order list
    // Changed statusFilter to an array for multi-choice selection
    const [statusFilter, setStatusFilter] = useState([]);
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
    const chatMessagesEndRef = useRef(null); // Ref for auto-scrolling chat

    // New state for quotation items (for a specific quotation's details)
    const [quotationItems, setQuotationItems] = useState({}); // Initialized as an empty object
    const [loadingQuotationItems, setLoadingQuotationItems] = useState(false);
    const [quotationItemError, setQuotationItemError] = useState(null);

    // Confirmation Modal State
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [confirmAction, setConfirmAction] = useState(null); // Corrected: Initialize with useState(null)

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
    const showToast = useCallback((message, type = 'info') => {
        console.log(`Toast (${type}): ${message}`);

        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 z-50 p-4 rounded-md text-white ${
            type === 'success' ? 'bg-green-500' :
                type === 'error' ? 'bg-red-500' :
                    type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
        }`;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 5000);
    }, []);

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

    // Function to format date and time
    const formatDateTime = (timestamp) => {
        if (!timestamp) return 'Invalid Date';

        try {
            const date = new Date(timestamp);

            if (isNaN(date.getTime())) return 'Invalid Date';

            const options = {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
                timeZone: 'Asia/Kolkata' // <-- Force IST here
            };

            return new Intl.DateTimeFormat('en-IN', options).format(date);
        } catch (e) {
            console.error("Error formatting date:", e);
            return 'Invalid Date';
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
            // Handle multi-choice status filter
            statusFilter.forEach(status => {
                queryParams.append('status', status);
            });

            if (searchQuery) {
                queryParams.append('search', searchQuery);
            }
            queryParams.append('page', currentPage);
            queryParams.append('limit', itemsPerPage);
            queryParams.append('sort', 'created_at'); // Default sort
            queryParams.append('order', 'desc'); // Default order

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
                // Ensure data.data.orders is an array before mapping
                const fetchedOrders = Array.isArray(data.data.orders) ? data.data.orders : [];

                const ordersWithSummary = await Promise.all(fetchedOrders.map(async (order) => {
                    const summaryResponse = await fetch(`${API_BASE_URL}/api/orders/${order.id}/quotation-summary`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    });
                    if (summaryResponse.ok) {
                        const summaryData = await summaryResponse.json();
                        // Ensure summaryData.data is an array before accessing length
                        return { ...order, total_quotations_received: Array.isArray(summaryData.data) ? summaryData.data.length : 0 };
                    }
                    return { ...order, total_quotations_received: 0 };
                }));
                setOrders(ordersWithSummary);
                setTotalPages(data.data.pagination?.totalPages || 1); // Use optional chaining for pagination
                setCurrentPage(data.data.pagination?.currentPage || 1);
            } else {
                setError(data.message || 'Failed to fetch orders');
                showToast(data.message || 'Failed to fetch orders', 'error');
                setOrders([]); // Ensure orders is an empty array on API failure
            }
        } catch (err) {
            console.error('Fetch orders error:', err);
            setError('Failed to load orders. Please try again.');
            showToast('Failed to load orders. Please try again.', 'error');
            setOrders([]); // Ensure orders is an empty array on catch
        } finally {
            setLoadingOrders(false);
        }
    }, [getAuthToken, statusFilter, searchQuery, currentPage, itemsPerPage, navigate, showToast]);

    const fetchOrderDetails = useCallback(async (orderId) => {
        setLoadingOrderDetails(true);
        setOrderDetailError(null); // Clear previous error
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
                console.warn(`Failed to fetch detailed order data: ${response.status}`);
                setLoadingOrderDetails(false);
                return;
            }

            const data = await response.json();
            if (data.success) {
                setSelectedOrder(prevOrder => ({
                    ...prevOrder,
                    ...data.data
                }));
            } else {
                console.warn('Order details API returned failure:', data.message);
            }
        } catch (err) {
            console.error('Fetch order details error:', err);
            console.warn('Failed to load detailed order data, using existing data');
        } finally {
            setLoadingOrderDetails(false);
        }
    }, [getAuthToken, showToast]);

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

            const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/quotations`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                // Ensure data.data.quotations is an array before mapping
                const fetchedQuotations = Array.isArray(data.data.quotations) ? data.data.quotations : [];

                let mappedQuotations = fetchedQuotations.map(q => ({
                    ...q,
                    total_price: parseFloat(q.total_amount),
                    price_per_unit: q.price_per_unit ? parseFloat(q.price_per_unit) : 0,
                    available_quantity: q.available_quantity || 'N/A',
                    is_available: q.is_available === 1 || q.is_available === true,
                }));

                // Fetch quotation summary to get match status and counts
                const summaryResponse = await fetch(`${API_BASE_URL}/api/orders/${orderId}/quotation-summary`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (summaryResponse.ok) {
                    const summaryData = await summaryResponse.json();
                    setQuotationSummary(summaryData.data || []);
                    mappedQuotations = mappedQuotations.map(q => {
                        const summary = (summaryData.data || []).find(s => s.quotation_id === q.id);
                        return {
                            ...q,
                            match_status: summary ? summary.match_status : 'N/A',
                            counts: summary ? summary.counts : { full: 0, partial: 0, missing: 0 }
                        };
                    });
                }

                // Apply filtering based on quotationItemFilter
                let filteredQuotations = mappedQuotations;
                if (quotationItemFilter !== 'all') {
                    filteredQuotations = mappedQuotations.filter(q => {
                        if (quotationItemFilter === 'full') return q.match_status === '✅ Full match';
                        if (quotationItemFilter === 'partial') return q.match_status === '⚠️ Partial match';
                        if (quotationItemFilter === 'missing') return q.match_status === '❌ Missing items';
                        return true;
                    });
                }

                // Apply sorting
                if (quotationSort === 'price_asc') {
                    filteredQuotations.sort((a, b) => a.total_price - b.total_price);
                } else if (quotationSort === 'price_desc') {
                    filteredQuotations.sort((a, b) => b.total_price - a.total_price);
                } else if (quotationSort === 'distance_asc') {
                    filteredQuotations.sort((a, b) => a.distance_km - b.distance_km);
                } else if (quotationSort === 'distance_desc') {
                    filteredQuotations.sort((a, b) => b.distance_km - a.distance_km);
                }

                setQuotations(filteredQuotations);
            } else {
                setQuotationError(data.message || 'Failed to fetch quotations');
                showToast(data.message || 'Failed to fetch quotations', 'error');
                setQuotations([]); // Ensure quotations is empty array on API failure
            }
        } catch (err) {
            console.error('Fetch quotations error:', err);
            setQuotationError('Failed to load quotations. Please try again.');
            showToast('Failed to load quotations. Please try again.', 'error');
            setQuotations([]); // Ensure quotations is empty array on catch
        } finally {
            setLoadingQuotations(false);
        }
    }, [getAuthToken, quotationSort, quotationItemFilter, showToast]);

// 2. ADD useEffect to refetch when filters change
    useEffect(() => {
        if (selectedOrder && showOrderDetailsModal && activeOrderTab === 'quotations') {
            fetchQuotationsForOrder(selectedOrder.id);
        }
    }, [quotationSort, quotationItemFilter, selectedOrder, showOrderDetailsModal, activeOrderTab, fetchQuotationsForOrder]);



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

            // First get the order ID from the quotation
            const orderResponse = await fetch(`${API_BASE_URL}/api/quotations/${quotationId}/order`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!orderResponse.ok) {
                throw new Error('Failed to get order information');
            }

            const orderData = await orderResponse.json();
            const orderId = orderData.data.order_id;

            // Now fetch messages using the order-based API
            const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/messages`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                setQuotationMessages(data.data.messages || []);
            } else {
                setChatError(data.message || 'Failed to fetch messages');
                showToast(data.message || 'Failed to fetch messages', 'error');
                setQuotationMessages([]);
            }
        } catch (err) {
            console.error('Fetch messages error:', err);
            setChatError('Failed to load messages. Please try again.');
            showToast('Failed to load messages. Please try again.', 'error');
            setQuotationMessages([]);
        } finally {
            setLoadingChat(false);
        }
    }, [getAuthToken, showToast]);


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

            // First get the order ID from the quotation
            const orderResponse = await fetch(`${API_BASE_URL}/api/quotations/${selectedQuotation.id}/order`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!orderResponse.ok) {
                throw new Error('Failed to get order information');
            }

            const orderData = await orderResponse.json();
            const orderId = orderData.data.order_id;

            // Send message using the order-based API
            const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    message: newMessage.trim(),
                    message_type: 'text'
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                setNewMessage('');
                // Refresh messages
                fetchQuotationMessages(selectedQuotation.id);
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
    }, [newMessage, selectedQuotation, getAuthToken, fetchQuotationMessages, showToast]);

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
                setQuotationItems(data.data || {}); // Ensure items is an object, adjusted from data.data.items || []
            } else {
                setQuotationItemError(data.message || 'Failed to fetch quotation items');
                showToast(data.message || 'Failed to fetch quotation items', 'error');
                setQuotationItems({}); // Ensure items is empty object on API failure
            }
        } catch (err) {
            console.error('Fetch quotation items error:', err);
            setQuotationItemError('Failed to load quotation items. Please try again.');
            showToast('Failed to load quotation items. Please try again.', 'error');
            setQuotationItems({}); // Ensure items is empty object on catch
        } finally {
            setLoadingQuotationItems(false);
        }
    }, [getAuthToken, showToast]);

    const handleCancelOrder = useCallback(async (orderId) => {
        setConfirmMessage('Are you sure you want to cancel this order? This action cannot be undone.');
        setConfirmAction(() => async () => {
            setShowConfirmModal(false);
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
                    fetchOrders();
                } else {
                    showToast(data.message || 'Failed to cancel order.', 'error');
                }
            } catch (err) {
                console.error('Cancel order error:', err);
                showToast('Failed to cancel order. Please try again.', 'error');
            }
        });
        setShowConfirmModal(true);
    }, [getAuthToken, fetchOrders, showToast]);

    const handleReorder = useCallback(async (order) => {
        setConfirmMessage(`Are you sure you want to reorder "${order.order_name || `Order #${order.id}`}"? This will create a new order with the same items.`);
        setConfirmAction(() => async () => {
            setShowConfirmModal(false);
            try {
                const token = getAuthToken();
                if (!token) {
                    showToast('Please log in to reorder.', 'error');
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/api/orders/${order.id}/reorder`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showToast('Order reordered successfully!', 'success');
                    navigate('/buyer/dashboard');
                } else {
                    showToast(data.message || 'Failed to reorder.', 'error');
                }
            } catch (err) {
                console.error('Reorder error:', err);
                showToast('Failed to reorder. Please try again.', 'error');
            }
        });
        setShowConfirmModal(true);
    }, [getAuthToken, navigate, showToast]);

    const handleAcceptQuotation = useCallback(async (orderId, quotationId) => {
        console.log('handleAcceptQuotation called with:', { orderId, quotationId }); // Debug log

        setConfirmMessage('Are you sure you want to accept this quotation? This will finalize the order with this seller.');
        setConfirmAction(() => async () => {
            console.log('Confirm action executing...'); // Debug log
            setShowConfirmModal(false);

            try {
                const token = getAuthToken();
                if (!token) {
                    showToast('Please log in to accept quotation.', 'error');
                    return;
                }

                console.log('Sending accept request...'); // Debug log
                const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/accept-quotation`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ quotation_id: quotationId }),
                });

                console.log('Response status:', response.status); // Debug log
                const data = await response.json();
                console.log('Response data:', data); // Debug log

                if (response.ok && data.success) {
                    showToast('Quotation accepted successfully!', 'success');
                    // Close modals
                    setShowQuotationItemDetailsModal(false);
                    setShowOrderDetailsModal(false);
                    // Refresh orders
                    await fetchOrders();
                } else {
                    showToast(data.message || 'Failed to accept quotation.', 'error');
                }
            } catch (err) {
                console.error('Accept quotation error:', err);
                showToast('Failed to accept quotation. Please try again.', 'error');
            }
        });
        setShowConfirmModal(true);
    }, [getAuthToken, fetchOrders, showToast]);

    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            fetchOrders();
        }, 500);
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [fetchOrders]);

    useEffect(() => {
        if (chatMessagesEndRef.current) {
            chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [quotationMessages]);

    // Function to handle multi-select filter changes
    const handleStatusFilterChange = (status) => {
        setCurrentPage(1); // Reset to first page on filter change
        setStatusFilter(prevFilters => {
            if (prevFilters.includes(status)) {
                // If 'All Statuses' is selected, clear all others and keep only 'All Statuses'
                if (status === '') {
                    return []; // If 'All Statuses' is deselected, clear all filters
                }
                return prevFilters.filter(f => f !== status);
            } else {
                // If a new status is selected, add it. If 'All Statuses' was active, remove it.
                if (status === '') {
                    return ['']; // Selecting 'All Statuses' should override others
                }
                return [...prevFilters.filter(f => f !== ''), status]; // Add new status, remove 'All Statuses' if present
            }
        });
    };

    const handleViewDetails = (order) => {
        setSelectedOrder(order);
        setShowOrderDetailsModal(true);
        setActiveOrderTab('details');
        fetchOrderDetails(order.id);
        fetchQuotationsForOrder(order.id);
    };

    const handleViewQuotationDetails = (quotation) => {
        setSelectedQuotation(quotation);
        setShowQuotationItemDetailsModal(true);
        fetchQuotationMessages(quotation.id);
        fetchQuotationItemsDetails(quotation.id);
    };


    const handleCloseOrderDetailsModal = () => {
        setShowOrderDetailsModal(false);
        setSelectedOrder(null);
        setActiveOrderTab('details');
        setOrderDetailError(null);
        setQuotations([]);
        setQuotationError(null);
    };

    const handleCloseQuotationDetailsModal = () => {
        setShowQuotationItemDetailsModal(false);
        setSelectedQuotation(null);
        setNewMessage('');
        setQuotationMessages([]);
        setChatError(null);
        setQuotationItems({}); // Reset to empty object
        setQuotationItemError(null);
    };


    const OrderCard = ({ order }) => {
        const isPendingOrInProgress = ['pending', 'in_progress'].includes(order.status);
        const isCancelled = order.status === 'cancelled';

        return (
            <div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out p-6 mb-4 flex flex-col justify-between border border-gray-200 dark:border-gray-700"
            >
                <div>
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                            <Tag className="inline-block mr-2 text-green-500" size={20} />
                            {order.order_name || `Order #${order.id}`}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                            {order.status.replace(/_/g, ' ')}
                        </span>
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
                    {isPendingOrInProgress && (
                        <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition duration-300 ease-in-out shadow-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            <Ban size={16} className="mr-1" />
                            Cancel Order
                        </button>
                    )}

                    {isCancelled && (
                        <button
                            onClick={() => handleReorder(order)}
                            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 transition duration-300 ease-in-out shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <ShoppingCart size={16} className="mr-1" />
                            Reorder
                        </button>
                    )}

                    <button
                        onClick={() => handleViewDetails(order)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition duration-300 ease-in-out shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <Eye size={16} className="mr-1" />
                        View More
                    </button>
                </div>
            </div>
        );
    };


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

                    {/* Multi-choice filter chips */}
                    <div className="w-full md:w-2/3 flex flex-wrap gap-2 justify-center md:justify-start">
                        {['', 'pending', 'in_progress', 'accepted', 'completed', 'cancelled'].map(status => (
                            <button
                                key={status}
                                onClick={() => handleStatusFilterChange(status)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                                    ${statusFilter.includes(status) || (statusFilter.length === 0 && status === '')
                                    ? 'bg-green-600 text-white shadow-md'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`
                                }
                            >
                                {status === '' ? 'All Statuses' : status.replace(/_/g, ' ')}
                            </button>
                        ))}
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
            {showOrderDetailsModal && selectedOrder && (
                <div
                    // Increased z-index for order details modal
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[999] p-4 overflow-y-auto"
                >
                    <div
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
                                        {/* Order Summary */}
                                        {selectedOrder.total_amount && (
                                            <p className="text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                                <IndianRupee size={18} className="mr-2 text-green-600" />
                                                Total Order Value: ₹{parseFloat(selectedOrder.total_amount).toFixed(2)}
                                            </p>
                                        )}
                                        {selectedOrder.created_at && (
                                            <p className="text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                                <Calendar size={18} className="mr-2 text-indigo-500" />
                                                Created On: {formatDateTime(selectedOrder.created_at)}
                                            </p>
                                        )}
                                        {selectedOrder.accepted_seller_name && (
                                            <p className="text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                                <CheckCircle size={18} className="mr-2 text-green-500" />
                                                Accepted Seller: {selectedOrder.accepted_seller_name} ({selectedOrder.seller_phone})
                                            </p>
                                        )}

                                        {/* General Note */}
                                        {selectedOrder.notes && (
                                            <div className="bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-4 py-3 rounded-md mb-5 flex items-start">
                                                <Info size={20} className="mr-2 mt-0.5 text-blue-500 dark:text-blue-300" />
                                                <div>
                                                    <p className="font-semibold">General Note:</p>
                                                    <p className="text-sm">{selectedOrder.notes}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Grouped Order Items */}
                                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3 mt-6 border-t pt-4 border-gray-200 dark:border-gray-700">
                                            Order Items
                                        </h3>

                                        {selectedOrder.items && selectedOrder.items.length > 0 ? (() => {
                                            const groupedItems = {};

                                            selectedOrder.items.forEach(item => {
                                                const key = item.product_name;
                                                if (!groupedItems[key]) {
                                                    groupedItems[key] = {
                                                        category_name: item.category_name,
                                                        product_description: item.product_description,
                                                        variants: []
                                                    };
                                                }
                                                groupedItems[key].variants.push({
                                                    id: item.id,
                                                    quantity: item.quantity,
                                                    requested_quantity: item.requested_quantity,
                                                    unit_type: item.unit_type,
                                                    note: item.notes
                                                });
                                            });

                                            return (
                                                <ul className="space-y-4">
                                                    {Object.entries(groupedItems).map(([productName, info]) => (
                                                        <li key={productName} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md shadow-sm border border-gray-100 dark:border-gray-600">
                                                            <p className="font-medium text-gray-900 dark:text-white flex items-center mb-1">
                                                                <Package size={18} className="mr-2 text-purple-500" />
                                                                {productName}
                                                                {info.category_name && (
                                                                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                                                ({info.category_name})
                                            </span>
                                                                )}
                                                            </p>
                                                            <p className="text-gray-600 dark:text-gray-400 text-sm ml-7 mb-2 italic">
                                                                {info.product_description}
                                                            </p>
                                                            <div className="ml-7 space-y-1">
                                                                {info.variants.map((variant, idx) => (
                                                                    <div key={variant.id || idx} className="text-gray-700 dark:text-gray-300">
                                                                        • {variant.quantity} ({variant.unit_type}) — Qty: {variant.requested_quantity}
                                                                        {variant.note && (
                                                                            <div className="flex items-start text-sm text-gray-500 dark:text-gray-400 ml-4">
                                                                                <Info size={14} className="mr-1 mt-0.5 text-gray-400" />
                                                                                Note: {variant.note}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            );
                                        })() : (
                                            <div className="text-center py-8">
                                                <Package size={48} className="mx-auto mb-4 text-gray-400" />
                                                <p className="text-gray-500 dark:text-gray-400">
                                                    {loadingOrderDetails ? 'Loading order items...' : 'No items found for this order.'}
                                                </p>
                                            </div>
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
                                        {['all', 'full', 'partial', 'missing'].map(filter => {
                                            const filterCount = quotationSummary.reduce((sum, q) => {
                                                if (filter === 'all') return quotations.length;
                                                return sum + (q.counts[filter] || 0);
                                            }, 0);

                                            return (
                                                <button
                                                    key={filter}
                                                    onClick={() => setQuotationItemFilter(filter)}
                                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2
                                ${quotationItemFilter === filter
                                                        ? 'bg-green-500 text-white shadow-md'
                                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`
                                                    }
                                                >
                                                    {filter === 'full' ? 'Full Match' : filter === 'partial' ? 'Partial Match' : filter === 'missing' ? 'Missing Items' : 'All'}
                                                    {/* Show count badge */}
                                                    {filterCount > 0 && (
                                                        <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded-full ${
                                                            filter === 'full' ? 'bg-green-600 text-white' :
                                                                filter === 'partial' ? 'bg-yellow-600 text-white' :
                                                                    filter === 'missing' ? 'bg-red-600 text-white' :
                                                                        'bg-blue-600 text-white'
                                                        }`}>
                                    {filter === 'all' ? quotations.length : filterCount}
                                </span>
                                                    )}
                                                </button>
                                            );
                                        })}
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
                                            <option value="distance_asc">Distance: Low to High</option>
                                            <option value="distance_desc">Distance: High to Low</option>
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
                                                    <div className="flex flex-col items-end gap-2">
                                <span className={`text-sm font-medium ${getMatchStatusColor(quotation.match_status || 'unknown')}`}>
                                    {quotation.match_status || 'Unknown'}
                                </span>
                                                        {/* Count badges */}
                                                        {quotation.counts && (
                                                            <div className="flex gap-1">
                                                                {quotation.counts.full > 0 && (
                                                                    <span className="inline-flex items-center px-2 py-1 text-xs font-bold leading-none text-white bg-green-600 rounded-full">
                                                {quotation.counts.full}
                                            </span>
                                                                )}
                                                                {quotation.counts.partial > 0 && (
                                                                    <span className="inline-flex items-center px-2 py-1 text-xs font-bold leading-none text-white bg-yellow-600 rounded-full">
                                                {quotation.counts.partial}
                                            </span>
                                                                )}
                                                                {quotation.counts.missing > 0 && (
                                                                    <span className="inline-flex items-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                                                {quotation.counts.missing}
                                            </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                                    <MapPin size={16} className="mr-2 text-indigo-400" />
                                                    Distance: {quotation.distance_km ? `${quotation.distance_km.toFixed(1)} km` : 'N/A'}
                                                </p>
                                                <p className="text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                                                    <IndianRupee size={16} className="mr-2 text-green-500" />
                                                    Total Price: ₹{parseFloat(quotation.total_amount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                                </p>
                                                <div className="flex justify-end space-x-2">
                                                    {selectedOrder.status === 'pending' || selectedOrder.status === 'in_progress' ? (
                                                        <button
                                                            onClick={() => {
                                                                console.log('Accept button clicked', {
                                                                    orderId: selectedOrder?.id,
                                                                    quotationId: quotation?.id
                                                                });
                                                                if (selectedOrder?.id && quotation?.id) {
                                                                    handleAcceptQuotation(selectedOrder.id, quotation.id);
                                                                } else {
                                                                    console.error('Missing order or quotation ID');
                                                                    showToast('Error: Missing order or quotation information', 'error');
                                                                }
                                                            }}
                                                            disabled={loadingChat}
                                                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-300 disabled:opacity-50"
                                                        >
                                                            {loadingChat ? (
                                                                <>
                                                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                                    Accepting...
                                                                </>
                                                            ) : (
                                                                'Accept Quotation'
                                                            )}
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
                                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">No quotations found for the selected filter.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Individual Quotation Details / Chat Modal */}
            {/* Individual Quotation Details / Chat Modal */}
            {showQuotationItemDetailsModal && selectedQuotation && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1000] p-4 overflow-y-auto"
                    onClick={(e) => {
                        // Close modal if clicking on backdrop
                        if (e.target === e.currentTarget) {
                            handleCloseQuotationDetailsModal();
                        }
                    }}
                >
                    <div
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-6xl h-[90vh] flex flex-col relative"
                        onClick={(e) => e.stopPropagation()} // Prevent modal close when clicking inside
                    >
                        {/* Close Button */}
                        <button
                            onClick={handleCloseQuotationDetailsModal}
                            className="absolute top-4 right-4 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition duration-300 z-10"
                        >
                            <X size={24} />
                        </button>

                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 border-b pb-3 border-gray-200 dark:border-gray-700">
                            Chat with {selectedQuotation.seller_name || `Seller #${selectedQuotation.seller_id}`}
                        </h3>

                        {/* Main Content with Resizable Layout */}
                        <ResizableLayout
                            selectedQuotation={selectedQuotation}
                            loadingQuotationItems={loadingQuotationItems}
                            quotationItemError={quotationItemError}
                            quotationItems={quotationItems}
                            loadingChat={loadingChat}
                            chatError={chatError}
                            quotationMessages={quotationMessages}
                            buyerUser={buyerUser}
                            chatMessagesEndRef={chatMessagesEndRef}
                            newMessage={newMessage}
                            setNewMessage={setNewMessage}
                            handleSendMessage={handleSendMessage}
                            formatDateTime={formatDateTime}
                        />
                    </div>
                </div>
            )}
            {/* Global Confirmation Modal */}
            <ConfirmationModal
                isOpen={showConfirmModal}
                message={confirmMessage}
                onConfirm={() => {
                    if (confirmAction && typeof confirmAction === 'function') {
                        confirmAction();
                    }
                }}
                onCancel={() => {
                    setShowConfirmModal(false);
                    setConfirmAction(null);
                }}
            />
        </div>
    );
};


export default MyOrders;