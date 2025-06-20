
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store, User, ArrowLeft, TrendingUp, Package, Clock, CheckCircle, MessageSquare, FileText, BarChart3 } from "lucide-react";
import { mockOrders } from "@/data/mockData";

const SellerDashboard = () => {
  const totalRevenue = mockOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const completedOrders = mockOrders.filter(order => order.status === "Completed").length;
  const pendingOrders = mockOrders.filter(order => order.status === "In Progress").length;
  const totalQuotations = 8; // Mock data
  const acceptedQuotations = 3; // Mock data

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="hover-lift">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold gradient-text">Seller Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="text-sm">
              <Store className="h-4 w-4 mr-2" />
              Fresh Mart Store
            </Badge>
            <Button variant="ghost" size="icon" className="hover-lift">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-seller-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-seller-accent">₹{totalRevenue}</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-seller-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-seller-accent">{mockOrders.length}</div>
              <p className="text-xs text-muted-foreground">+3 new orders today</p>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{pendingOrders}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{completedOrders}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Quick Actions</CardTitle>
            <CardDescription>
              Access key seller features and manage your business
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/seller/quotations">
                <Button className="w-full h-20 bg-gradient-to-r from-seller-accent to-orange-600 hover:from-orange-600 hover:to-seller-accent flex flex-col space-y-2">
                  <Package className="h-6 w-6" />
                  <span>Manage Quotations</span>
                </Button>
              </Link>
              
              <Link to="/seller/my-quotations">
                <Button variant="outline" className="w-full h-20 border-seller-accent text-seller-accent hover:bg-seller-accent hover:text-white flex flex-col space-y-2">
                  <FileText className="h-6 w-6" />
                  <span>My Quotations</span>
                </Button>
              </Link>
              
              <Link to="/seller/analytics">
                <Button variant="outline" className="w-full h-20 border-seller-accent text-seller-accent hover:bg-seller-accent hover:text-white flex flex-col space-y-2">
                  <BarChart3 className="h-6 w-6" />
                  <span>Analytics</span>
                </Button>
              </Link>
              
              <Button variant="outline" className="w-full h-20 border-seller-accent text-seller-accent hover:bg-seller-accent hover:text-white flex flex-col space-y-2">
                <MessageSquare className="h-6 w-6" />
                <span>Messages</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quotation Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Quotation Summary</CardTitle>
              <CardDescription>Your quotation performance overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Quotations Sent:</span>
                  <span className="font-semibold">{totalQuotations}</span>
                </div>
                <div className="flex justify-between">
                  <span>Accepted Quotations:</span>
                  <span className="font-semibold text-green-500">{acceptedQuotations}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pending Responses:</span>
                  <span className="font-semibold text-orange-500">{totalQuotations - acceptedQuotations - 2}</span>
                </div>
                <div className="flex justify-between">
                  <span>Acceptance Rate:</span>
                  <span className="font-semibold text-seller-accent">
                    {Math.round((acceptedQuotations / totalQuotations) * 100)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates and actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Quotation accepted by John Doe</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Package className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">New order request from Jane Smith</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">New message in quotation QUO001</span>
                </div>
                <div className="flex items-center space-x-3">
                  <FileText className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">Quotation sent for order ORD003</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Recent Orders</CardTitle>
            <CardDescription>
              Manage your incoming orders and quotations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockOrders.map((order) => (
                <div key={order.id} className="glass-card p-4 hover-lift">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-4">
                        <h4 className="font-semibold">{order.id}</h4>
                        <Badge 
                          variant={order.status === "Completed" ? "default" : "secondary"}
                          className={order.status === "Completed" ? "bg-green-500" : "bg-orange-500"}
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Customer: {order.buyerName} • {order.date}
                      </p>
                      <div className="text-sm">
                        {order.items.length} items • Total: ₹{order.totalAmount}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-seller-accent text-seller-accent hover:bg-seller-accent hover:text-white"
                      >
                        View Details
                      </Button>
                      {order.status === "In Progress" && (
                        <Link to="/seller/quotations">
                          <Button 
                            size="sm"
                            className="bg-gradient-to-r from-seller-accent to-orange-600 hover:from-orange-600 hover:to-seller-accent"
                          >
                            Send Quotation
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SellerDashboard;
