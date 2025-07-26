import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, ArrowLeft, Package, User, MapPin, Phone, CalendarDays, DollarSign } from 'lucide-react';
import sellerAPI from '@/data/sellerAPI';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils'; // For classname utility

const SellerOrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await sellerAPI.getOrderDetails(orderId);
        if (response.success) {
          setOrderDetails(response.data);
        } else {
          setError(response.message || "Failed to fetch order details.");
          toast({
            title: "Error",
            description: response.message || "Failed to load order details.",
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error("Fetch order details error:", err);
        setError("An unexpected error occurred while fetching order details.");
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId, toast]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-seller-accent" />
        <p className="ml-4 text-xl text-muted-foreground mt-4">Loading order details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-red-600">
        <AlertCircle className="h-12 w-12 mb-4" />
        <p className="text-xl font-medium">Error: {error}</p>
        <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-xl text-muted-foreground">Order not found.</p>
        <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-3">
          <ArrowLeft className="h-6 w-6 text-muted-foreground" />
        </Button>
        <h1 className="text-3xl font-bold text-seller-primary">Order Details: {orderDetails.order_name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Summary Card */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
            <CardDescription>Key information about the order.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Order ID</p>
                <p className="text-lg font-semibold">{orderDetails.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge
                  className={cn(
                    "text-sm",
                    orderDetails.status === "pending" && "bg-yellow-600 text-white",
                    orderDetails.status === "accepted" && "bg-blue-600 text-white",
                    orderDetails.status === "completed" && "bg-green-600 text-white",
                    orderDetails.status === "cancelled" && "bg-gray-500 text-white",
                    orderDetails.status === "rejected" && "bg-red-600 text-white",
                    orderDetails.status === "in_progress" && "bg-purple-600 text-white",
                  )}
                >
                  {orderDetails.status.charAt(0).toUpperCase() + orderDetails.status.slice(1)}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <CalendarDays className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Order Date</p>
                  <p className="text-base">{new Date(orderDetails.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center">
                {/* Removed DollarSign icon as requested */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                  {/* Safely access total_amount and format it, ensuring 0.00 is displayed */}
                  <p className="text-base font-bold">
                    ₹{orderDetails.total_amount !== null && orderDetails.total_amount !== undefined && !isNaN(parseFloat(orderDetails.total_amount))
                      ? parseFloat(orderDetails.total_amount).toFixed(2)
                      : '0.00'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Buyer Information Card */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Buyer Information</CardTitle>
            <CardDescription>Details of the buyer who placed the order.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="flex items-center">
              <User className="h-5 w-5 mr-2 text-muted-foreground" />
              <p className="text-base font-medium">{orderDetails.buyer_name}</p>
            </div>
            <div className="flex items-center">
              <Phone className="h-5 w-5 mr-2 text-muted-foreground" />
              <p className="text-base">{orderDetails.buyer_phone || 'N/A'}</p>
            </div>
            <div className="flex items-start">
              <MapPin className="h-5 w-5 mr-2 mt-1 text-muted-foreground" />
              <p className="text-base">{orderDetails.delivery_address}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Items Card */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
          <CardDescription>List of all products included in this order.</CardDescription>
        </CardHeader>
        <CardContent>
          {orderDetails.items && orderDetails.items.length > 0 ? (
            <div className="space-y-4">
              {orderDetails.items.map((item) => (
                <Card key={item.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-lg text-seller-accent">{item.product_name}</h4>
                      <p className="text-sm text-muted-foreground">{item.product_description}</p>
                    </div>
                    {/* Displaying the actual product quantity from API */}
                    <Badge variant="secondary" className="text-base">
                      {item.quantity}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <p><span className="font-medium">Category:</span> {item.category_name}</p>
                    {/* Displaying the requested quantity by the buyer */}
                    <p><span className="font-medium">Requested Quantity:</span> {item.requested_quantity}</p>
                    {/* Displaying the actual product quantity from API explicitly */}
                    <p><span className="font-medium">Product Quantity:</span> {item.quantity}</p>
                    {item.price_per_unit && (
                      <p><span className="font-medium">Quoted Price/Unit:</span> ₹{item.price_per_unit.toFixed(2)}</p>
                    )}
                    {item.available_quantity !== undefined && (
                      <p><span className="font-medium">Quoted Available:</span> {item.available_quantity} {item.unit_type}</p>
                    )}
                    {item.total_price && (
                      <p><span className="font-medium">Item Total:</span> ₹{item.total_price.toFixed(2)}</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No items found for this order.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerOrderDetails;
