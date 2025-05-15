import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { OrderContext } from '../../context/OrderContext';
import Button from '../../components/common/Button';
import '../../styles/order-history.css';

const OrderHistory = () => {
  const { orders, fetchOrders, loading: ordersLoading } = useContext(OrderContext);
  const navigate = useNavigate();
  
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        await fetchOrders();
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadOrders();
  }, [fetchOrders]);
  
  useEffect(() => {
    // Apply filters
    let filtered = [...orders];
    
    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(order => order.status === filter);
    }
    
    // Filter by search query (search in order ID or items)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(query) ||
        order.items.some(item => 
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
        )
      );
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    setFilteredOrders(filtered);
  }, [orders, filter, searchQuery]);
  
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const getStatusClass = (status) => {
    switch (status) {
      case 'Placed':
        return 'status-placed';
      case 'Accepted':
        return 'status-accepted';
      case 'Preparing':
        return 'status-preparing';
      case 'Out for Delivery':
        return 'status-out-for-delivery';
      case 'Delivered':
        return 'status-delivered';
      case 'Cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  return (
    <div className="order-history-page">
      <div className="page-header">
        <h1>Order History</h1>
      </div>
      
      <div className="orders-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="status-filter">Filter by Status:</label>
            <select 
              id="status-filter" 
              value={filter} 
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="all">All Orders</option>
              <option value="Placed">Placed</option>
              <option value="Accepted">Accepted</option>
              <option value="Preparing">Preparing</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="orders-loading">
          <div className="loader"></div>
          <p>Loading your orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="orders-empty">
          <div className="empty-icon">📦</div>
          <h2>No orders found</h2>
          <p>
            {searchQuery || filter !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'You haven\'t placed any orders yet'
            }
          </p>
          {!(searchQuery || filter !== 'all') && (
            <Button 
              variant="primary"
              onClick={() => navigate('/buyer')}
            >
              Start Shopping
            </Button>
          )}
        </div>
      ) : (
        <div className="orders-list">
          {filteredOrders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-id">
                  <span className="label">Order ID:</span>
                  <span className="value">{order.id}</span>
                </div>
                <div className="order-date">
                  <span className="label">Placed on:</span>
                  <span className="value">{formatDate(order.createdAt)}</span>
                </div>
                <div className="order-status">
                  <span className={`status-badge ${getStatusClass(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
              
              <div className="order-items">
                {order.items.map(item => (
                  <div key={item.id} className="order-item">
                    <div className="item-image">
                      <img src={item.image} alt={item.name} />
                    </div>
                    <div className="item-details">
                      <div className="item-name">{item.name}</div>
                      <div className="item-meta">
                        <span className="item-quantity">Qty: {item.quantity}</span>
                        <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="order-footer">
                <div className="order-summary">
                  <div className="total-items">
                    <span className="label">Total Items:</span>
                    <span className="value">{order.items.reduce((acc, item) => acc + item.quantity, 0)}</span>
                  </div>
                  <div className="total-amount">
                    <span className="label">Order Total:</span>
                    <span className="value">${order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="order-actions">
                  <Button
                    variant="outline"
                    as={Link}
                    to={`/buyer/tracking/${order.id}`}
                  >
                    View Details
                  </Button>
                  
                  {order.status === 'Delivered' && (
                    <Button
                      variant="primary"
                      onClick={() => {}}
                    >
                      Reorder
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;