import { useState, useEffect } from 'react';
import { getOrders } from '../../services/order.service';
import { getProductsByOwner } from '../../services/product.service';
import '../../styles/analytics.css';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState('week');
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    salesByDay: [],
    topProducts: [],
    categoryDistribution: [],
  });
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // In a real app, you would fetch analytics data from the API
        // For demo, we'll generate mock data based on the selected time frame
        
        // Fetch orders and products
        const [orders, products] = await Promise.all([
          getOrders(),
          getProductsByOwner(),
        ]);
        
        // Calculate analytics
        const analytics = calculateAnalytics(orders, products, timeFrame);
        setStats(analytics);
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [timeFrame]);
  
  const calculateAnalytics = (orders, products, period) => {
    // Filter orders based on the selected time period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
    }
    
    // Filter orders for the shop owner and within the selected time period
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return (
        order.shopOwner?.id === 'owner1' &&
        orderDate >= startDate &&
        orderDate <= now &&
        order.status !== 'Cancelled'
      );
    });
    
    // Calculate total sales and order count
    const totalSales = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = filteredOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    // Calculate sales by day/week/month
    const salesByPeriod = [];
    
    if (period === 'today') {
      // Sales by hour for today
      for (let hour = 0; hour < 24; hour++) {
        const hourStart = new Date(startDate);
        hourStart.setHours(hour, 0, 0, 0);
        const hourEnd = new Date(startDate);
        hourEnd.setHours(hour, 59, 59, 999);
        
        const hourOrders = filteredOrders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= hourStart && orderDate <= hourEnd;
        });
        
        const hourSales = hourOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        
        salesByPeriod.push({
          label: `${hour}:00`,
          value: hourSales,
        });
      }
    } else if (period === 'week') {
      // Sales by day for the last 7 days
      for (let day = 6; day >= 0; day--) {
        const dayStart = new Date(now);
        dayStart.setDate(now.getDate() - day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);
        
        const dayOrders = filteredOrders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= dayStart && orderDate <= dayEnd;
        });
        
        const daySales = dayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = dayNames[dayStart.getDay()];
        
        salesByPeriod.push({
          label: dayName,
          value: daySales,
        });
      }
    } else if (period === 'month') {
      // Sales by week for the last 4 weeks
      for (let week = 4; week >= 1; week--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (week * 7));
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        const weekOrders = filteredOrders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= weekStart && orderDate <= weekEnd;
        });
        
        const weekSales = weekOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        
        salesByPeriod.push({
          label: `Week ${5 - week}`,
          value: weekSales,
        });
      }
    } else if (period === 'year') {
      // Sales by month for the last 12 months
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      for (let month = 11; month >= 0; month--) {
        const monthStart = new Date(now);
        monthStart.setMonth(now.getMonth() - month);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthStart.getMonth() + 1);
        monthEnd.setDate(0);
        monthEnd.setHours(23, 59, 59, 999);
        
        const monthOrders = filteredOrders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= monthStart && orderDate <= monthEnd;
        });
        
        const monthSales = monthOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        
        salesByPeriod.push({
          label: monthNames[monthStart.getMonth()],
          value: monthSales,
        });
      }
    }
    
    // Calculate top selling products
    const productSales = {};
    
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.id]) {
          productSales[item.id] = {
            id: item.id,
            name: item.name,
            quantity: 0,
            revenue: 0,
          };
        }
        
        productSales[item.id].quantity += item.quantity;
        productSales[item.id].revenue += item.price * item.quantity;
      });
    });
    
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    
    // Calculate category distribution
    const categorySales = {};
    
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        if (!categorySales[item.category]) {
          categorySales[item.category] = 0;
        }
        
        categorySales[item.category] += item.price * item.quantity;
      });
    });
    
    const categoryDistribution = Object.entries(categorySales).map(([category, sales]) => ({
      category,
      sales,
      percentage: (sales / totalSales) * 100,
    })).sort((a, b) => b.sales - a.sales);
    
    return {
      totalSales,
      totalOrders,
      averageOrderValue,
      salesByDay: salesByPeriod,
      topProducts,
      categoryDistribution,
    };
  };
  
  const handleTimeFrameChange = (e) => {
    setTimeFrame(e.target.value);
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  return (
    <div className="analytics-page">
      <div className="page-header">
        <h1>Analytics Dashboard</h1>
        <div className="time-filter">
          <select 
            value={timeFrame} 
            onChange={handleTimeFrameChange}
            className="time-select"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="analytics-loading">
          <div className="loader"></div>
          <p>Loading analytics data...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-icon sales-icon">💰</div>
              <div className="stat-content">
                <h3>Total Sales</h3>
                <div className="stat-value">{formatCurrency(stats.totalSales)}</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon orders-icon">📦</div>
              <div className="stat-content">
                <h3>Total Orders</h3>
                <div className="stat-value">{stats.totalOrders}</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon avg-icon">📊</div>
              <div className="stat-content">
                <h3>Average Order Value</h3>
                <div className="stat-value">{formatCurrency(stats.averageOrderValue)}</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon conversion-icon">📈</div>
              <div className="stat-content">
                <h3>Completion Rate</h3>
                <div className="stat-value">
                  {stats.totalOrders > 0 ? '95%' : '0%'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="analytics-grid">
            {/* Sales Chart */}
            <div className="analytics-card sales-chart-card">
              <h2>Sales Trend</h2>
              <div className="chart-container">
                <div className="chart-bars">
                  {stats.salesByDay.map((day, index) => (
                    <div key={index} className="chart-bar-container">
                      <div 
                        className="chart-bar" 
                        style={{ 
                          height: `${Math.max(5, (day.value / Math.max(...stats.salesByDay.map(d => d.value))) * 100)}%` 
                        }}
                      >
                        <div className="bar-value">{formatCurrency(day.value)}</div>
                      </div>
                      <div className="bar-label">{day.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Top Products */}
            <div className="analytics-card top-products-card">
              <h2>Top Selling Products</h2>
              <div className="top-products-list">
                {stats.topProducts.length > 0 ? (
                  <>
                    {stats.topProducts.map((product, index) => (
                      <div key={product.id} className="top-product-item">
                        <div className="product-rank">{index + 1}</div>
                        <div className="product-info">
                          <h3>{product.name}</h3>
                          <div className="product-meta">
                            <span className="product-quantity">{product.quantity} sold</span>
                            <span className="product-revenue">{formatCurrency(product.revenue)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="no-data">
                    <p>No products sold during this period</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Category Distribution */}
            <div className="analytics-card category-card">
              <h2>Sales by Category</h2>
              <div className="category-chart">
                {stats.categoryDistribution.length > 0 ? (
                  <>
                    {stats.categoryDistribution.map(category => (
                      <div key={category.category} className="category-item">
                        <div className="category-header">
                          <h3>{category.category}</h3>
                          <div className="category-percentage">
                            {category.percentage.toFixed(1)}%
                          </div>
                        </div>
                        <div className="category-bar-container">
                          <div 
                            className="category-bar"
                            style={{ width: `${category.percentage}%` }}
                          ></div>
                        </div>
                        <div className="category-sales">
                          {formatCurrency(category.sales)}
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="no-data">
                    <p>No category data available for this period</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Order Metrics */}
            <div className="analytics-card metrics-card">
              <h2>Order Metrics</h2>
              <div className="metrics-grid">
                <div className="metric-item">
                  <div className="metric-icon">⏱️</div>
                  <div className="metric-info">
                    <h3>Average Preparation Time</h3>
                    <div className="metric-value">24 minutes</div>
                  </div>
                </div>
                
                <div className="metric-item">
                  <div className="metric-icon">🚚</div>
                  <div className="metric-info">
                    <h3>Average Delivery Time</h3>
                    <div className="metric-value">18 minutes</div>
                  </div>
                </div>
                
                <div className="metric-item">
                  <div className="metric-icon">⭐</div>
                  <div className="metric-info">
                    <h3>Average Rating</h3>
                    <div className="metric-value">4.8/5</div>
                  </div>
                </div>
                
                <div className="metric-item">
                  <div className="metric-icon">🔄</div>
                  <div className="metric-info">
                    <h3>Repeat Customer Rate</h3>
                    <div className="metric-value">68%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;