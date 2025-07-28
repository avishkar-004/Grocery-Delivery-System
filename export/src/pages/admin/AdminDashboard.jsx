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
  Filler,
} from "chart.js";
import {
  Users,
  DollarSign,
  ShoppingCart,
  Tag,
  Trash2,
} from "lucide-react";

import AdminLayout from './AdminLayout';

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
    Legend,
    Filler
);

const AdminDashboard = () => {
  const navigate = useNavigate();
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
  // Removed state for revenue period and year
  const [revenuePeriod, setRevenuePeriod] = useState("monthly");
  const [revenueYear, setRevenueYear] = useState(new Date().getFullYear());


  const showToast = (message, type = "success") => {
    console.log(`Toast: ${type} - ${message}`);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [revenuePeriod, revenueYear]);

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
      // Retained the revenue fetch call as other metrics depend on it.
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

  const getRoleColorClass = (role) => {
    switch (role) {
      case 'buyer': return 'text-blue-500 dark:text-blue-400';
      case 'seller': return 'text-green-500 dark:text-green-400';
      case 'admin': return 'text-purple-700 dark:text-purple-400';
      default: return 'text-gray-700 dark:text-gray-300';
    }
  };

  const totalOrders = (analyticsData.businessMetrics.platformStats.total_completed_orders || 0) +
      (analyticsData.businessMetrics.platformStats.pending_orders || 0) +
      (analyticsData.businessMetrics.platformStats.in_progress_orders || 0);

  const totalRevenue = parseFloat(analyticsData.businessMetrics.platformStats.total_platform_revenue) || 0;
  const averageOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0;


  // Removed revenueChartData and revenueChartOptions

  // New chart data for Recent Registrations
  const recentRegistrationsChartData = {
    labels: analyticsData.activeUsers.recentRegistrations
        .filter(item => item.role !== 'admin') // Filter out admin registrations
        .map(item => new Date(item.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Buyer',
        data: analyticsData.activeUsers.recentRegistrations
            .filter(item => item.role === 'buyer')
            .map(item => item.registrations),
        backgroundColor: "#6366F1", // indigo-500
      },
      {
        label: 'Seller',
        data: analyticsData.activeUsers.recentRegistrations
            .filter(item => item.role === 'seller')
            .map(item => item.registrations),
        backgroundColor: "#34D399", // emerald-400
      }
    ]
  };

  const recentRegistrationsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: localStorage.getItem("theme") === "dark" ? "#E5E7EB" : "#374151",
        },
      },
      title: {
        display: true,
        text: 'Recent Registrations (Last 30 Days)',
        color: localStorage.getItem("theme") === "dark" ? "#F9FAFB" : "#6B21A8",
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          color: localStorage.getItem("theme") === "dark" ? "#D1D5DB" : "#4B5563",
        },
        grid: {
          color: localStorage.getItem("theme") === "dark" ? "rgba(107, 114, 128, 0.3)" : "rgba(209, 213, 219, 0.5)",
          borderColor: localStorage.getItem("theme") === "dark" ? "#6B7280" : "#D1D5DB",
        },
      },
      y: {
        stacked: true,
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
    labels: analyticsData.businessMetrics.topCategories.map((item) => item.name),
    datasets: [
      {
        label: "Products Sold",
        data: analyticsData.businessMetrics.topCategories.map((item) => item.total_orders),
        backgroundColor: [
          "#8B5CF6",
          "#EC4899",
          "#6366F1",
          "#06B6D4",
          "#F59E0B",
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
        color: localStorage.getItem("theme") === "dark" ? "#F9FAFB" : "#6B21A8",
      },
    },
  };

  const topSellersChartData = {
    labels: analyticsData.businessMetrics.topSellers.map((item) => item.name),
    datasets: [
      {
        label: "Revenue Generated",
        data: analyticsData.businessMetrics.topSellers.map((item) => item.total_revenue),
        backgroundColor: [
          "#A78BFA",
          "#F472B6",
          "#818CF8",
          "#22D3EE",
          "#FBBF24",
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
        color: localStorage.getItem("theme") === "dark" ? "#F9FAFB" : "#6B21A8",
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
        <AdminLayout>
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
      <AdminLayout>
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex items-center space-x-4 animate-fade-in-up">
              <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-700 text-indigo-600 dark:text-indigo-200">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Active Users (Last 7 Days)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
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
                  ₹{(totalRevenue).toFixed(2)}
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
                  {totalOrders}
                </p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex items-center space-x-4 animate-fade-in-up delay-300">
              <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-700 text-yellow-600 dark:text-yellow-200">
                <Tag className="w-7 h-7" />
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Average Order Value</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ₹{averageOrderValue}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* New Recent Registrations Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 animate-scale-in">
              <h3 className="text-xl font-semibold text-purple-800 dark:text-purple-200 mb-4">Recent Registrations</h3>
              <div className="h-80">
                {analyticsData.activeUsers.recentRegistrations.length > 0 ? (
                    <Bar data={recentRegistrationsChartData} options={recentRegistrationsChartOptions} />
                ) : (
                    <p className="text-gray-500 dark:text-gray-400">No recent registrations data available.</p>
                )}
              </div>
            </div>

            {/* Active Users & Registrations */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 animate-scale-in delay-100">
              <h3 className="text-xl font-semibold text-purple-800 dark:text-purple-200 mb-4">User Statistics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Total Registered Users</p>
                  <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    {(analyticsData.activeUsers.userStats.total_buyers || 0) +
                        (analyticsData.activeUsers.userStats.total_sellers || 0) +
                        (analyticsData.activeUsers.userStats.total_admins || 0)}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Active (Non-Suspended) Users</p>
                  <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    {analyticsData.activeUsers.userStats.active_users || 0}
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <h4 className="text-lg font-medium text-purple-700 dark:text-purple-300 mb-3">Recent Registrations (Last 30 Days)</h4>
                {analyticsData.activeUsers.recentRegistrations.length > 0 ? (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-40 overflow-y-auto custom-scrollbar">
                      {analyticsData.activeUsers.recentRegistrations
                          .filter(registration => registration.role !== 'admin') // Filter out admin registrations from this list too
                          .map((registration, index) => (
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
            </div>
          </div>
        </>
      </AdminLayout>
  );
};

export default AdminDashboard;