
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, Package, Calendar, BarChart3, User, DollarSign, Clock, Award } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const Analytics = () => {
  const [timeFilter, setTimeFilter] = useState("month");
  const [comparisonRange, setComparisonRange] = useState("previous");

  // Mock analytics data
  const salesData = [
    { period: "Jan", sales: 12000, orders: 45 },
    { period: "Feb", sales: 15000, orders: 52 },
    { period: "Mar", sales: 18000, orders: 61 },
    { period: "Apr", sales: 22000, orders: 75 },
    { period: "May", sales: 19000, orders: 68 },
    { period: "Jun", sales: 25000, orders: 82 }
  ];

  const topProducts = [
    { name: "Basmati Rice", sales: 5400, percentage: 22 },
    { name: "Turmeric Powder", sales: 4200, percentage: 18 },
    { name: "Red Lentils", sales: 3800, percentage: 16 },
    { name: "Coconut Oil", sales: 3200, percentage: 14 },
    { name: "Almonds", sales: 2800, percentage: 12 }
  ];

  const orderStatusData = [
    { name: "Completed", value: 65, color: "#10b981" },
    { name: "In Progress", value: 20, color: "#3b82f6" },
    { name: "Canceled", value: 10, color: "#ef4444" },
    { name: "Rejected", value: 5, color: "#f97316" }
  ];

  const totalRevenue = 127500;
  const totalOrders = 383;
  const averageOrderValue = Math.round(totalRevenue / totalOrders);
  const conversionRate = 73.2;

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
            <h1 className="text-2xl font-bold gradient-text">Analytics Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="text-sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Advanced Analytics
            </Badge>
            <Button variant="ghost" size="icon" className="hover-lift">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Time Range Selector */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle>Analytics Filter</CardTitle>
            <CardDescription>
              Select time range and comparison parameters for detailed analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Time Period</label>
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger className="border-2 focus:border-seller-accent">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Last 7 Days</SelectItem>
                    <SelectItem value="week">Last 4 Weeks</SelectItem>
                    <SelectItem value="month">Last 6 Months</SelectItem>
                    <SelectItem value="quarter">Last 4 Quarters</SelectItem>
                    <SelectItem value="year">Last 3 Years</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Compare With</label>
                <Select value={comparisonRange} onValueChange={setComparisonRange}>
                  <SelectTrigger className="border-2 focus:border-seller-accent">
                    <SelectValue placeholder="Select comparison" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="previous">Previous Period</SelectItem>
                    <SelectItem value="year">Same Period Last Year</SelectItem>
                    <SelectItem value="custom">Custom Period</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button className="w-full bg-gradient-to-r from-seller-accent to-orange-600 hover:from-orange-600 hover:to-seller-accent">
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-seller-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-seller-accent">₹{totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-green-600">+15.2% from last period</p>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-seller-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-seller-accent">{totalOrders}</div>
              <p className="text-xs text-green-600">+8.3% from last period</p>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-seller-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-seller-accent">₹{averageOrderValue}</div>
              <p className="text-xs text-green-600">+6.8% from last period</p>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Award className="h-4 w-4 text-seller-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-seller-accent">{conversionRate}%</div>
              <p className="text-xs text-green-600">+2.1% from last period</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Sales Trend Chart */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Sales & Orders Trend</CardTitle>
              <CardDescription>Revenue and order count over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sales" fill="#f97316" name="Sales (₹)" />
                  <Bar dataKey="orders" fill="#fb923c" name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Order Status Distribution */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Order Status Distribution</CardTitle>
              <CardDescription>Breakdown of order statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percentage }) => `${name} ${percentage}%`}
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Products */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Best performing products by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 glass-card rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-seller-accent to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="text-sm text-muted-foreground">{product.percentage}% of total sales</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-seller-accent">₹{product.sales.toLocaleString()}</div>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-seller-accent to-orange-600 h-2 rounded-full" 
                        style={{ width: `${product.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Breakdown */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Monthly Revenue Trend</CardTitle>
            <CardDescription>Detailed revenue analysis with growth indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#f97316" 
                  strokeWidth={3}
                  name="Revenue (₹)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
