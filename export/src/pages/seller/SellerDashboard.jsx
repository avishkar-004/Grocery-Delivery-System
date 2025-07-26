import React, { useState, useEffect } from 'react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store, User, ArrowLeft, TrendingUp, Package, Clock, CheckCircle, MessageSquare, FileText, BarChart3, AlertCircle, Loader2, Sun, Moon } from "lucide-react";
import sellerAPI from '@/data/sellerAPI';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  // The toggleTheme function was commented out in the original code,
  // but if it were to be used, it would look like this:
  // const toggleTheme = () => {
  //   setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  // };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const dashboardResponse = await sellerAPI.getDashboardAnalytics();
        if (dashboardResponse.success) {
          setDashboardData({
            stats: {
              total_revenue: parseFloat(dashboardResponse.data.stats.total_revenue) || 0,
              total_completed_orders: parseFloat(dashboardResponse.data.stats.total_completed_orders) || 0,
              active_orders: parseFloat(dashboardResponse.data.stats.active_orders) || 0,
              avg_order_value: parseFloat(dashboardResponse.data.stats.avg_order_value) || 0,
            },
            quotationStats: {
              total_quotations: parseFloat(dashboardResponse.data.quotationStats.total_quotations) || 0,
              accepted_quotations: parseFloat(dashboardResponse.data.quotationStats.accepted_quotations) || 0,
              pending_quotations: parseFloat(dashboardResponse.data.quotationStats.pending_quotations) || 0,
              rejected_quotations: parseFloat(dashboardResponse.data.quotationStats.rejected_quotations) || 0,
            }
          });
        } else {
          setError(dashboardResponse.message || "Failed to fetch dashboard analytics.");
          toast({ title: "Error", description: dashboardResponse.message || "Failed to load dashboard data.", variant: "destructive" });
        }

        const ordersResponse = await sellerAPI.getAvailableOrders({ limit: 5 });
        if (ordersResponse.success) {
          setRecentOrders(ordersResponse.data);
        } else {
          setError(ordersResponse.message || "Failed to fetch recent orders.");
          toast({ title: "Error", description: ordersResponse.message || "Failed to load recent orders.", variant: "destructive" });
        }

      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        setError("An unexpected error occurred while loading dashboard data.");
        toast({ title: "Error", description: "An unexpected error occurred. Please try again.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast]);

  const formatCurrency = (value) => {
    const numValue = parseFloat(value);
    return typeof numValue === 'number' && !isNaN(numValue) ? `₹${numValue.toFixed(0)}` : 'N/A';
  };

  const formatPercentage = (value) => {
    const numValue = parseFloat(value);
    return typeof numValue === 'number' && !isNaN(numValue) ? `${numValue.toFixed(1)}%` : 'N/A';
  };

  return (
      <div className="p-4 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-seller-primary">Seller Dashboard</h1>
          {/* Theme Toggle Button (commented out as in original) */}
          {/* <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="rounded-full shadow-md"
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5 text-purple-600" />
          ) : (
            <Sun className="h-5 w-5 text-yellow-500" />
          )}
        </Button> */}
        </div>

        {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-seller-accent" />
              <p className="text-muted-foreground">Loading dashboard data...</p>
            </div>
        ) : error ? (
            <div className="text-center py-8 text-red-500 flex flex-col items-center">
              <AlertCircle className="h-12 w-12 mb-4" />
              <p className="text-xl font-medium">{error}</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Retry
              </Button>
            </div>
        ) : (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="glass-card text-center p-4">
                  <Store className="h-8 w-8 text-seller-accent mx-auto mb-2" />
                  <CardTitle className="text-2xl font-bold">
                    {formatCurrency(dashboardData?.stats?.total_revenue)}
                  </CardTitle>
                  <CardDescription>Total Revenue</CardDescription>
                </Card>

                <Card className="glass-card text-center p-4">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <CardTitle className="text-2xl font-bold">
                    {dashboardData?.stats?.total_completed_orders || 0}
                  </CardTitle>
                  <CardDescription>Completed Orders</CardDescription>
                </Card>

                <Card className="glass-card text-center p-4">
                  <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <CardTitle className="text-2xl font-bold">
                    {dashboardData?.stats?.active_orders || 0}
                  </CardTitle>
                  <CardDescription>Active Orders</CardDescription>
                </Card>

                <Card className="glass-card text-center p-4">
                  <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <CardTitle className="text-2xl font-bold">
                    {formatCurrency(dashboardData?.stats?.avg_order_value)}
                  </CardTitle>
                  <CardDescription>Avg. Order Value</CardDescription>
                </Card>
              </div>

              {/* Quotation Statistics */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Quotation Statistics</CardTitle>
                  <CardDescription>Overview of your quotation performance.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 glass-card rounded-lg">
                      <div className="text-2xl font-bold text-seller-accent">
                        {dashboardData?.quotationStats?.total_quotations || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Sent</div>
                    </div>
                    <div className="text-center p-4 glass-card rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {dashboardData?.quotationStats?.accepted_quotations || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Accepted</div>
                    </div>
                    <div className="text-center p-4 glass-card rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {dashboardData?.quotationStats?.pending_quotations || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Pending</div>
                    </div>
                    <div className="text-center p-4 glass-card rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {dashboardData?.quotationStats?.rejected_quotations || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Rejected</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Available Orders */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Recent Available Orders</CardTitle>
                  <CardDescription>New orders posted by buyers that you can quote on.</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentOrders.length > 0 ? (
                      recentOrders.map((order) => (
                          <div key={order.id} className="border p-4 rounded-lg bg-card text-card-foreground shadow-sm mb-3 last:mb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                            <div className="flex-1 w-full">
                              <h3 className="text-lg font-semibold text-seller-accent">Order ID: {order.id}</h3>
                              <p className="text-sm text-muted-foreground">Buyer: {order.buyer_name}</p>
                              <p className="text-sm text-muted-foreground">Address: {order.delivery_address}</p>
                              <Badge className="mt-2 text-xs bg-yellow-600 text-white">
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                Created: {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex space-x-2 mt-3 sm:mt-0">
                              <Link to={`/seller/orders/${order.id}/details`}>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-seller-accent text-seller-accent hover:bg-seller-accent hover:text-white"
                                >
                                  View Details
                                </Button>
                              </Link>
                              <Link to="/seller/quotations">
                                <Button
                                    size="sm"
                                    className="bg-gradient-to-r from-seller-accent to-orange-600 hover:from-orange-600 hover:to-seller-accent"
                                >
                                  Send Quotation
                                </Button>
                              </Link>
                            </div>
                          </div>
                      ))
                  ) : (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No orders available at the moment</p>
                        <p className="text-sm text-muted-foreground">Check back later for new opportunities</p>
                      </div>
                  )}
                </CardContent>
              </Card>
            </>
        )}
      </div>
  );
};

export default SellerDashboard;