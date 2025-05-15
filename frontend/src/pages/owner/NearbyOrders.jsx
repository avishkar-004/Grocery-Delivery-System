import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { OrderContext } from '../../context/OrderContext';
import { getNearbyOrders, acceptOrder } from '../../services/order.service';
import Button from '../../components/common/Button';
import '../../styles/nearby-orders.css';

const NearbyOrders = () => {
  const { currentUser } = useContext(AuthContext);
  const { updateOrder } = useContext(OrderContext);
  const navigate = useNavigate();
  
  const [nearbyOrders, setNearbyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [radiusFilter, setRadiusFilter] = useState('10');
  const [sortBy, setSortBy] = useState('distance');
  const [acceptingOrder, setAcceptingOrder] = useState(null);
  
  useEffect(() => {
    fetchNearbyOrders();
  }, [radiusFilter]);
  
  const fetchNearbyOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real app, you would fetch nearby orders from the API based on the shop owner's location
      // For demo, we'll use mock data
      setTimeout(() => {
        const mockOrders = generateMockOrders();
        setNearbyOrders(mockOrders);
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Failed to fetch nearby orders. Please try again.');
      setLoading(false);
    }
  };
  
  const generateMockOrders = () => {
    // Generate mock orders within the selected radius
    const maxRadius = parseInt(radiusFilter);
    const orders = [];
    
    for (let i = 1; i <= 12; i++) {
      const distance = (Math.random() * maxRadius).toFixed(1);
      const itemCount = Math.floor(Math.random() * 8) + 1;
      const total = (Math.random() * 50 + 10).toFixed(2);
      
      orders.push({
        id: `order-${i}`,
        buyer: {
          id: `buyer-${i}`,
          name: `Customer ${i}`,
          rating: (Math.random() * 2 + 3).toFixed(1),
          orderCount: Math.floor(Math.random() * 20) + 1,
        },
        items: itemCount,
        total: parseFloat(total),
        distance: parseFloat(distance),
        time: `${Math.floor(Math.random() * 30) + 1} mins ago`,
        address: `${Math.floor(Math.random() * 999) + 1} Main St, Anytown`,
        paymentMethod: Math.random() > 0.5 ? 'Card' : 'Cash',
      });
    }
    
    return orders;
  };
  
  const handleRadiusChange = (e) => {
    setRadiusFilter(e.target.value);
  };
  
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };
  
  const handleAcceptOrder = async (order) => {
    try {
      setAcceptingOrder(order.id);
      
      // In a real app, you would call the API to accept the order
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Remove the order from the list
      setNearbyOrders(prevOrders => 
        prevOrders.filter(o => o.id !== order.id)
      );
      
      // Show success message or redirect to active orders
      navigate('/owner/my-orders');
    } catch (err) {
      console.error('Failed to accept order:', err);
      // Show error message
    } finally {
      setAcceptingOrder(null);
    }
  };
  
  const handleRefresh = () => {
    fetchNearbyOrders();
  };
  
  // Sort orders
  const sortedOrders = [...nearbyOrders].sort((a, b) => {
    if (sortBy === 'distance') {
      return a.distance - b.distance;
    } else if (sortBy === 'time') {
      return a.time.localeCompare(b.time);
    } else if (sortBy === 'total-high') {
      return b.total - a.total;
    } else if (sortBy === 'total-low') {
      return a.total - b.total;
    }
    return 0;
  });
  
  return (
    <div className="nearby-orders-page">
      <div className="page-header">
        <h1>Nearby Orders</h1>
        <Button 
          variant="outline"
          onClick={handleRefresh}
          icon="🔄"
          isLoading={loading}
        >
          Refresh
        </Button>
      </div>
      
      <div className="filters-container">
        <div className="filter-group">
          <label htmlFor="radius-filter">Distance:</label>
          <select 
            id="radius-filter" 
            value={radiusFilter} 
            onChange={handleRadiusChange}
            className="filter-select"
          >
            <option value="1">1 km</option>
            <option value="2">2 km</option>
            <option value="5">5 km</option>
            <option value="10">10 km</option>
            <option value="15">15 km</option>
            <option value="20">20 km</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="sort-by">Sort By:</label>
          <select 
            id="sort-by" 
            value={sortBy} 
            onChange={handleSortChange}
            className="filter-select"
          >
            <option value="distance">Distance (Nearest First)</option>
            <option value="time">Time (Newest First)</option>
            <option value="total-high">Total (High to Low)</option>
            <option value="total-low">Total (Low to High)</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="orders-loading">
          <div className="loader"></div>
          <p>Finding nearby orders...</p>
        </div>
      ) : error ? (
        <div className="orders-error">
          <div className="error-icon">⚠️</div>
          <h2>Error loading orders</h2>
          <p>{error}</p>
          <Button variant="primary" onClick={handleRefresh}>
            Try Again
          </Button>
        </div>
      ) : sortedOrders.length === 0 ? (
        <div className="orders-empty">
          <div className="empty-icon">📍</div>
          <h2>No nearby orders</h2>
          <p>There are no orders within {radiusFilter} km of your location</p>
          <Button variant="primary" onClick={handleRefresh}>
            Refresh
          </Button>
        </div>
      ) : (
        <div className="orders-grid">
          {sortedOrders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="distance-badge">
                  <span className="distance-icon">📍</span>
                  {order.distance} km away
                </div>
                <div className="time-info">{order.time}</div>
              </div>
              
              <div className="buyer-info">
                <h3 className="buyer-name">{order.buyer.name}</h3>
                <div className="buyer-meta">
                  <span className="buyer-rating">
                    ⭐ {order.buyer.rating} ({order.buyer.orderCount} orders)
                  </span>
                </div>
              </div>
              
              <div className="order-details">
                <div className="detail-row">
                  <span className="detail-label">Items:</span>
                  <span className="detail-value">{order.items}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Total:</span>
                  <span className="detail-value total-value">${order.total.toFixed(2)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Payment:</span>
                  <span className="detail-value">{order.paymentMethod}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Address:</span>
                  <span className="detail-value address-value">{order.address}</span>
                </div>
              </div>
              
              <div className="order-actions">
                <Button 
                  variant="primary" 
                  fullWidth
                  onClick={() => handleAcceptOrder(order)}
                  isLoading={acceptingOrder === order.id}
                >
                  Accept Order
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NearbyOrders;