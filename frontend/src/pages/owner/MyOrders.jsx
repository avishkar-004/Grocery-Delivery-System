import { useState, useEffect, useContext } from 'react';
import { OrderContext } from '../../context/OrderContext';
import Button from '../../components/common/Button';
import '../../styles/my-orders.css';

const MyOrders = () => {
  const { orders, fetchOrders, updateOrder, loading: ordersLoading } = useContext(OrderContext);
  
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingOrder, setUpdatingOrder] = useState(null);
  
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
    
    // For shop owners, only show orders they have accepted
    filtered = filtered.filter(order => order.shopOwner?.id === 'owner1');
    
    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(order => order.status === filter);
    }
    
    // Filter by search query (search in order ID, buyer name, or items)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(query) ||
        order.buyerId?.toLowerCase().includes(query) ||
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
  
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrder(orderId);
      await updateOrder(orderId, newStatus);
    } catch (error) {
      console.error('Failed to update order status:', error);
    } finally {
      setUpdatingOrder(null);
    }
  };
  
  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'Accepted':
        return 'Preparing';
      case 'Preparing':
        return 'Out for Delivery';
      case 'Out for Delivery':
        return 'Delivered';
      default:
        return null;
    }
  };
  
  const getStatusClass = (status) => {
    switch (status) {
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
    <div className="my-orders-page">
      <div className="page-header">
        <h1>My Orders</h1>
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
              : 'You haven\'t accepted any orders yet'
            }
          </p>
          {!(searchQuery || filter !== 'all') && (
            <Button 
              variant="primary"
              onClick={() => {}}
              to="/owner/nearby-orders"
            >
              Find Nearby Orders
            </Button>
          )}
        </div>
      ) : (
        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Customer</th>
                <th>Address</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => {
                const nextStatus = getNextStatus(order.status);
                
                return (
                  <tr key={order.id}>
                    <td className="order-id-cell">{order.id}</td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>
                      <div className="items-cell">
                        <span className="items-count">{order.items.length} items</span>
                        <div className="items-preview">
                          {order.items.slice(0, 2).map(item => (
                            <div key={item.id} className="item-preview">
                              {item.name} x {item.quantity}
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <div className="item-preview more">
                              +{order.items.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="total-cell">${order.totalAmount.toFixed(2)}</td>
                    <td>
                      <div className="customer-cell">
                        <span className="customer-name">John Doe</span>
                        <span className="customer-phone">123-456-7890</span>
                      </div>
                    </td>
                    <td className="address-cell">
                      <div className="address-preview">
                        {order.address.addressLine1}
                        <br />
                        {order.address.city}, {order.address.state}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <div className="action-buttons">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {}}
                        >
                          Details
                        </Button>
                        
                        {nextStatus && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleUpdateStatus(order.id, nextStatus)}
                            isLoading={updatingOrder === order.id}
                          >
                            Mark as {nextStatus}
                          </Button>
                        )}
                        
                        {order.status === 'Accepted' && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleUpdateStatus(order.id, 'Cancelled')}
                            isLoading={updatingOrder === order.id}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyOrders;