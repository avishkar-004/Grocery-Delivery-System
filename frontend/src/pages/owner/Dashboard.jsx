import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { OrderContext } from '../../context/OrderContext';
import Button from '../../components/common/Button';
import '../../styles/dashboard.css';

const Dashboard = () => {
  const { currentUser } = useContext(AuthContext);
  const { orders, fetchOrders } = useContext(OrderContext);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    salesThisWeek: 0,
    salesLastWeek: 0,
    topSellingProducts: [],
  });
  const [nearbyOrders, setNearbyOrders] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch orders
        await fetchOrders();
        
        // In a real app, you would fetch dashboard statistics from the API
        // For demo, we'll generate mock data
        setTimeout(() => {
          setStats({
            totalSales: 1250.75,
            totalOrders: 45,
            pendingOrders: 3,
            completedOrders: 42,
            salesThisWeek: 450.25,
            salesLastWeek: 380.50,
            topSellingProducts: [
              { id: 1, name: 'Organic Bananas', quantity: 58 },
              { id: 2, name: 'Fresh Milk', quantity: 36 },
              { id: 3, name: 'Whole Wheat Bread', quantity: 29 },
              { id: 4, name: 'Free Range Eggs', quantity: 23 },
            ],
          });
          
          setNearbyOrders([
            {
              id: 'order1',
              buyer: 'John Davis',
              items: 5,
              total: 32.45,
              distance: 1.2,
              time: '10 mins ago',
            },
            {
              id: 'order2',
              buyer: 'Emma Wilson',
              items: 3,
              total: 18.75,
              distance: 0.8,
              time: '15 mins ago',
            },
            {
              id: 'order3',
              buyer: 'Michael Brown',
              items: 7,
              total: 45.20,
              distance: 1.5,
              time: '22 mins ago',
            },
          ]);
          
          setRecentOrders([
            {
              id: 'recent1',
              buyer: 'Sarah Johnson',
              date: '2023-05-10',
              status: 'Delivered',
              total: 29.35,
            },
            {
              id: 'recent2',
              buyer: 'David Lee',
              date: '2023-05-09',
              status: 'Delivered',
              total: 36.50,
            },
            {
              id: 'recent3',
              buyer: 'Lisa Chen',
              date: '2023-05-08',
              status: 'Delivered',
              total: 21.75,
            },
          ]);
          
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, [fetchOrders]);
  
  const calculateGrowth = (current, previous) => {
    if (!previous) return 100;
    return ((current - previous) / previous) * 100;
  };
  
  const salesGrowth = calculateGrowth(stats.salesThisWeek, stats.salesLastWeek);
  
  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="date-filter">
          <select className="date-select">
            <option value="today">Today</option>
            <option value="week" selected>This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="dashboard-loading">
          <div className="loader"></div>
          <p>Loading dashboard data...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-content">
                <h3>Total Sales</h3>
                <div className="stat-value">${stats.totalSales.toFixed(2)}</div>
                <div className={`stat-change ${salesGrowth >= 0 ? 'positive' : 'negative'}`}>
                  {salesGrowth >= 0 ? '▲' : '▼'} {Math.abs(salesGrowth).toFixed(1)}% from last week
                </div>
              </div>
              <div className="stat-icon sales-icon">💰</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-content">
                <h3>Total Orders</h3>
                <div className="stat-value">{stats.totalOrders}</div>
                <div className="stat-note">Lifetime orders</div>
              </div>
              <div className="stat-icon orders-icon">📦</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-content">
                <h3>Pending Orders</h3>
                <div className="stat-value">{stats.pendingOrders}</div>
                <div className="stat-note">Requires attention</div>
              </div>
              <div className="stat-icon pending-icon">⏳</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-content">
                <h3>Completed Orders</h3>
                <div className="stat-value">{stats.completedOrders}</div>
                <div className="stat-note">Successfully delivered</div>
              </div>
              <div className="stat-icon completed-icon">✅</div>
            </div>
          </div>
          
          <div className="dashboard-sections">
            <div className="dashboard-main">
              {/* Nearby Orders */}
              <div className="dashboard-card nearby-orders-card">
                <div className="card-header">
                  <h2>Nearby Orders</h2>
                  <Link to="/owner/nearby-orders" className="view-all">View All</Link>
                </div>
                
                {nearbyOrders.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <p>No nearby orders at the moment</p>
                  </div>
                ) : (
                  <div className="nearby-orders-list">
                    {nearbyOrders.map(order => (
                      <div key={order.id} className="nearby-order-item">
                        <div className="order-info">
                          <h3>{order.buyer}</h3>
                          <div className="order-meta">
                            <span>{order.items} items</span>
                            <span className="meta-separator">•</span>
                            <span>${order.total.toFixed(2)}</span>
                          </div>
                          <div className="order-location">
                            <span className="distance">{order.distance} km away</span>
                            <span className="meta-separator">•</span>
                            <span className="time">{order.time}</span>
                          </div>
                        </div>
                        <div className="order-actions">
                          <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={() => {}}
                          >
                            Accept
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Recent Orders */}
              <div className="dashboard-card recent-orders-card">
                <div className="card-header">
                  <h2>Recent Orders</h2>
                  <Link to="/owner/my-orders" className="view-all">View All</Link>
                </div>
                
                {recentOrders.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <p>You haven't completed any orders yet</p>
                  </div>
                ) : (
                  <div className="recent-orders-list">
                    {recentOrders.map(order => (
                      <div key={order.id} className="recent-order-item">
                        <div className="order-info">
                          <h3>{order.buyer}</h3>
                          <div className="order-meta">
                            <span>Order #{order.id}</span>
                            <span className="meta-separator">•</span>
                            <span>{order.date}</span>
                          </div>
                        </div>
                        <div className="order-status">
                          <span className={`status-badge status-${order.status.toLowerCase()}`}>
                            {order.status}
                          </span>
                          <div className="order-total">${order.total.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="dashboard-sidebar">
              {/* Top Selling Products */}
              <div className="dashboard-card top-products-card">
                <div className="card-header">
                  <h2>Top Selling Products</h2>
                </div>
                
                {stats.topSellingProducts.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📊</div>
                    <p>No sales data available yet</p>
                  </div>
                ) : (
                  <div className="top-products-list">
                    {stats.topSellingProducts.map((product, index) => (
                      <div key={product.id} className="top-product-item">
                        <div className="product-rank">{index + 1}</div>
                        <div className="product-info">
                          <h3>{product.name}</h3>
                          <div className="product-sales">{product.quantity} sold</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Quick Actions */}
              <div className="dashboard-card quick-actions-card">
                <div className="card-header">
                  <h2>Quick Actions</h2>
                </div>
                
                <div className="quick-actions">
                  <Link to="/owner/products/add" className="quick-action-btn">
                    <div className="action-icon">➕</div>
                    <div className="action-text">Add New Product</div>
                  </Link>
                  
                  <Link to="/owner/profile" className="quick-action-btn">
                    <div className="action-icon">👤</div>
                    <div className="action-text">Update Profile</div>
                  </Link>
                  
                  <Link to="/owner/analytics" className="quick-action-btn">
                    <div className="action-icon">📈</div>
                    <div className="action-text">View Analytics</div>
                  </Link>
                  
                  <button className="quick-action-btn">
                    <div className="action-icon">💬</div>
                    <div className="action-text">Customer Support</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;