
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, ArrowLeft, Users, Store, TrendingUp, ShoppingCart, Package, Settings } from "lucide-react";
import { mockUsers, mockOrders, productsTable } from "@/data/mockData";

const AdminDashboard = () => {
  const totalRevenue = mockOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalUsers = mockUsers.buyers.length + mockUsers.sellers.length;
  const totalProducts = productsTable.length;

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
            <h1 className="text-2xl font-bold gradient-text">Admin Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="text-sm">
              <User className="h-4 w-4 mr-2" />
              Administrator
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Platform Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-admin-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-admin-accent">₹{totalRevenue}</div>
              <p className="text-xs text-muted-foreground">Total transactions</p>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-admin-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-admin-accent">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {mockUsers.buyers.length} buyers, {mockUsers.sellers.length} sellers
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sellers</CardTitle>
              <Store className="h-4 w-4 text-admin-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-admin-accent">{mockUsers.sellers.length}</div>
              <p className="text-xs text-muted-foreground">Verified businesses</p>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products Listed</CardTitle>
              <ShoppingCart className="h-4 w-4 text-admin-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-admin-accent">{totalProducts}</div>
              <p className="text-xs text-muted-foreground">Across all categories</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link to="/admin/products">
            <Card className="glass-card hover-lift glow-effect cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center text-admin-accent">
                  <Package className="h-5 w-5 mr-2" />
                  Product Management
                </CardTitle>
                <CardDescription>
                  Add, edit, or remove products and categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage the central product library and categories
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/users">
            <Card className="glass-card hover-lift glow-effect cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center text-admin-accent">
                  <Users className="h-5 w-5 mr-2" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Manage buyers, sellers, and administrators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Block, suspend, or activate user accounts
                </p>
              </CardContent>
            </Card>
          </Link>

          <Card className="glass-card hover-lift glow-effect cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center text-admin-accent">
                <Settings className="h-5 w-5 mr-2" />
                System Settings
              </CardTitle>
              <CardDescription>
                Configure platform settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage system-wide configurations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Management Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Management */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Recent Users</CardTitle>
              <CardDescription>
                Latest user registrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Buyers */}
              <div className="space-y-2">
                <h4 className="font-semibold text-lg">Recent Buyers</h4>
                {mockUsers.buyers.slice(0, 3).map((buyer) => (
                  <div key={buyer.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{buyer.name}</p>
                      <p className="text-sm text-muted-foreground">{buyer.email}</p>
                    </div>
                    <Badge variant={buyer.status === "active" ? "default" : "secondary"}>
                      {buyer.status}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Sellers */}
              <div className="space-y-2">
                <h4 className="font-semibold text-lg">Recent Sellers</h4>
                {mockUsers.sellers.slice(0, 3).map((seller) => (
                  <div key={seller.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{seller.name}</p>
                      <p className="text-sm text-muted-foreground">{seller.email}</p>
                      <p className="text-xs text-muted-foreground">{seller.location}</p>
                    </div>
                    <Badge variant={seller.status === "active" ? "default" : "secondary"}>
                      {seller.status}
                    </Badge>
                  </div>
                ))}
              </div>
              
              <Link to="/admin/users">
                <Button className="w-full bg-gradient-to-r from-admin-accent to-purple-600 hover:from-purple-600 hover:to-admin-accent">
                  View All Users
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Platform Activity */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Recent Activity</CardTitle>
              <CardDescription>
                Latest transactions and platform events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="glass-card p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">Order {order.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.buyerName} • ₹{order.totalAmount}
                        </p>
                        <p className="text-xs text-muted-foreground">{order.date}</p>
                      </div>
                      <Badge 
                        variant={order.status === "Completed" ? "default" : "secondary"}
                        className={order.status === "Completed" ? "bg-green-500" : "bg-orange-500"}
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
