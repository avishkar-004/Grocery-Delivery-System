import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Search, Package, MessageSquare, RotateCcw, User, Eye } from "lucide-react";
import { mockOrders } from "@/data/mockData";
import { toast } from "@/hooks/use-toast";

const Orders = () => {
  const [orders, setOrders] = useState(mockOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.buyerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed": return "bg-green-500";
      case "In Progress": return "bg-blue-500";
      case "Accepted": return "bg-purple-500";
      case "Canceled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const reorderItems = (orderId) => {
    toast({
      title: "Reorder Initiated",
      description: `Reordering items from order ${orderId}`,
    });
  };

  const cancelOrder = (orderId) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: "Canceled" } : order
    ));
    toast({
      title: "Order Canceled",
      description: `Order ${orderId} has been canceled`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/buyer/dashboard">
              <Button variant="ghost" size="icon" className="hover-lift">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold gradient-text">My Orders</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="text-sm">
              <Package className="h-4 w-4 mr-2" />
              {orders.length} orders
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
            <CardTitle>Find Your Orders</CardTitle>
            <CardDescription>
              Search by order ID, name, or filter by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-12 pl-10 border-2 focus:border-buyer-accent transition-colors"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48 h-12 border-2 focus:border-buyer-accent">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Canceled">Canceled</SelectItem>
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
                        {order.date} • Total: ₹{order.totalAmount}
                      </CardDescription>
                    </div>
                    <Badge className={`${getStatusColor(order.status)} text-white`}>
                      {order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">Buyer:</span> {order.buyerName}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Items:</span> {Array.isArray(order.items) ? order.items.length : order.items} products
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Address:</span> {order.address}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                            className="hover:border-buyer-accent"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-card max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Order Details - #{order.id}</DialogTitle>
                            <DialogDescription>
                              Complete information about your order
                            </DialogDescription>
                          </DialogHeader>
                          {selectedOrder && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="font-medium text-sm">Order Date</p>
                                  <p className="text-sm text-muted-foreground">{selectedOrder.date}</p>
                                </div>
                                <div>
                                  <p className="font-medium text-sm">Total Amount</p>
                                  <p className="text-sm text-muted-foreground">₹{selectedOrder.totalAmount}</p>
                                </div>
                                <div>
                                  <p className="font-medium text-sm">Status</p>
                                  <Badge className={`${getStatusColor(selectedOrder.status)} text-white text-xs`}>
                                    {selectedOrder.status}
                                  </Badge>
                                </div>
                                <div>
                                  <p className="font-medium text-sm">Items Count</p>
                                  <p className="text-sm text-muted-foreground">
                                    {Array.isArray(selectedOrder.items) ? selectedOrder.items.length : selectedOrder.items} products
                                  </p>
                                </div>
                              </div>
                              
                              {Array.isArray(selectedOrder.items) && (
                                <div className="glass-card p-4">
                                  <h4 className="font-medium mb-2">Order Items</h4>
                                  <div className="space-y-2">
                                    {selectedOrder.items.map((item, index) => (
                                      <div key={index} className="flex justify-between text-sm">
                                        <span>{item.name} - {item.quantity}</span>
                                        <span>₹{item.price}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {selectedOrder.status === "In Progress" && (
                                <div className="glass-card p-4">
                                  <h4 className="font-medium mb-2">Available Actions</h4>
                                  <div className="flex space-x-2">
                                    <Button size="sm" variant="outline">
                                      <MessageSquare className="h-4 w-4 mr-2" />
                                      View Responses
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => cancelOrder(selectedOrder.id)}
                                      className="hover:border-red-500 hover:text-red-500"
                                    >
                                      Cancel Order
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      {order.status === "In Progress" && (
                        <>
                          <Link to={`/buyer/quotation-responses?orderId=${order.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="hover:border-buyer-accent"
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              View Responses
                            </Button>
                          </Link>
                        </>
                      )}
                      
                      {(order.status === "Completed" || order.status === "Canceled") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => reorderItems(order.id)}
                          className="hover:border-buyer-accent"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reorder
                        </Button>
                      )}
                      
                      {order.status === "In Progress" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelOrder(order.id)}
                          className="hover:border-red-500 hover:text-red-500"
                        >
                          Cancel
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

export default Orders;