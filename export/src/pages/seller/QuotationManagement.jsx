import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, Package, MapPin, Calculator, X, Check, Loader2, AlertCircle, Eye } from "lucide-react";
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
  // Removed showCancelConfirmation and showSendConfirmation states

  const [validationErrors, setValidationErrors] = useState({});

  const [searchQuery, setSearchQuery] = useState('');
  const [maxDistance, setMaxDistance] = useState('50');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const ITEMS_PER_PAGE = 10;

  const fetchAndFilterOrders = useCallback(async (currentPage, reset = false) => {
    setLoadingOrders(true);
    setErrorOrders(null);
    try {
      const params = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        max_distance: parseFloat(maxDistance),
        buyer_name: searchQuery,
      };

      console.log("Fetching available orders with params:", params);

      const response = await sellerAPI.filterOrders(params);
      if (response.success) {
        if (reset) {
          setAvailableOrders(response.data);
        } else {
          setAvailableOrders((prev) => [...prev, ...response.data]);
        }
        setHasMore(response.data.length === ITEMS_PER_PAGE);
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

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchAndFilterOrders(1, true);
  }, [maxDistance, searchQuery, fetchAndFilterOrders]);

  const handleLoadMore = () => {
    if (hasMore && !loadingOrders) {
      setPage((prev) => {
        const nextPage = prev + 1;
        fetchAndFilterOrders(nextPage);
        return nextPage;
      });
    }
  };

  const handleOpenQuotationForm = async (orderId) => {
    if (selectedOrderId === orderId) {
      setSelectedOrderId(null);
      setOrderDetails(null);
      return;
    }

    setSelectedOrderId(orderId);
    setOrderDetails(null);
    setQuotationItems([]);
    setDiscount('');
    setNotes('');
    setValidationErrors({});
    setLoadingOrderDetails(true);

    try {
      const currentOrder = availableOrders.find(o => o.id === orderId);
      if (!currentOrder) {
        toast.error("Order not found.");
        setSelectedOrderId(null);
        setLoadingOrderDetails(false);
        return;
      }

      const response = await sellerAPI.getOrderDetails(orderId);
      if (response.success) {
        setOrderDetails(response.data);
        setQuotationItems(response.data.items.map(item => ({
          order_item_id: item.id,
          product_name: item.product_name,
          requested_quantity: item.requested_quantity,
          quantity: item.quantity, // Added quantity from API response
          unit_type: item.unit_type,
          price_per_unit: '',
          available_quantity: item.requested_quantity,
        })));
      } else {
        toast.error(response.message || "Failed to load order details.");
        setSelectedOrderId(null);
      }
    } catch (err) {
      console.error("Fetch order details error:", err);
      toast.error("An error occurred while fetching order details.");
      setSelectedOrderId(null);
    } finally {
      setLoadingOrderDetails(false);
    }
  };


  const handleQuotationItemChange = (index, field, value) => {
    const updatedItems = [...quotationItems];
    let parsedValue = value === '' ? '' : parseFloat(value);

    if (field === 'available_quantity' && parsedValue === 0) {
        updatedItems[index]['price_per_unit'] = '';
        setValidationErrors(prevErrors => {
            const newErrors = { ...prevErrors };
            if (newErrors[updatedItems[index].order_item_id]) {
                delete newErrors[updatedItems[index].order_item_id]['price_per_unit'];
                if (Object.keys(newErrors[updatedItems[index].order_item_id]).length === 0) {
                    delete newErrors[updatedItems[index].order_item_id];
                }
            }
            return newErrors;
        });
    }

    updatedItems[index][field] = parsedValue;
    setQuotationItems(updatedItems);

    setValidationErrors(prevErrors => {
      const newErrors = { ...prevErrors };
      if (newErrors[updatedItems[index].order_item_id]) {
        delete newErrors[updatedItems[index].order_item_id][field];
        if (Object.keys(newErrors[updatedItems[index].order_item_id]).length === 0) {
          delete newErrors[updatedItems[index].order_item_id];
        }
      }
      return newErrors;
    });
  };

  const calculateTotalQuotationAmount = () => {
    let total = quotationItems.reduce((sum, item) => {
      const qty = parseFloat(item.available_quantity || 0);
      const price = parseFloat(item.price_per_unit || 0);
      return sum + (price * qty);
    }, 0);
    return Math.max(0, total - parseFloat(discount || 0));
  };

  // Renamed confirmSendQuotation to just sendQuotation as it's no longer a confirmation step
  const sendQuotation = async () => {
    setSendingQuotation(true);

    const itemsForAPI = quotationItems.map(item => ({
      order_item_id: item.order_item_id,
      price_per_unit: parseFloat(item.available_quantity) === 0 ? 0 : parseFloat(item.price_per_unit || 0),
      available_quantity: parseFloat(item.available_quantity || 0),
    }));

    try {
      const response = await sellerAPI.createQuotation({
        order_id: selectedOrderId,
        items: itemsForAPI,
        discount: parseFloat(discount || 0),
        notes: notes,
      });

      if (response.success) {
        toast.success("Your quotation has been successfully submitted!");
        // Update available orders immediately
        setAvailableOrders((prev) => prev.filter(order => order.id !== selectedOrderId));
        setSelectedOrderId(null); // Close the form
        setValidationErrors({});
      } else {
        toast.error(response.message || "An error occurred.");
      }
    } catch (err) {
      console.error("Create quotation error:", err);
      toast.error("An unexpected error occurred while sending quotation.");
    } finally {
      setSendingQuotation(false);
    }
  };


  const handleSubmitQuotation = () => {
    if (!selectedOrderId) return;

    const newErrors = {};

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
          } else {
              const parsedPrice = parseFloat(item.price_per_unit);
              if (isNaN(parsedPrice) || parsedPrice <= 0) {
                  newErrors[item.order_item_id].price_per_unit = `The price for "${item.product_name}" must be a number greater than 0.`;
              }
          }
      }

      if (isNaN(parsedQty) || parsedQty < 0) {
        newErrors[item.order_item_id].available_quantity = `The available quantity for "${item.product_name}" must be 0 or more.`;
      } else if (parsedQty > item.requested_quantity) {
        newErrors[item.order_item_id].available_quantity = `Available quantity for "${item.product_name}" cannot exceed requested quantity (${item.requested_quantity}).`;
      }

      if (Object.keys(newErrors[item.order_item_id]).length === 0) {
        delete newErrors[item.order_item_id];
      }
    }

    setValidationErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please correct the errors in the quotation form.");
      return;
    }

    // Directly call sendQuotation without confirmation
    sendQuotation();
  };

  const handleCancelQuotationForm = () => {
    // Directly close the form without confirmation
    setSelectedOrderId(null);
    setOrderDetails(null);
    setValidationErrors({}); // Clear any existing validation errors
  };

  const currentSelectedOrder = availableOrders.find(order => order.id === selectedOrderId);
  const totalRequestedQuantity = orderDetails?.items.reduce((sum, item) => sum + item.requested_quantity, 0) || 0;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-bold text-seller-primary">Quotation Management</h1>
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Available Orders to Quote</CardTitle>
          <CardDescription>Browse through orders posted by buyers and send your competitive quotations.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search-order">Search by Buyer Name</Label>
              <Input
                id="search-order"
                placeholder="Search by buyer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-auto">
              <Label htmlFor="max-distance">Max Distance (km)</Label>
              <Select value={maxDistance} onValueChange={setMaxDistance}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Max Distance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 km</SelectItem>
                  <SelectItem value="25">25 km</SelectItem>
                  <SelectItem value="50">50 km</SelectItem>
                  <SelectItem value="100">100 km</SelectItem>
                  <SelectItem value="200">200 km</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loadingOrders && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-seller-accent" />
              <p className="text-muted-foreground">Loading available orders...</p>
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
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No new orders available for quotation.</p>
              <p className="text-sm text-muted-foreground">Check back later or adjust your filters.</p>
            </div>
          )}

          <div className="space-y-4">
            {availableOrders.map((order) => (
              <React.Fragment key={order.id}>
                <Card className="border p-4 rounded-lg bg-card text-card-foreground shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between">
                  <div className="flex-1 w-full">
                    {/* Changed from order.order_name to Order ID: {order.id} */}
                    <h3 className="text-lg font-semibold text-seller-accent">Order ID: {order.id}</h3>
                    <p className="text-sm text-muted-foreground">Buyer: {order.buyer_name}</p>
                    <p className="text-sm text-muted-foreground flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                      {order.distance ? `${order.distance} km` : 'N/A'} from you {/* FIX applied here */}
                    </p>
                    <Badge className="mt-2 text-xs bg-yellow-600 text-white">
                      {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created: {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto mt-3 sm:mt-0">
                    <Link to={`/seller/orders/${order.id}/details`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:border-seller-accent"
                      >
                        <Eye className="h-4 w-4 mr-2" /> View Details
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      onClick={() => handleOpenQuotationForm(order.id)}
                      className="bg-gradient-to-r from-seller-accent to-orange-600 hover:from-orange-600 hover:to-seller-accent"
                    >
                      <Calculator className="h-4 w-4 mr-2" />
                      {selectedOrderId === order.id ? 'Close Quotation' : 'Send Quotation'}
                    </Button>
                  </div>
                </Card>

                {selectedOrderId === order.id && (
                  <Card className="glass-card mt-2 p-4">
                    <CardHeader className="p-0 mb-4">
                      <CardTitle>
                        {/* Updated this line as well for consistency */}
                        Send Quotation for Order ID: {currentSelectedOrder?.id || 'Loading...'}
                      </CardTitle>
                      <CardDescription>
                        Provide prices and available quantities for the requested items.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      {loadingOrderDetails ? (
                        <div className="text-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                          <p className="text-muted-foreground">Loading order details...</p>
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold">Buyer:</h4>
                              <p>{orderDetails?.buyer_name}</p>
                              <p className="text-sm text-muted-foreground">
                                ({totalRequestedQuantity} items requested)
                              </p>
                            </div>
                            <div>
                              <h4 className="font-semibold">Delivery Address:</h4>
                              <p>{orderDetails?.delivery_address}</p>
                            </div>
                          </div>

                          <h4 className="font-semibold mt-4">Order Items:</h4>
                          <div className="space-y-3">
                            {quotationItems.map((item, index) => (
                              <Card key={item.order_item_id} className="p-3 bg-gray-50 dark:bg-gray-800">
                                <div className="flex justify-between items-center mb-2">
                                  <p className="font-medium">{item.product_name}</p>
                                  {/* Updated the Badge to display item.quantity instead of item.requested_quantity */}
                                  <Badge variant="secondary">{item.quantity} {item.unit_type}</Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <Label htmlFor={`price-${index}`}>Price Per Unit (₹)</Label>
                                    <Input
                                      id={`price-${index}`}
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={item.price_per_unit}
                                      onChange={(e) => handleQuotationItemChange(index, 'price_per_unit', e.target.value)}
                                      placeholder="0.00"
                                      disabled={parseFloat(item.available_quantity) === 0}
                                      className={cn({
                                        "border-red-500": validationErrors[item.order_item_id]?.price_per_unit,
                                        "bg-gray-200 dark:bg-gray-700 cursor-not-allowed": parseFloat(item.available_quantity) === 0
                                      })}
                                    />
                                    {validationErrors[item.order_item_id]?.price_per_unit && (
                                      <p className="text-red-500 text-sm mt-1">
                                        {validationErrors[item.order_item_id].price_per_unit}
                                      </p>
                                    )}
                                  </div>
                                  <div>
                                    <Label htmlFor={`available-qty-${index}`}>Available Quantity</Label>
                                    <Input
                                      id={`available-qty-${index}`}
                                      type="number"
                                      min="0"
                                      value={item.available_quantity}
                                      onChange={(e) => handleQuotationItemChange(index, 'available_quantity', e.target.value)}
                                      placeholder={item.requested_quantity.toString()}
                                      className={cn({ "border-red-500": validationErrors[item.order_item_id]?.available_quantity })}
                                    />
                                    {validationErrors[item.order_item_id]?.available_quantity && (
                                      <p className="text-red-500 text-sm mt-1">
                                        {validationErrors[item.order_item_id].available_quantity}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                              <Label htmlFor="discount">Discount (₹)</Label>
                              <Input
                                id="discount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={discount}
                                onChange={(e) => setDiscount(e.target.value)}
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <Label htmlFor="total-amount">Total Quotation Amount</Label>
                              <Input
                                id="total-amount"
                                value={`₹${calculateTotalQuotationAmount().toFixed(2)}`}
                                readOnly
                                className="font-bold text-lg"
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <Textarea
                              id="notes"
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Any specific notes for the buyer..."
                              rows={3}
                            />
                          </div>

                          <div className="flex justify-end gap-2 mt-6">
                            <Button variant="outline" onClick={handleCancelQuotationForm}>
                              <X className="h-4 w-4 mr-2" /> Cancel
                            </Button>
                            <Button
                              type="button"
                              onClick={handleSubmitQuotation}
                              disabled={sendingQuotation}
                              className="bg-seller-accent hover:bg-seller-accent/90"
                            >
                              {sendingQuotation ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <>
                                  <Calculator className="h-4 w-4 mr-2" />
                                  Send Quotation
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </React.Fragment>
            ))}
          </div>

          {hasMore && (
            <div className="text-center mt-6">
              <Button onClick={handleLoadMore} disabled={loadingOrders} variant="outline">
                {loadingOrders ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Load More Orders'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuotationManagement;