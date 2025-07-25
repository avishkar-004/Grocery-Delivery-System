import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Loader2, AlertCircle, TrendingUp, Package, CalendarDays, BarChart3, User, DollarSign, Clock, Award } from "lucide-react";
import sellerAPI from '@/data/sellerAPI';
import { useToast } from '@/components/ui/use-toast';
// Removed unused recharts components as SimpleBarChart is imported separately
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import SimpleBarChart from './SimpleBarChart'; // Import the new chart component

const SellerAnalytics = () => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [productPerformance, setProductPerformance] = useState([]);
  const [customRangeAnalytics, setCustomRangeAnalytics] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingSales, setLoadingSales] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCustom, setLoadingCustom] = useState(false);
  const [errorDashboard, setErrorDashboard] = useState(null);
  const [errorSales, setErrorSales] = useState(null);
  const [errorProducts, setErrorProducts] = useState(null);
  const [errorCustom, setErrorCustom] = useState(null);
  const { toast } = useToast();

  // Sales analytics filters
  const [salesPeriod, setSalesPeriod] = useState('monthly');
  const [salesYear, setSalesYear] = useState(new Date().getFullYear().toString());

  // Custom range filters
  const [customStartDate, setCustomStartDate] = useState(subDays(new Date(), 30));
  const [customEndDate, setCustomEndDate] = useState(new Date());

  // Helper function to safely format numbers for currency
  const formatCurrency = (value, decimals = 0) => {
    // Ensure value is a number before attempting toFixed
    const numValue = parseFloat(value);
    return typeof numValue === 'number' && !isNaN(numValue) ? `₹${numValue.toFixed(decimals)}` : 'N/A';
  };

  // Fetch Dashboard Analytics
  useEffect(() => {
    const fetchDashboard = async () => {
      setLoadingDashboard(true);
      setErrorDashboard(null);
      try {
        const response = await sellerAPI.getDashboardAnalytics();
        if (response.success) {
          // Ensure numbers are parsed if they come as strings
          setDashboardStats({
            stats: {
              total_revenue: parseFloat(response.data.stats.total_revenue) || 0,
              total_completed_orders: parseFloat(response.data.stats.total_completed_orders) || 0,
              active_orders: parseFloat(response.data.stats.active_orders) || 0,
              avg_order_value: parseFloat(response.data.stats.avg_order_value) || 0,
            },
            quotationStats: { // Ensure these are also parsed if they might be strings
              total_quotations: parseFloat(response.data.quotationStats.total_quotations) || 0,
              accepted_quotations: parseFloat(response.data.quotationStats.accepted_quotations) || 0,
              pending_quotations: parseFloat(response.data.quotationStats.pending_quotations) || 0,
              rejected_quotations: parseFloat(response.data.quotationStats.rejected_quotations) || 0,
            }
          });
        } else {
          setErrorDashboard(response.message || "Failed to fetch dashboard stats.");
          toast({ title: "Error", description: response.message || "Failed to load dashboard stats.", variant: "destructive" });
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setErrorDashboard("An unexpected error occurred.");
        toast({ title: "Error", description: "An unexpected error occurred while loading dashboard.", variant: "destructive" });
      } finally {
        setLoadingDashboard(false);
      }
    };
    fetchDashboard();
  }, [toast]);

  // Fetch Sales Analytics
  useEffect(() => {
    const fetchSales = async () => {
      setLoadingSales(true);
      setErrorSales(null);
      try {
        const response = await sellerAPI.getSalesAnalytics({ period: salesPeriod, year: salesYear });
        if (response.success) {
          // Ensure data is sorted for chart display and values are numbers
          const sortedData = response.data.map(item => ({
            ...item,
            sales: parseFloat(item.revenue) || 0, // Ensure 'revenue' is a number
            orders: parseFloat(item.order_count) || 0, // Ensure 'order_count' is a number
          })).sort((a, b) => {
            if (salesPeriod === 'monthly') return a.period - b.period;
            if (salesPeriod === 'daily') return new Date(a.period) - new Date(b.period);
            return a.period - b.period; // For weekly, YEARWEEK is numeric
          });
          setSalesData(sortedData);
        } else {
          setErrorSales(response.message || "Failed to fetch sales analytics.");
          toast({ title: "Error", description: response.message || "Failed to load sales data.", variant: "destructive" });
        }
      } catch (err) {
        console.error("Sales fetch error:", err);
        setErrorSales("An unexpected error occurred.");
        toast({ title: "Error", description: "An unexpected error occurred while loading sales data.", variant: "destructive" });
      } finally {
        setLoadingSales(false);
      }
    };
    fetchSales();
  }, [salesPeriod, salesYear, toast]);

  // Fetch Product Performance Analytics
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      setErrorProducts(null);
      try {
        const response = await sellerAPI.getProductAnalytics();
        if (response.success) {
          // Ensure numeric values are parsed
          setProductPerformance(response.data.map(product => ({
            ...product,
            order_count: parseFloat(product.order_count) || 0,
            total_quantity_sold: parseFloat(product.total_quantity_sold) || 0,
            avg_price: parseFloat(product.avg_price) || 0,
          })));
        } else {
          setErrorProducts(response.message || "Failed to fetch product performance.");
          toast({ title: "Error", description: response.message || "Failed to load product performance.", variant: "destructive" });
        }
      } catch (err) {
        console.error("Product fetch error:", err);
        setErrorProducts("An unexpected error occurred.");
        toast({ title: "Error", description: "An unexpected error occurred while loading product data.", variant: "destructive" });
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [toast]);

  // Fetch Custom Range Analytics
  const fetchCustomAnalytics = async () => {
    if (!customStartDate || !customEndDate) {
      toast({ title: "Validation", description: "Please select both start and end dates.", variant: "destructive" });
      return;
    }
    setLoadingCustom(true);
    setErrorCustom(null);
    try {
      const response = await sellerAPI.getCustomRangeAnalytics(
        format(customStartDate, 'yyyy-MM-dd'),
        format(customEndDate, 'yyyy-MM-dd')
      );
      if (response.success) {
        // Ensure summary and dailyBreakdown values are numbers
        setCustomRangeAnalytics({
          summary: {
            total_orders: parseFloat(response.data.summary.total_orders) || 0,
            total_revenue: parseFloat(response.data.summary.total_revenue) || 0,
            avg_order_value: parseFloat(response.data.summary.avg_order_value) || 0,
            unique_customers: parseFloat(response.data.summary.unique_customers) || 0,
          },
          dailyBreakdown: response.data.dailyBreakdown.map(item => ({
            ...item,
            revenue: parseFloat(item.revenue) || 0, // Ensure revenue is a number for chart
            order_count: parseFloat(item.order_count) || 0,
          }))
        });
      } else {
        setErrorCustom(response.message || "Failed to fetch custom range analytics.");
        toast({ title: "Error", description: response.message || "Failed to load custom analytics.", variant: "destructive" });
      }
    } catch (err) {
      console.error("Custom analytics fetch error:", err);
      setErrorCustom("An unexpected error occurred.");
      toast({ title: "Error", description: "An unexpected error occurred while loading custom analytics.", variant: "destructive" });
    } finally {
      setLoadingCustom(false);
    }
  };

  // Initial fetch for custom analytics on component mount
  useEffect(() => {
    fetchCustomAnalytics();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-bold text-seller-primary">Seller Analytics</h1>

      {/* Overview Stats */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Overall Performance</CardTitle>
          <CardDescription>Key metrics for your seller account.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingDashboard ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-seller-accent" />
              <p className="text-muted-foreground">Loading overview stats...</p>
            </div>
          ) : errorDashboard ? (
            <div className="text-center py-8 text-red-500 flex flex-col items-center">
              <AlertCircle className="h-8 w-8 mb-2" />
              <p>{errorDashboard}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 glass-card rounded-lg">
                <div className="text-2xl font-bold text-seller-accent">
                  {/* Safely display total_revenue */}
                  {formatCurrency(dashboardStats?.stats?.total_revenue / 1000)}k
                </div>
                <div className="text-sm text-muted-foreground">Total Revenue</div>
              </div>
              <div className="text-center p-4 glass-card rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {dashboardStats?.stats?.total_completed_orders || 0}
                </div>
                <div className="text-sm text-muted-foreground">Completed Orders</div>
              </div>
              <div className="text-center p-4 glass-card rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {dashboardStats?.stats?.active_orders || 0}
                </div>
                <div className="text-sm text-muted-foreground">Active Orders</div>
              </div>
              <div className="text-center p-4 glass-card rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {/* Safely display avg_order_value */}
                  {formatCurrency(dashboardStats?.stats?.avg_order_value)}
                </div>
                <div className="text-sm text-muted-foreground">Avg. Order Value</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sales Analytics */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Monthly Revenue Trend</CardTitle>
          <CardDescription>Detailed revenue analysis with growth indicators.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="sales-period">Period</Label>
              <Select value={salesPeriod} onValueChange={setSalesPeriod}>
                <SelectTrigger id="sales-period">
                  <SelectValue placeholder="Select Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="sales-year">Year</Label>
              <Select value={salesYear} onValueChange={setSalesYear}>
                <SelectTrigger id="sales-year">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loadingSales ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-seller-accent" />
              <p className="text-muted-foreground">Loading sales data...</p>
            </div>
          ) : errorSales ? (
            <div className="text-center py-8 text-red-500 flex flex-col items-center">
              <AlertCircle className="h-8 w-8 mb-2" />
              <p>{errorSales}</p>
            </div>
          ) : salesData.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No sales data available for this period.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {salesData.slice(0, 3).map((item, index) => (
                  <div key={index} className="text-center p-4 glass-card rounded-lg">
                    <div className="text-2xl font-bold text-seller-accent">
                      {/* Safely display item.sales */}
                      {formatCurrency(item.sales / 1000)}k
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {salesPeriod === 'monthly' && ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][item.period - 1]}
                      {salesPeriod === 'daily' && format(new Date(item.period), 'MMM dd, yyyy')}
                      {salesPeriod === 'weekly' && `Week ${item.period.toString().slice(4)}`}
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      {item.orders} orders
                    </div>
                  </div>
                ))}
              </div>
              <h4 className="text-sm font-medium mb-3">Revenue Growth Over Time</h4>
              <SimpleBarChart data={salesData} dataKey="sales" color="#10b988" />
            </>
          )}
        </CardContent>
      </Card>

      {/* Product Performance */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Top Product Performance</CardTitle>
          <CardDescription>Products with the highest order counts and average prices.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingProducts ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-seller-accent" />
              <p className="text-muted-foreground">Loading product data...</p>
            </div>
          ) : errorProducts ? (
            <div className="text-center py-8 text-red-500 flex flex-col items-center">
              <AlertCircle className="h-8 w-8 mb-2" />
              <p>{errorProducts}</p>
            </div>
          ) : productPerformance.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No product performance data available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {productPerformance.map((product, index) => (
                <Card key={product.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center">
                  <Award className="h-8 w-8 text-yellow-500 mr-4 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-seller-accent">{product.name}</h4>
                    <p className="text-sm text-muted-foreground">Orders: {product.order_count}</p>
                    <p className="text-sm text-muted-foreground">Quantity Sold: {product.total_quantity_sold}</p>
                    <p className="text-sm text-muted-foreground">Avg. Price: {formatCurrency(product.avg_price, 2)}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Range Analytics */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Custom Date Range Analytics</CardTitle>
          <CardDescription>Analyze your performance over a specific time period.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !customStartDate && "text-muted-foreground"
                  )}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {customStartDate ? format(customStartDate, "PPP") : <span>Pick start date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={customStartDate}
                  onSelect={setCustomStartDate}
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
                    !customEndDate && "text-muted-foreground"
                  )}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {customEndDate ? format(customEndDate, "PPP") : <span>Pick end date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={customEndDate}
                  onSelect={setCustomEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button onClick={fetchCustomAnalytics} disabled={loadingCustom} className="bg-seller-accent hover:bg-seller-accent/90">
              {loadingCustom ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Apply Filter'}
            </Button>
          </div>

          {loadingCustom ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-seller-accent" />
              <p className="text-muted-foreground">Loading custom analytics...</p>
            </div>
          ) : errorCustom ? (
            <div className="text-center py-8 text-red-500 flex flex-col items-center">
              <AlertCircle className="h-8 w-8 mb-2" />
              <p>{errorCustom}</p>
            </div>
          ) : customRangeAnalytics && customRangeAnalytics.summary ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 glass-card rounded-lg">
                  <div className="text-2xl font-bold text-seller-accent">
                    {customRangeAnalytics.summary.total_orders || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Orders</div>
                </div>
                <div className="text-center p-4 glass-card rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {/* Safely display total_revenue */}
                    {formatCurrency(customRangeAnalytics.summary.total_revenue / 1000)}k
                  </div>
                  <div className="text-sm text-muted-foreground">Total Revenue</div>
                </div>
                <div className="text-center p-4 glass-card rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {/* Safely display avg_order_value */}
                    {formatCurrency(customRangeAnalytics.summary.avg_order_value)}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg. Order Value</div>
                </div>
                <div className="text-center p-4 glass-card rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {customRangeAnalytics.summary.unique_customers || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Unique Customers</div>
                </div>
              </div>

              <h4 className="text-sm font-medium mb-3">Daily Breakdown</h4>
              {customRangeAnalytics.dailyBreakdown && customRangeAnalytics.dailyBreakdown.length > 0 ? (
                <SimpleBarChart data={customRangeAnalytics.dailyBreakdown} dataKey="revenue" nameKey="date" color="#10b988" />
              ) : (
                <div className="text-center py-4 text-muted-foreground">No daily breakdown data for this range.</div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Select a date range and click "Apply Filter" to view custom analytics.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerAnalytics;
