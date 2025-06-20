import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Search, Package, MessageSquare, User, Eye, MapPin, Calculator, X, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const QuotationManagement = () => {
  const [orders, setOrders] = useState([
    {
      id: "ORD001",
      buyerName: "John Doe",
      items: [
        { name: "Turmeric Powder", quantity: "500g", requested: true },
        { name: "Basmati Rice", quantity: "5kg", requested: true },
        { name: "Red Lentils", quantity: "2kg", requested: true }
      ],
      totalItems: 3,
      distance: "2.5 km",
      date: "2024-01-15",
      address: "123 Main St, City",
      status: "pending"
    },
    {
      id: "ORD002",
      buyerName: "Jane Smith",
      items: [
        { name: "Coconut Oil", quantity: "1L", requested: true },
        { name: "Almonds", quantity: "500g", requested: true }
      ],
      totalItems: 2,
      distance: "1.8 km",
      date: "2024-01-14",
      address: "456 Oak Ave, City",
      status: "quoted"
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [distanceFilter, setDistanceFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [quotationItems, setQuotationItems] = useState([]);
  const [discount, setDiscount] = useState(0);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.buyerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDistance = distanceFilter === "all" || 
                           (distanceFilter === "near" && parseFloat(order.distance) <= 3) ||
                           (distanceFilter === "far" && parseFloat(order.distance) > 3);
    return matchesSearch && matchesDistance;
  });

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    // Initialize quotation items
    const items = order.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      pricePerUnit: 0,
      available: true,
      totalPrice: 0
    }));
    setQuotationItems(items);
    setDiscount(0);
  };

  const updateQuotationItem = (index, field, value) => {
    const updatedItems = [...quotationItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Calculate total price if price or availability changes
    if (field === 'pricePerUnit' || field === 'available') {
      if (updatedItems[index].available) {
        const quantity = parseFloat(updatedItems[index].quantity.replace(/[^\d.]/g, ''));
        updatedItems[index].totalPrice = updatedItems[index].pricePerUnit * quantity;
      } else {
        updatedItems[index].totalPrice = 0;
      }
    }
    
    setQuotationItems(updatedItems);
  };

  const calculateTotalQuotation = () => {
    const subtotal = quotationItems
      .filter(item => item.available)
      .reduce((sum, item) => sum + item.totalPrice, 0);
    return subtotal - discount;
  };

  const sendQuotation = () => {
    if (!selectedOrder) return;
    
    const availableItems = quotationItems.filter(item => item.available).length;
    const unavailableItems = quotationItems.filter(item => !item.available).length;
    
    toast({
      title: "Quotation Sent Successfully!",
      description: `Quotation for order ${selectedOrder.id} has been sent to ${selectedOrder.buyerName}`,
    });

    // Update order status
    setOrders(orders.map(order => 
      order.id === selectedOrder.id ? { ...order, status: "quoted" } : order
    ));
    
    setSelectedOrder(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-orange-500";
      case "quoted": return "bg-blue-500";
      case "accepted": return "bg-green-500";
      case "rejected": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/seller/dashboard">
              <Button variant="ghost" size="icon" className="hover-lift">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold gradient-text">Quotation Management</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="text-sm">
              <Package className="h-4 w-4 mr-2" />
              {filteredOrders.length} orders
            </Badge>
            <Button variant="ghost" size="icon" className="hover-lift">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filter */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle>Filter Orders</CardTitle>
            <CardDescription>
              Search and filter buyer orders by various criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search by order ID or buyer name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-12 pl-10 border-2 focus:border-seller-accent transition-colors"
                />
              </div>
              <Select value={distanceFilter} onValueChange={setDistanceFilter}>
                <SelectTrigger className="w-full md:w-48 h-12 border-2 focus:border-seller-accent">
                  <SelectValue placeholder="Filter by distance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Distances</SelectItem>
                  <SelectItem value="near">Within 3km</SelectItem>
                  <SelectItem value="far">Beyond 3km</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <div className="space-y-6">
          {filteredOrders.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="text-center py-12">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">No orders found</p>
                <p className="text-muted-foreground">Try adjusting your search or filters</p>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => (
              <Card key={order.id} className="glass-card hover-lift">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                      <CardDescription>
                        {order.date} • {order.totalItems} items • {order.distance} away
                      </CardDescription>
                    </div>
                    <Badge className={`${getStatusColor(order.status)} text-white`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">Buyer:</span> {order.buyerName}
                      </p>
                      <p className="text-sm flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="font-medium">Address:</span> {order.address}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Distance:</span> {order.distance}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewOrder(order)}
                            className="hover:border-seller-accent"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View & Quote
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-card max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Send Quotation - #{order.id}</DialogTitle>
                            <DialogDescription>
                              Set prices for available items and send quotation to {order.buyerName}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedOrder && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="font-medium">Buyer</p>
                                  <p className="text-muted-foreground">{selectedOrder.buyerName}</p>
                                </div>
                                <div>
                                  <p className="font-medium">Distance</p>
                                  <p className="text-muted-foreground">{selectedOrder.distance}</p>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <h4 className="font-semibold">Quotation Items</h4>
                                {quotationItems.map((item, index) => (
                                  <div key={index} className="glass-card p-4">
                                    <div className="flex items-center justify-between mb-4">
                                      <div>
                                        <h5 className="font-medium">{item.name}</h5>
                                        <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                                      </div>
                                      <Button
                                        variant={item.available ? "outline" : "destructive"}
                                        size="sm"
                                        onClick={() => updateQuotationItem(index, 'available', !item.available)}
                                      >
                                        {item.available ? <Check className="h-4 w-4 mr-1" /> : <X className="h-4 w-4 mr-1" />}
                                        {item.available ? "Available" : "Unavailable"}
                                      </Button>
                                    </div>
                                    
                                    {item.available && (
                                      <div className="grid grid-cols-3 gap-4">
                                        <div>
                                          <label className="text-sm font-medium">Price per unit (₹)</label>
                                          <Input
                                            type="number"
                                            placeholder="0.00"
                                            value={item.pricePerUnit || ""}
                                            onChange={(e) => updateQuotationItem(index, 'pricePerUnit', parseFloat(e.target.value) || 0)}
                                            className="mt-1"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Quantity</label>
                                          <Input
                                            value={item.quantity}
                                            disabled
                                            className="mt-1 bg-muted"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Total (₹)</label>
                                          <Input
                                            value={item.totalPrice.toFixed(2)}
                                            disabled
                                            className="mt-1 bg-muted font-semibold"
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>

                              <div className="glass-card p-4">
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-sm font-medium">Discount (₹)</label>
                                    <Input
                                      type="number"
                                      placeholder="0.00"
                                      value={discount || ""}
                                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                      className="mt-1 max-w-xs"
                                    />
                                  </div>
                                  
                                  <div className="text-right">
                                    <div className="space-y-2">
                                      <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span>₹{quotationItems.filter(item => item.available).reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Discount:</span>
                                        <span>-₹{discount.toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between text-lg font-bold">
                                        <span>Total:</span>
                                        <span>₹{calculateTotalQuotation().toFixed(2)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex justify-end space-x-2">
                                <DialogTrigger asChild>
                                  <Button variant="outline">Cancel</Button>
                                </DialogTrigger>
                                <Button
                                  onClick={sendQuotation}
                                  className="bg-gradient-to-r from-seller-accent to-orange-600 hover:from-orange-600 hover:to-seller-accent"
                                >
                                  <Calculator className="h-4 w-4 mr-2" />
                                  Send Quotation
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      {order.status === "quoted" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:border-seller-accent"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Chat
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default QuotationManagement;