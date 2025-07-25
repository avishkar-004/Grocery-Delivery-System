import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Line,
  Bar,
  Doughnut,
  PolarArea,
} from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  Users,
  DollarSign,
  ShoppingCart,
  BookOpen,
  Trash2,
} from "lucide-react";

// Import the new AdminLayout component
import AdminLayout from './AdminLayout';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    RadialLinearScale,
    Title,
    Tooltip,
    Legend
);

const AdminDashboard = () => {
  const navigate = useNavigate();

  // Removed isDarkMode and toast state, as they are now in AdminLayout
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    revenue: [],
    activeUsers: { userStats: {}, recentRegistrations: [], activeUsersCount: 0 },
    businessMetrics: {
      platformStats: {},
      quotationMetrics: {},
      topCategories: [],
      topSellers: [],
    },
  });
  const [revenuePeriod, setRevenuePeriod] = useState("monthly");
  const [revenueYear, setRevenueYear] = useState(new Date().getFullYear());

  // Function to show toast (will be passed down from AdminLayout if needed, or use context)
  // For now, let's assume a global toast context or direct passing if this component needs to trigger toasts.
  // For this example, I'll keep a placeholder `showToast` for dashboard-specific errors.
  const showToast = (message, type = "success") => {
    // In a real app, you'd use a context or prop from AdminLayout for this
    console.log(`Toast: ${type} - ${message}`);
  };


  useEffect(() => {
    fetchDashboardData();
  }, [revenuePeriod, revenueYear]); // Refetch when period or year changes

  const fetchDashboardData = async () => {
    setLoading(true);
    const adminToken = localStorage.getItem("admin_token");
    if (!adminToken) {
      showToast("Authentication required. Please log in.", "error");
      navigate("/admin/login");
      setLoading(false);
      return;
    }

    const headers = {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    };

    try {
      // Fetch Revenue Data
      const revenueRes = await fetch(
          `http://localhost:3000/api/admin/analytics/revenue?period=${revenuePeriod}&year=${revenueYear}`,
          { headers }
      );
      const revenueData = await revenueRes.json();
      if (revenueData.success) {
        setAnalyticsData((prev) => ({ ...prev, revenue: revenueData.data }));
      } else {
        showToast(
            revenueData.message || "Failed to fetch revenue data.",
            "error"
        );
      }

      // Fetch Active Users Data
      const activeUsersRes = await fetch(
          "http://localhost:3000/api/admin/analytics/active-users",
          { headers }
      );
      const activeUsersData = await activeUsersRes.json();
      if (activeUsersData.success) {
        setAnalyticsData((prev) => ({
          ...prev,
          activeUsers: activeUsersData.data,
        }));
      } else {
        showToast(
            activeUsersData.message || "Failed to fetch active users data.",
            "error"
        );
      }

      // Fetch Business Metrics Data
      const businessMetricsRes = await fetch(
          "http://localhost:3000/api/admin/analytics/business-metrics",
          { headers }
      );
      const businessMetricsData = await businessMetricsRes.json();
      if (businessMetricsData.success) {
        setAnalyticsData((prev) => ({
          ...prev,
          businessMetrics: businessMetricsData.data,
        }));
      } else {
        showToast(
            businessMetricsData.message || "Failed to fetch business metrics.",
            "error"
        );
      }
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
      showToast("Network error. Could not load dashboard data.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    // Replace window.confirm with a custom modal if needed, similar to UserManagement
    if (
        !window.confirm(
            "Are you sure you want to run the system cleanup? This action cannot be undone."
        )
    ) {
      return;
    }

    setLoading(true);
    const adminToken = localStorage.getItem("admin_token");
    if (!adminToken) {
      showToast("Authentication required. Please log in.", "error");
      navigate("/admin/login");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
          "http://localhost:3000/api/admin/system/cleanup",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${adminToken}`,
              "Content-Type": "application/json",
            },
          }
      );
      const data = await response.json();
      if (data.success) {
        showToast(data.message || "System cleanup completed successfully!", "success");
        // Optionally refetch some data if cleanup affects metrics
        fetchDashboardData();
      } else {
        showToast(data.message || "System cleanup failed.", "error");
      }
    } catch (error) {
      console.error("Cleanup network error:", error);
      showToast("Network error during cleanup. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get role-specific color class
  const getRoleColorClass = (role) => {
    switch (role) {
      case 'buyer': return 'text-blue-500 dark:text-blue-400';
      case 'seller': return 'text-green-500 dark:text-green-400';
      case 'admin': return 'text-purple-700 dark:text-purple-400'; // Darker purple for light mode, lighter for dark mode
      default: return 'text-gray-700 dark:text-gray-300';
    }
  };

  // Calculate total orders from platformStats
  const totalOrders = (analyticsData.businessMetrics.platformStats.total_completed_orders || 0) +
      (analyticsData.businessMetrics.platformStats.pending_orders || 0) +
      (analyticsData.businessMetrics.platformStats.in_progress_orders || 0);


  // Chart Data preparation
  const revenueChartData = {
    labels: analyticsData.revenue.map((item) => item.period),
    datasets: [
      {
        label: "Revenue",
        data: analyticsData.revenue.map((item) => item.revenue),
        fill: true,
        backgroundColor: "rgba(139, 92, 246, 0.2)", // purple-500 with opacity
        borderColor: "#8B5CF6", // purple-500
        tension: 0.3,
      },
      {
        label: "Order Count",
        data: analyticsData.revenue.map((item) => item.order_count),
        fill: false,
        borderColor: "#EC4899", // fuchsia-500
        tension: 0.3,
      },
    ],
  };

  const revenueChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: localStorage.getItem("theme") === "dark" ? "#E5E7EB" : "#374151", // text-gray-200 / text-gray-700
        },
      },
      title: {
        display: true,
        text: `Revenue & Orders (${revenuePeriod.charAt(0).toUpperCase() + revenuePeriod.slice(1)})`,
        color: localStorage.getItem("theme") === "dark" ? "#F9FAFB" : "#6B21A8", // Changed to purple-800 for better contrast in light mode
      },
    },
    scales: {
      x: {
        ticks: {
          color: localStorage.getItem("theme") === "dark" ? "#D1D5DB" : "#4B5563", // text-gray-300 / text-gray-600
        },
        grid: {
          color: localStorage.getItem("theme") === "dark" ? "rgba(107, 114, 128, 0.3)" : "rgba(209, 213, 219, 0.5)", // gray-500/30 / gray-300/50
          borderColor: localStorage.getItem("theme") === "dark" ? "#6B7280" : "#D1D5DB",
        },
      },
      y: {
        ticks: {
          color: localStorage.getItem("theme") === "dark" ? "#D1D5DB" : "#4B5563",
        },
        grid: {
          color: localStorage.getItem("theme") === "dark" ? "rgba(107, 114, 128, 0.3)" : "rgba(209, 213, 219, 0.5)",
          borderColor: localStorage.getItem("theme") === "dark" ? "#6B7280" : "#D1D5DB",
        },
      },
    },
  };

  const topCategoriesChartData = {
    // Corrected labels to use 'name' from API response
    labels: analyticsData.businessMetrics.topCategories.map((item) => item.name),
    datasets: [
      {
        // Corrected data to use 'total_orders' from API response, representing products sold
        label: "Products Sold",
        data: analyticsData.businessMetrics.topCategories.map((item) => item.total_orders),
        backgroundColor: [
          "#8B5CF6", // purple-500
          "#EC4899", // fuchsia-500
          "#6366F1", // indigo-500
          "#06B6D4", // cyan-500
          "#F59E0B", // amber-500
        ],
        borderColor: localStorage.getItem("theme") === "dark" ? "#1F2937" : "#FFFFFF",
        borderWidth: 1,
      },
    ],
  };

  const topCategoriesChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: {
          color: localStorage.getItem("theme") === "dark" ? "#E5E7EB" : "#374151",
        },
      },
      title: {
        display: true,
        text: "Top 5 Categories by Products Sold",
        color: localStorage.getItem("theme") === "dark" ? "#F9FAFB" : "#6B21A8", // Changed to purple-800 for better contrast in light mode
      },
    },
  };

  const topSellersChartData = {
    // Corrected labels to use 'name' from API response
    labels: analyticsData.businessMetrics.topSellers.map((item) => item.name),
    datasets: [
      {
        label: "Revenue Generated",
        data: analyticsData.businessMetrics.topSellers.map((item) => item.total_revenue),
        backgroundColor: [
          "#A78BFA", // purple-400
          "#F472B6", // pink-400
          "#818CF8", // indigo-400
          "#22D3EE", // cyan-400
          "#FBBF24", // amber-400
        ],
        borderColor: localStorage.getItem("theme") === "dark" ? "#1F2937" : "#FFFFFF",
        borderWidth: 1,
      },
    ],
  };

  const topSellersChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: localStorage.getItem("theme") === "dark" ? "#E5E7EB" : "#374151",
        },
      },
      title: {
        display: true,
        text: "Top 5 Sellers by Revenue",
        color: localStorage.getItem("theme") === "dark" ? "#F9FAFB" : "#6B21A8", // Changed to purple-800 for better contrast in light mode
      },
    },
    scales: {
      x: {
        ticks: {
          color: localStorage.getItem("theme") === "dark" ? "#D1D5DB" : "#4B5563",
        },
        grid: {
          color: localStorage.getItem("theme") === "dark" ? "rgba(107, 114, 128, 0.3)" : "rgba(209, 213, 219, 0.5)",
          borderColor: localStorage.getItem("theme") === "dark" ? "#6B7280" : "#D1D5DB",
        },
      },
      y: {
        ticks: {
          color: localStorage.getItem("theme") === "dark" ? "#D1D5DB" : "#4B5563",
        },
        grid: {
          color: localStorage.getItem("theme") === "dark" ? "rgba(107, 114, 128, 0.3)" : "rgba(209, 213, 219, 0.5)",
          borderColor: localStorage.getItem("theme") === "dark" ? "#6B7280" : "#D1D5DB",
        },
      },
    },
  };

  if (loading) {
    return (
        <AdminLayout> {/* Wrap loading state with AdminLayout */}
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
            <div className="flex flex-col items-center text-gray-700 dark:text-gray-300">
              <svg
                  className="animate-spin h-10 w-10 text-purple-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
              >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                ></circle>
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="mt-4 text-lg">Loading Dashboard...</p>
            </div>
          </div>
        </AdminLayout>
    );
  }

  return (
      <AdminLayout> {/* Wrap the entire dashboard content with AdminLayout */}
        {/* Main content area */}
        <>
          {/* Key Metrics Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex items-center space-x-4 animate-fade-in-up">
              <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-700 text-indigo-600 dark:text-indigo-200">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Active Users (Last 7 Days)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {/* Using activeUsersCount from the API for users logged in recently */}
                  {analyticsData.activeUsers.activeUsersCount || 0}
                </p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex items-center space-x-4 animate-fade-in-up delay-100">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-700 text-green-600 dark:text-green-200">
                <DollarSign className="w-7 h-7" />
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Total Revenue (All Time)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {/* Corrected to use total_platform_revenue from API */}
                  ₹{(parseFloat(analyticsData.businessMetrics.platformStats.total_platform_revenue) || 0).toFixed(2)}
                </p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex items-center space-x-4 animate-fade-in-up delay-200">
              <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-700 text-orange-600 dark:text-orange-200">
                <ShoppingCart className="w-7 h-7" />
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Total Orders (All Time)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {/* Summing all order statuses for total orders */}
                  {totalOrders}
                </p>
              </div>
            </div>
            
          </div>

          {/* Analytics Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 animate-scale-in">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-purple-800 dark:text-purple-200">Revenue Overview</h3>
                <div className="flex space-x-2">
                  <select
                      value={revenuePeriod}
                      onChange={(e) => setRevenuePeriod(e.target.value)}
                      className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-1.5 px-3 text-gray-800 dark:text-white text-sm focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <input
                      type="number"
                      value={revenueYear}
                      onChange={(e) => setRevenueYear(e.target.value)}
                      min="2020"
                      max={new Date().getFullYear()}
                      className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-1.5 px-3 text-gray-800 dark:text-white text-sm focus:ring-purple-500 focus:border-purple-500 w-24"
                  />
                </div>
              </div>
              <div className="h-80">
                <Line data={revenueChartData} options={revenueChartOptions} />
              </div>
            </div>

            {/* Active Users & Registrations */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 animate-scale-in delay-100">
              <h3 className="text-xl font-semibold text-purple-800 dark:text-purple-200 mb-4">User Statistics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Total Registered Users</p>
                  <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    {/* Summing all user roles for total registered users */}
                    {(analyticsData.activeUsers.userStats.total_buyers || 0) +
                        (analyticsData.activeUsers.userStats.total_sellers || 0) +
                        (analyticsData.activeUsers.userStats.total_admins || 0)}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Active (Non-Suspended) Users</p>
                  <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    {/* Using active_users from userStats, which represents active and non-suspended users */}
                    {analyticsData.activeUsers.userStats.active_users || 0}
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <h4 className="text-lg font-medium text-purple-700 dark:text-purple-300 mb-3">Recent Registrations (Last 30 Days)</h4>
                {analyticsData.activeUsers.recentRegistrations.length > 0 ? (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-40 overflow-y-auto custom-scrollbar">
                      {analyticsData.activeUsers.recentRegistrations.map((registration, index) => (
                          <li key={index} className="py-2 flex items-center justify-between">
                          <span className={`text-sm ${getRoleColorClass(registration.role)}`}>
                              {registration.role} ({registration.registrations})
                          </span>
                            <span className="text-gray-500 dark:text-gray-400 text-xs">
                              {new Date(registration.date).toLocaleDateString()}
                          </span>
                          </li>
                      ))}
                    </ul>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400">No recent registrations.</p>
                )}
              </div>
            </div>
          </div>

          {/* Additional Business Metrics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Top Categories Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 animate-scale-in delay-200">
              <h3 className="text-xl font-semibold text-purple-800 dark:text-purple-200 mb-4">Top Categories</h3>
              <div className="h-80 flex items-center justify-center">
                {analyticsData.businessMetrics.topCategories.length > 0 ? (
                    <Doughnut data={topCategoriesChartData} options={topCategoriesChartOptions} />
                ) : (
                    <p className="text-gray-500 dark:text-gray-400">No top categories data available.</p>
                )}
              </div>
            </div>

            {/* Top Sellers Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 animate-scale-in delay-300">
              <h3 className="text-xl font-semibold text-purple-800 dark:text-purple-200 mb-4">Top Sellers</h3>
              <div className="h-80">
                {analyticsData.businessMetrics.topSellers.length > 0 ? (
                    <Bar data={topSellersChartData} options={topSellersChartOptions} />
                ) : (
                    <p className="text-gray-500 dark:text-gray-400">No top sellers data available.</p>
                )}
              </div>
            </div>
          </div>

          {/* System Actions Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 animate-fade-in-up">
            <h3 className="text-xl font-semibold text-purple-800 dark:text-purple-200 mb-4">System Actions</h3>
            <div className="flex flex-wrap gap-4">
              <button
                  onClick={handleCleanup}
                  disabled={loading}
                  className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition-colors duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-5 h-5" />
                <span>{loading ? "Cleaning Up..." : "Run System Cleanup"}</span>
              </button>
              {/* Add more system actions here as needed */}
            </div>
          </div>
        </>
      </AdminLayout>
  );
};

export default AdminDashboard;
