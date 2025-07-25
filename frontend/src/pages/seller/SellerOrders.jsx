import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CheckCircle, Clock, Package, Loader2, AlertCircle, CalendarDays, Eye } from "lucide-react";
import sellerAPI from '@/data/sellerAPI';
import { useToast } from '@/components/ui/use-toast';
import { cn } from "@/lib/utils";

const SellerOrders = () => {
  const [activeTab, setActiveTab] = useState('accepted'); // 'accepted' or 'history'
  const [acceptedOrders, setAcceptedOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [loadingAccepted, setLoadingAccepted] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [errorAccepted, setErrorAccepted] = useState(null);
  const [errorHistory, setErrorHistory] = useState(null);
  const [completionLoading, setCompletionLoading] = useState(null); // Stores orderId being completed
  const { toast } = useToast();

  // Pagination states
  const [acceptedPage, setAcceptedPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [acceptedHasMore, setAcceptedHasMore] = useState(true);
  const [historyHasMore, setHistoryHasMore] = useState(true);

  // Filter states for history
  const [historyFilters, setHistoryFilters] = useState({
    startDate: null,
    endDate: null,
    status: '',
  });

  const ITEMS_PER_PAGE = 10;

  // Function to fetch accepted orders
  const fetchAcceptedOrders = async (page) => {
    console.log(`[SellerOrders] Fetching accepted orders, page: ${page}`);
    setLoadingAccepted(true);
    setErrorAccepted(null);
    try {
      const response = await sellerAPI.getAcceptedOrders({ page, limit: ITEMS_PER_PAGE });
      console.log("[SellerOrders] getAcceptedOrders API response:", response);
      if (response.success) {
        if (page === 1) {
          setAcceptedOrders(response.data);
        } else {
          setAcceptedOrders((prev) => [...prev, ...response.data]);
        }
        setAcceptedHasMore(response.data.length === ITEMS_PER_PAGE);
        console.log("[SellerOrders] Accepted orders data set:", response.data);
      } else {
        setErrorAccepted(response.message || "Failed to fetch accepted orders.");
        toast({
          title: "Error",
          description: response.message || "Failed to load accepted orders.",
          variant: "destructive",
        });
        console.error("[SellerOrders] Error fetching accepted orders (API success: false):", response.message);
      }
    } catch (err) {
      console.error("[SellerOrders] Fetch accepted orders caught error:", err);
      setErrorAccepted("An unexpected error occurred while fetching accepted orders.");
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingAccepted(false);
      console.log("[SellerOrders] Finished fetching accepted orders. Loading state:", false);
    }
  };

  // Function to fetch order history
  const fetchOrderHistory = async (page) => {
    console.log(`[SellerOrders] Fetching order history, page: ${page}, filters:`, historyFilters);
    setLoadingHistory(true);
    setErrorHistory(null);
    try {
      const params = {
        page,
        limit: ITEMS_PER_PAGE,
        start_date: historyFilters.startDate ? format(historyFilters.startDate, 'yyyy-MM-dd') : undefined,
        end_date: historyFilters.endDate ? format(historyFilters.endDate, 'yyyy-MM-dd') : undefined,
        status: historyFilters.status || undefined,
      };
      const response = await sellerAPI.getOrderHistory(params);
      console.log("[SellerOrders] getOrderHistory API response:", response);
      if (response.success) {
        if (page === 1) {
          setHistoryOrders(response.data);
        } else {
          setHistoryOrders((prev) => [...prev, ...response.data]);
        }
        setHistoryHasMore(response.data.length === ITEMS_PER_PAGE);
        console.log("[SellerOrders] History orders data set:", response.data);
      } else {
        setErrorHistory(response.message || "Failed to fetch order history.");
        toast({
          title: "Error",
          description: response.message || "Failed to load order history.",
          variant: "destructive",
        });
        console.error("[SellerOrders] Error fetching order history (API success: false):", response.message);
      }
    } catch (err) {
      console.error("[SellerOrders] Fetch order history caught error:", err);
      setErrorHistory("An unexpected error occurred while fetching order history.");
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingHistory(false);
      console.log("[SellerOrders] Finished fetching order history. Loading state:", false);
    }
  };

  // Effect to load data based on active tab and page
  useEffect(() => {
    if (activeTab === 'accepted') {
      fetchAcceptedOrders(acceptedPage);
    } else {
      fetchOrderHistory(historyPage);
    }
  }, [activeTab, acceptedPage, historyPage]); // Dependencies added for completeness, though useCallback isn't used here

  // Effect to re-fetch history when filters change (reset page to 1)
  useEffect(() => {
    if (activeTab === 'history') {
      setHistoryPage(1); // Reset page to 1 when filters change
      fetchOrderHistory(1); // Fetch with new filters
    }
  }, [historyFilters]); // Dependency on historyFilters

  const handleLoadMoreAccepted = () => {
    if (acceptedHasMore && !loadingAccepted) {
      setAcceptedPage((prev) => prev + 1);
    }
  };

  const handleLoadMoreHistory = () => {
    if (historyHasMore && !loadingHistory) {
      setHistoryPage((prev) => prev + 1);
    }
  };

  const handleCompleteOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to mark this order as completed?")) {
      return;
    }
    setCompletionLoading(orderId);
    try {
      const response = await sellerAPI.completeOrder(orderId);
      if (response.success) {
        toast({
          title: "Order Completed",
          description: "Order marked as completed successfully!",
          variant: "default",
        });
        // Remove from accepted orders list
        setAcceptedOrders((prev) => prev.filter((order) => order.id !== orderId));
        // Optionally, refetch history to show it immediately there
        setHistoryPage(1); // Reset history page to 1 to show the newly completed order at the top
        await fetchOrderHistory(1);
      } else {
        toast({
          title: "Failed to Complete Order",
          description: response.message || "An error occurred.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Complete order error:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred while trying to complete the order.",
        variant: "destructive",
      });
    } finally {
      setCompletionLoading(null);
    }
  };

  const renderOrderCard = (order, isAcceptedTab) => (
    <Card key={order.id} className="glass-card mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 space-y-3 sm:space-y-0 sm:space-x-4">
      <div className="flex-1 w-full">
        {/* Changed from order_name to order_id */}
        <h3 className="text-lg font-semibold text-seller-accent">Order ID: {order.id}</h3>
        <p className="text-sm text-muted-foreground">Buyer: {order.buyer_name}</p>
        <p className="text-sm text-muted-foreground">Address: {order.delivery_address}</p>
        <p className="text-sm text-muted-foreground">Phone: {order.buyer_phone || 'N/A'}</p>
        {/* CORRECTED: Parse total_amount and accepted_quotation_amount */}
        <p className="text-sm text-muted-foreground">Amount: ₹{order.total_amount ? parseFloat(order.total_amount).toFixed(2) : 'N/A'}</p>
        <p className="text-sm text-muted-foreground">Accepted Quote: ₹{order.accepted_quotation_amount ? parseFloat(order.accepted_quotation_amount).toFixed(2) : 'N/A'}</p>
        <Badge
          className={cn(
            "mt-2 text-xs",
            order.status === "accepted" && "bg-blue-600 text-white",
            order.status === "completed" && "bg-green-600 text-white",
            order.status === "cancelled" && "bg-red-600 text-white",
            order.status === "pending" && "bg-yellow-600 text-white",
            order.status === "in_progress" && "bg-purple-600 text-white",
            order.status === "rejected" && "bg-gray-600 text-white", // Added rejected status styling
          )}
        >
          {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')} {/* Added .replace('_', ' ') for better display */}
        </Badge>
        <p className="text-xs text-muted-foreground mt-1">
          {order.created_at ? `Ordered on: ${new Date(order.created_at).toLocaleDateString()}` : ''}
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
        {isAcceptedTab && order.status === 'accepted' && (
          <Button
            size="sm"
            onClick={() => handleCompleteOrder(order.id)}
            disabled={completionLoading === order.id}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {completionLoading === order.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <><CheckCircle className="h-4 w-4 mr-2" /> Mark Complete</>
            )}
          </Button>
        )}
      </div>
    </Card>
  );

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-bold text-seller-primary">Seller Orders</h1>

      <div className="mb-6 flex justify-center space-x-4">
        <Button
          variant={activeTab === 'accepted' ? 'default' : 'outline'}
          className={cn(
            "flex-1 md:flex-none",
            activeTab === 'accepted' ? "bg-seller-accent text-white hover:bg-seller-accent/90" : "border-seller-accent text-seller-accent hover:bg-seller-accent/10"
          )}
          onClick={() => setActiveTab('accepted')}
        >
          <Clock className="h-5 w-5 mr-2" /> Accepted Orders
        </Button>
        <Button
          variant={activeTab === 'history' ? 'default' : 'outline'}
          className={cn(
            "flex-1 md:flex-none",
            activeTab === 'history' ? "bg-seller-accent text-white hover:bg-seller-accent/90" : "border-seller-accent text-seller-accent hover:bg-seller-accent/10"
          )}
          onClick={() => setActiveTab('history')}
        >
          <CalendarDays className="h-5 w-5 mr-2" /> Order History
        </Button>
      </div>

      {activeTab === 'accepted' && (
        <section>
          <Card className="glass-card mb-6">
            <CardHeader>
              <CardTitle>Your Accepted Orders</CardTitle>
              <CardDescription>Orders that you have accepted and are currently in progress.</CardDescription>
            </CardHeader>
          </Card>

          {loadingAccepted ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-seller-accent" />
              <p className="text-muted-foreground">Loading accepted orders...</p>
            </div>
          ) : errorAccepted ? (
            <div className="text-center py-8 text-red-500 flex flex-col items-center">
              <AlertCircle className="h-8 w-8 mb-2" />
              <p>{errorAccepted}</p>
            </div>
          ) : acceptedOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No accepted orders found.</p>
              <p className="text-sm text-muted-foreground">Start quoting on available orders to get new business!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {acceptedOrders.map((order) => renderOrderCard(order, true))}
            </div>
          )}

          {acceptedHasMore && (
            <div className="text-center mt-6">
              <Button onClick={handleLoadMoreAccepted} disabled={loadingAccepted} variant="outline">
                {loadingAccepted ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Load More Accepted Orders'}
              </Button>
            </div>
          )}
        </section>
      )}

      {activeTab === 'history' && (
        <section>
          <Card className="glass-card mb-6">
            <CardHeader>
              <CardTitle>Your Order History</CardTitle>
              <CardDescription>All your completed or past orders.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !historyFilters.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {historyFilters.startDate ? format(historyFilters.startDate, "PPP") : <span>Pick start date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={historyFilters.startDate}
                      onSelect={(date) => setHistoryFilters((prev) => ({ ...prev, startDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !historyFilters.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {historyFilters.endDate ? format(historyFilters.endDate, "PPP") : <span>Pick end date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={historyFilters.endDate}
                      onSelect={(date) => setHistoryFilters((prev) => ({ ...prev, endDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Select
                  value={historyFilters.status}
                  onValueChange={(value) => setHistoryFilters((prev) => ({ ...prev, status: value === "all" ? "" : value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {loadingHistory ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-seller-accent" />
              <p className="text-muted-foreground">Loading order history...</p>
            </div>
          ) : errorHistory ? (
            <div className="text-center py-8 text-red-500 flex flex-col items-center">
              <AlertCircle className="h-8 w-8 mb-2" />
              <p>{errorHistory}</p>
            </div>
          ) : historyOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No orders found in history with current filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {historyOrders.map((order) => renderOrderCard(order, false))}
            </div>
          )}

          {historyHasMore && (
            <div className="text-center mt-6">
              <Button onClick={handleLoadMoreHistory} disabled={loadingHistory} variant="outline">
                {loadingHistory ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Load More Order History'}
              </Button>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default SellerOrders;