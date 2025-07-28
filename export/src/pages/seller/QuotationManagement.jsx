import React, { useState, useEffect, useCallback, useRef } from "react"; // Import useRef
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  Search,
  Package,
  MapPin,
  Calculator,
  X,
  Check,
  Loader2,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Info
} from "lucide-react";
import sellerAPI from '@/data/sellerAPI';
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const QuotationManagement = () => {
  const [availableOrders, setAvailableOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [errorOrders, setErrorOrders] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
  const [quotationItems, setQuotationItems] = useState([]);
  const [discount, setDiscount] = useState('');
  const [notes, setNotes] = useState('');
  const [sendingQuotation, setSendingQuotation] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [maxDistance, setMaxDistance] = useState('50');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState(null);

  const ITEMS_PER_PAGE = 10;

  // Ref to store input elements for scrolling
  const inputRefs = useRef({});

  // Function to determine badge color based on order status
  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'pending':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      case 'accepted':
        return 'bg-green-500 hover:bg-green-600 text-white';
      case 'rejected':
        return 'bg-red-500 hover:bg-red-600 text-white';
      case 'completed':
        return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'cancelled':
        return 'bg-gray-500 hover:bg-gray-600 text-white';
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
  };

  // Callback to fetch and filter orders based on search query and distance
  const fetchAndFilterOrders = useCallback(async (page = 1) => {
    setLoadingOrders(true);
    setErrorOrders(null);
    try {
      const params = {
        page: page,
        limit: ITEMS_PER_PAGE,
        max_distance: parseFloat(maxDistance),
        buyer_name: searchQuery,
      };

      const response = await sellerAPI.filterOrders(params);
      if (response.success) {
        setAvailableOrders(response.data || []);
        setTotalPages(response.pagination?.total_pages || 1);
        setTotalOrders(response.pagination?.total_items || 0);
        setCurrentPage(page);
      } else {
        setErrorOrders(response.message || "Failed to fetch available orders.");
        toast.error(response.message || "Failed to load available orders.");
      }
    } catch (err) {
      console.error("Fetch available orders error:", err);
      setErrorOrders("An unexpected error occurred while fetching orders.");
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoadingOrders(false);
    }
  }, [maxDistance, searchQuery]);

  // Effect to refetch orders when filters change
  useEffect(() => {
    setCurrentPage(1);
    fetchAndFilterOrders(1);
  }, [maxDistance, searchQuery, fetchAndFilterOrders]);

  // Handler for pagination page changes
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && !loadingOrders) {
      fetchAndFilterOrders(newPage);
    }
  };

  // Handler to open the quotation form modal
  const handleOpenQuotationForm = async (orderId, isEdit = false, quotationData = null) => {
    setSelectedOrderId(orderId);
    setOrderDetails(null);
    setQuotationItems([]);
    setDiscount('');
    setNotes('');
    setValidationErrors({});
    setLoadingOrderDetails(true);
    setShowQuotationModal(true);
    setEditingQuotation(isEdit ? quotationData : null);

    try {
      const currentOrder = availableOrders.find(o => o.id === orderId);
      if (!currentOrder) {
        toast.error("Order not found.");
        setShowQuotationModal(false);
        setSelectedOrderId(null);
        setLoadingOrderDetails(false);
        return;
      }

      const response = await sellerAPI.getOrderDetails(orderId);
      if (response.success) {
        setOrderDetails(response.data);

        if (isEdit && quotationData) {
          // Populate form with existing quotation data for editing
          setQuotationItems(quotationData.items.map(item => ({
            order_item_id: item.order_item_id,
            product_name: item.product_name,
            requested_quantity: item.requested_quantity,
            quantity: item.quantity,
            unit_type: item.unit_type,
            price_per_unit: item.price_per_unit.toString(),
            available_quantity: item.available_quantity,
            notes: item.notes || '',
          })));
          setDiscount(quotationData.discount?.toString() || '');
          setNotes(quotationData.notes || '');
        } else {
          // New quotation - initialize with order details and item notes
          setQuotationItems(response.data.items.map(item => ({
            order_item_id: item.id,
            product_name: item.product_name,
            requested_quantity: item.requested_quantity,
            quantity: item.quantity,
            unit_type: item.unit_type,
            price_per_unit: '',
            available_quantity: item.requested_quantity,
            notes: item.notes || '', // Include item notes from order
            product_description: item.product_description || '', // Include product description
            category_name: item.category_name || '', // Include category
          })));
        }
      } else {
        toast.error(response.message || "Failed to load order details.");
        setShowQuotationModal(false);
        setSelectedOrderId(null);
      }
    } catch (err) {
      console.error("Fetch order details error:", err);
      toast.error("An error occurred while fetching order details.");
      setShowQuotationModal(false);
      setSelectedOrderId(null);
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  // Handler for changing values of quotation items (quantity, price)
  const handleQuotationItemChange = (index, field, value) => {
    const updatedItems = [...quotationItems];
    let parsedValue = value === '' ? '' : parseFloat(value);
    const currentItem = updatedItems[index];

    // If available quantity is set to 0, clear the price per unit
    if (field === 'available_quantity' && parsedValue === 0) {
      currentItem['price_per_unit'] = '';
      setValidationErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        if (newErrors[currentItem.order_item_id]) {
          delete newErrors[currentItem.order_item_id]['price_per_unit'];
          if (Object.keys(newErrors[currentItem.order_item_id]).length === 0) {
            delete newErrors[currentItem.order_item_id];
          }
        }
        return newErrors;
      });
    }

    // Add validation and toast for available_quantity exceeding requested_quantity
    if (field === 'available_quantity' && parsedValue > currentItem.requested_quantity) {
      toast.error(`Available quantity for "${currentItem.product_name}" cannot exceed requested quantity (${currentItem.requested_quantity}).`);
      // Add a validation error specifically for this field to highlight it
      setValidationErrors(prevErrors => ({
        ...prevErrors,
        [currentItem.order_item_id]: {
          ...prevErrors[currentItem.order_item_id],
          available_quantity: `Available quantity cannot exceed requested quantity (${currentItem.requested_quantity}).`
        }
      }));
      // Scroll to the problematic input field
      if (inputRefs.current[currentItem.order_item_id]) {
        inputRefs.current[currentItem.order_item_id].scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    } else if (field === 'available_quantity' && parsedValue <= currentItem.requested_quantity) {
      // Clear the specific validation error if the quantity becomes valid
      setValidationErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        if (newErrors[currentItem.order_item_id]?.available_quantity) {
          delete newErrors[currentItem.order_item_id].available_quantity;
          if (Object.keys(newErrors[currentItem.order_item_id]).length === 0) {
            delete newErrors[currentItem.order_item_id];
          }
        }
        return newErrors;
      });
    }

    currentItem[field] = parsedValue;
    setQuotationItems(updatedItems);

    // Clear validation error for the changed field (if it's not the quantity exceeding error)
    if (!(field === 'available_quantity' && parsedValue > currentItem.requested_quantity)) {
      setValidationErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        if (newErrors[currentItem.order_item_id]) {
          delete newErrors[currentItem.order_item_id][field];
          if (Object.keys(newErrors[currentItem.order_item_id]).length === 0) {
            delete newErrors[currentItem.order_item_id];
          }
        }
        return newErrors;
      });
    }
  };

  // Calculates the total amount for the quotation
  const calculateTotalQuotationAmount = () => {
    let total = quotationItems.reduce((sum, item) => {
      const qty = parseFloat(item.available_quantity || 0);
      const price = parseFloat(item.price_per_unit || 0);
      return sum + (price * qty);
    }, 0);
    return Math.max(0, total - parseFloat(discount || 0));
  };

  // Sends or updates the quotation via API
  const sendQuotation = async () => {
    setSendingQuotation(true);

    const itemsForAPI = quotationItems.map(item => ({
      order_item_id: item.order_item_id,
      price_per_unit: parseFloat(item.available_quantity) === 0 ? 0 : parseFloat(item.price_per_unit || 0),
      available_quantity: parseFloat(item.available_quantity || 0),
    }));

    try {
      let response;
      if (editingQuotation) {
        response = await sellerAPI.editQuotation(editingQuotation.id, {
          order_id: selectedOrderId,
          items: itemsForAPI,
          discount: parseFloat(discount || 0),
          notes: notes,
        });
      } else {
        response = await sellerAPI.createQuotation({
          order_id: selectedOrderId,
          items: itemsForAPI,
          discount: parseFloat(discount || 0),
          notes: notes,
        });
      }

      if (response.success) {
        toast.success(editingQuotation ? "Quotation updated successfully!" : "Your quotation has been successfully submitted!");
        // If it's a new quotation, remove the order from the available list
        if (!editingQuotation) {
          setAvailableOrders((prev) => prev.filter(order => order.id !== selectedOrderId));
        }
        closeQuotationModal();
        setValidationErrors({});
      } else {
        toast.error(response.message || "An error occurred.");
      }
    } catch (err) {
      console.error("Create/Edit quotation error:", err);
      toast.error("An unexpected error occurred while processing quotation.");
    } finally {
      setSendingQuotation(false);
    }
  };

  // Handles form submission, including validation
  const handleSubmitQuotation = () => {
    if (!selectedOrderId) return;

    const newErrors = {};
    let firstErrorItemId = null; // Track the ID of the first item with an error

    if (quotationItems.length === 0) {
      toast.error("This order has no items to quote. Cannot send an empty quotation.");
      return;
    }

    for (let item of quotationItems) {
      newErrors[item.order_item_id] = {};

      const parsedQty = parseFloat(item.available_quantity);

      if (parsedQty !== 0) {
        if (
            item.price_per_unit === "" ||
            item.price_per_unit === null ||
            item.price_per_unit === undefined
        ) {
          newErrors[item.order_item_id].price_per_unit = `Please enter the price per unit for "${item.product_name}".`;
          if (!firstErrorItemId) firstErrorItemId = item.order_item_id;
        } else {
          const parsedPrice = parseFloat(item.price_per_unit);
          if (isNaN(parsedPrice) || parsedPrice <= 0) {
            newErrors[item.order_item_id].price_per_unit = `The price for "${item.product_name}" must be a number greater than 0.`;
            if (!firstErrorItemId) firstErrorItemId = item.order_item_id;
          }
        }
      }

      if (isNaN(parsedQty) || parsedQty < 0) {
        newErrors[item.order_item_id].available_quantity = `The available quantity for "${item.product_name}" must be 0 or more.`;
        if (!firstErrorItemId) firstErrorItemId = item.order_item_id;
      } else if (parsedQty > item.requested_quantity) {
        newErrors[item.order_item_id].available_quantity = `Available quantity for "${item.product_name}" cannot exceed requested quantity (${item.requested_quantity}).`;
        if (!firstErrorItemId) firstErrorItemId = item.order_item_id;
      }

      if (Object.keys(newErrors[item.order_item_id]).length === 0) {
        delete newErrors[item.order_item_id];
      }
    }

    setValidationErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please correct the errors in the quotation form.");
      // Scroll to the first error found during submission
      if (firstErrorItemId && inputRefs.current[firstErrorItemId]) {
        inputRefs.current[firstErrorItemId].scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
      return;
    }

    sendQuotation();
  };

  // Closes the quotation modal and resets state
  const closeQuotationModal = () => {
    setShowQuotationModal(false);
    setSelectedOrderId(null);
    setOrderDetails(null);
    setEditingQuotation(null);
    setValidationErrors({});
    inputRefs.current = {}; // Clear refs on close
  };

  // Handles clicks outside the modal to close it
  const handleModalClick = (e) => {
    if (e.target === e.currentTarget) {
      closeQuotationModal();
    }
  };

  const currentSelectedOrder = availableOrders.find(order => order.id === selectedOrderId);
  const totalRequestedQuantity = orderDetails?.items.reduce((sum, item) => sum + item.requested_quantity, 0) || 0;

  // Pagination component for displaying page controls
  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 px-4 py-2 sm:py-0">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-0">
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalOrders)} of {totalOrders} orders
          </div>

          <div className="flex items-center space-x-2">
            <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loadingOrders}
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                    <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        disabled={loadingOrders}
                        className={cn(
                            "w-8 h-8 p-0",
                            currentPage === pageNum
                                ? "bg-orange-500 hover:bg-orange-600 text-white"
                                : "dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        )}
                    >
                      {pageNum}
                    </Button>
                );
              })}
            </div>

            <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loadingOrders}
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
    );
  };

  return (
      <div className="p-4 sm:p-6 space-y-6 min-h-screen bg-gray-50 dark:bg-gray-900">
        <h1 className="text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400">Quotation Management</h1>

        <Card className="shadow-lg border-0 bg-white dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl">Available Orders to Quote</CardTitle>
            <CardDescription className="text-orange-100 text-sm sm:text-base">
              Browse through orders posted by buyers and send your competitive quotations.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 w-full"> {/* Ensure it takes full width on small screens */}
                <Label htmlFor="search-order" className="text-gray-700 dark:text-gray-300 mb-1 block">Search by Buyer Name</Label>
                <Input
                    id="search-order"
                    placeholder="Search by buyer name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
              </div>
              <div className="w-full sm:w-auto sm:min-w-[150px]"> {/* Adjusted width for select */}
                <Label htmlFor="max-distance" className="text-gray-700 dark:text-gray-300 mb-1 block">Max Distance (km)</Label>
                <Select value={maxDistance} onValueChange={setMaxDistance}>
                  <SelectTrigger className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <SelectValue placeholder="Max Distance" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                    <SelectItem value="10" className="dark:text-white dark:hover:bg-gray-600">10 km</SelectItem>
                    <SelectItem value="25" className="dark:text-white dark:hover:bg-gray-600">25 km</SelectItem>
                    <SelectItem value="50" className="dark:text-white dark:hover:bg-gray-600">50 km</SelectItem>
                    <SelectItem value="100" className="dark:text-white dark:hover:bg-gray-600">100 km</SelectItem>
                    <SelectItem value="200" className="dark:text-white dark:hover:bg-gray-600">200 km</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loadingOrders && (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-500" />
                  <p className="text-gray-600 dark:text-gray-400">Loading available orders...</p>
                </div>
            )}

            {errorOrders && (
                <div className="text-center py-8 text-red-500 flex flex-col items-center">
                  <AlertCircle className="h-8 w-8 mb-2" />
                  <p>{errorOrders}</p>
                </div>
            )}

            {!loadingOrders && availableOrders.length === 0 && !errorOrders && (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No new orders available for quotation.</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">Check back later or adjust your filters.</p>
                </div>
            )}

            <div className="space-y-4">
              {availableOrders.map((order) => (
                  <Card key={order.id} className="border shadow-sm hover:shadow-md transition-shadow duration-200 bg-white dark:bg-gray-800 dark:border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                        <div className="flex-1 w-full sm:w-auto mb-3 sm:mb-0"> {/* Added responsive width and margin */}
                          <h3 className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                            Order ID: {order.id}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Buyer: {order.buyer_name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
                            {order.distance ? `${order.distance} km` : 'N/A'} from you
                          </p>
                          <Badge className={cn("mt-2 text-xs", getStatusColor(order.status))}>
                            {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'}
                          </Badge>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Created: {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto"> {/* Buttons stack on mobile */}
                          <Link to={`/seller/orders/${order.id}/details`} className="w-full sm:w-auto">
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full hover:border-orange-500 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </Button>
                          </Link>
                          <Button
                              size="sm"
                              onClick={() => handleOpenQuotationForm(order.id)}
                              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                          >
                            <Calculator className="h-4 w-4 mr-2" />
                            Send Quotation
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
              ))}
            </div>

            <PaginationControls />
          </CardContent>
        </Card>

        {/* Quotation Modal */}
        {showQuotationModal && (
            <div
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
                onClick={handleModalClick}
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-t-lg flex justify-between items-center flex-shrink-0">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold">
                      {editingQuotation ? 'Edit' : 'Send'} Quotation for Order ID: {currentSelectedOrder?.id || 'Loading...'}
                    </h2>
                    <p className="text-orange-100 text-xs sm:text-sm">
                      Provide prices and available quantities for the requested items.
                    </p>
                  </div>
                  <Button
                      variant="ghost"
                      size="sm"
                      onClick={closeQuotationModal}
                      className="text-white hover:bg-white hover:bg-opacity-20 flex-shrink-0"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {loadingOrderDetails ? (
                    <div className="flex-1 flex items-center justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                    </div>
                ) : (
                    <>
                      {/* Buyer/Address Info Section - Responsive Grid */}
                      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg">Buyer:</h4>
                            <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">{orderDetails?.buyer_name}</p>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                              ({totalRequestedQuantity} items requested)
                            </p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg">Delivery Address:</h4>
                            <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">{orderDetails?.delivery_address}</p>
                          </div>
                        </div>
                      </div>

                      {/* Scrollable Main Content for Order Items and Form Fields */}
                      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                        <div className="grid gap-6">
                          <div>
                            <h4 className="font-semibold mb-4 text-gray-900 dark:text-white text-lg sm:text-xl">Order Items:</h4>
                            <div className="space-y-4">
                              {quotationItems.map((item, index) => (
                                  <Card key={item.order_item_id} className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                                    <CardContent className="p-4">
                                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                                        <div className="flex-1">
                                          <p className="font-medium text-gray-900 dark:text-white text-base sm:text-lg">{item.product_name}</p>
                                          {item.product_description && (
                                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.product_description}</p>
                                          )}
                                          {item.category_name && (
                                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Category: {item.category_name}</p>
                                          )}
                                        </div>
                                        <Badge variant="secondary" className="dark:bg-gray-600 dark:text-gray-200 flex-shrink-0 text-sm">
                                          Requested: {item.requested_quantity} {item.unit_type}
                                        </Badge>
                                      </div>

                                      {/* Display buyer's note for each item if available */}
                                      {item.notes && (
                                          <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border-l-4 border-blue-400">
                                            <div className="flex items-start">
                                              <Info className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                                              <div>
                                                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Buyer's Note:</p>
                                                <p className="text-sm text-blue-700 dark:text-blue-400">{item.notes}</p>
                                              </div>
                                            </div>
                                          </div>
                                      )}

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                          <Label htmlFor={`available-qty-${index}`} className="text-gray-700 dark:text-gray-300 text-sm">
                                            Available Quantity
                                          </Label>
                                          <Input
                                              id={`available-qty-${index}`}
                                              type="number"
                                              min="0"
                                              value={item.available_quantity}
                                              onChange={(e) => handleQuotationItemChange(index, 'available_quantity', e.target.value)}
                                              placeholder={item.requested_quantity.toString()}
                                              ref={el => inputRefs.current[item.order_item_id] = el} // Assign ref here
                                              className={cn(
                                                  "dark:bg-gray-600 dark:border-gray-500 dark:text-white dark:placeholder-gray-400",
                                                  { "border-red-500": validationErrors[item.order_item_id]?.available_quantity }
                                              )}
                                          />
                                          {validationErrors[item.order_item_id]?.available_quantity && (
                                              <p className="text-red-500 text-sm mt-1">
                                                {validationErrors[item.order_item_id].available_quantity}
                                              </p>
                                          )}
                                        </div>
                                        <div>
                                          <Label htmlFor={`price-${index}`} className="text-gray-700 dark:text-gray-300 text-sm">
                                            Price Per Unit (₹)
                                          </Label>
                                          <Input
                                              id={`price-${index}`}
                                              type="number"
                                              step="0.01"
                                              min="0"
                                              value={item.price_per_unit}
                                              onChange={(e) => handleQuotationItemChange(index, 'price_per_unit', e.target.value)}
                                              placeholder="0.00"
                                              disabled={parseFloat(item.available_quantity) === 0}
                                              className={cn(
                                                  "dark:bg-gray-600 dark:border-gray-500 dark:text-white dark:placeholder-gray-400",
                                                  {
                                                    "border-red-500": validationErrors[item.order_item_id]?.price_per_unit,
                                                    "bg-gray-200 dark:bg-gray-800 cursor-not-allowed": parseFloat(item.available_quantity) === 0
                                                  }
                                              )}
                                          />
                                          {validationErrors[item.order_item_id]?.price_per_unit && (
                                              <p className="text-red-500 text-sm mt-1">
                                                {validationErrors[item.order_item_id].price_per_unit}
                                              </p>
                                          )}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="discount" className="text-gray-700 dark:text-gray-300 text-sm">Discount (₹)</Label>
                              <Input
                                  id="discount"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={discount}
                                  onChange={(e) => setDiscount(e.target.value)}
                                  placeholder="0.00"
                                  className="dark:bg-gray-600 dark:border-gray-500 dark:text-white dark:placeholder-gray-400"
                              />
                            </div>
                            <div>
                              <Label htmlFor="total-amount" className="text-gray-700 dark:text-gray-300 text-sm">Total Quotation Amount</Label>
                              <Input
                                  id="total-amount"
                                  value={`₹${calculateTotalQuotationAmount().toFixed(2)}`}
                                  readOnly
                                  className="font-bold text-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="notes" className="text-gray-700 dark:text-gray-300 text-sm">Notes (Optional)</Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any specific notes for the buyer..."
                                rows={3}
                                className="dark:bg-gray-600 dark:border-gray-500 dark:text-white dark:placeholder-gray-400"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                )}

                {/* Modal Footer */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-b-lg flex-shrink-0">
                  <Button
                      variant="outline"
                      onClick={closeQuotationModal}
                      className="w-full sm:w-auto dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <X className="h-4 w-4 mr-2" /> Cancel
                  </Button>
                  <Button
                      type="button"
                      onClick={handleSubmitQuotation}
                      disabled={sendingQuotation || loadingOrderDetails}
                      className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                  >
                    {sendingQuotation ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <>
                          {editingQuotation ? <Edit3 className="h-4 w-4 mr-2" /> : <Calculator className="h-4 w-4 mr-2" />}
                          {editingQuotation ? 'Update Quotation' : 'Send Quotation'}
                        </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
};

export default QuotationManagement;