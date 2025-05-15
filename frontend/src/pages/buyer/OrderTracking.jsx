import { useState, useEffect, useContext } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { OrderContext } from '../../context/OrderContext';
import OrderTracker from '../../components/buyer/OrderTracker';
import Button from '../../components/common/Button';
import ShopOwnerDetails from '../../components/buyer/ShopOwnerDetails';
import '../../styles/order-tracking.css';

const OrderTracking = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { fetchOrderById } = useContext(OrderContext);
  
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!order);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // If order is not passed via location state, fetch it
    if (!order) {
      const getOrder = async () => {
        try {
          setLoading(true);
          const orderData = await fetchOrderById(orderId);
          setOrder(orderData);
        } catch (err) {
          setError(err.message || 'Failed to fetch order');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      
      getOrder();
    }
  }, [orderId, order, fetchOrderById]);
  
  // For demo purposes, simulate order status updates
  useEffect(() => {
    if (order && order.status === 'Placed') {
      // Simulate order being accepted by shop
      const acceptTimer = setTimeout(() => {
        setOrder(prev => ({
          ...prev,
          status: 'Accepted',
          shopOwner: {
            id: 'owner1',
            name: 'Fresh Grocers',
            phone: '123-456-7890',
            address: '123 Market St, New York, NY',
            rating: 4.8,
            image: '/src/assets/images/shop-placeholder.jpg'
          }
        }));
      }, 5000);
      
      return () => clearTimeout(acceptTimer);
    }
    
    if (order && order.status === 'Accepted') {
      // Simulate order preparation
      const prepTimer = setTimeout(() => {
        setOrder(prev => ({ ...prev, status: 'Preparing' }));
      }, 10000);
      
      return () => clearTimeout(prepTimer);
    }
    
    if (order && order.status === 'Preparing') {
      // Simulate order out for delivery
      const deliveryTimer = setTimeout(() => {
        setOrder(prev => ({ ...prev, status: 'Out for Delivery' }));
      }, 15000);
      
      return () => clearTimeout(deliveryTimer);
    }
  }, [order]);
  
  if (loading) {
    return (
      <div className="order-tracking-loading">
        <div className="loader"></div>
        <p>Loading order information...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="order-tracking-error">
        <h2>Error loading order</h2>
        <p>{error}</p>
        <Button variant="primary" onClick={() => navigate('/buyer/orders')}>
          View All Orders
        </Button>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="order-tracking-error">
        <h2>Order not found</h2>
        <p>The order you are looking for does not exist.</p>
        <Button variant="primary" onClick={() => navigate('/buyer/orders')}>
          View All Orders
        </Button>
      </div>
    );
  }
  
  // Define steps for order tracking
  const orderSteps = [
    { status: 'Placed', label: 'Order Placed', description: 'Your order has been received.' },
    { status: 'Accepted', label: 'Order Accepted', description: 'A shop owner has accepted your order.' },
    { status: 'Preparing', label: 'Preparing', description: 'Your items are being prepared.' },
    { status: 'Out for Delivery', label: 'Out for Delivery', description: 'Your order is on the way.' },
    { status: 'Delivered', label: 'Delivered', description: 'Your order has been delivered.' },
  ];
  
  // Get current step index
  const currentStepIndex = orderSteps.findIndex(step => step.status === order.status);
  
  return (
    <div className="order-tracking-page">
      <div className="page-header">
        <h1>Order Tracking</h1>
        <p className="breadcrumb">
          <Link to="/buyer">Home</Link> / <Link to="/buyer/orders">Orders</Link> / <span>Tracking</span>
        </p>
      </div>
      
      {order.status === 'Placed' && !order.shopOwner && (
        <div className="order-waiting-banner">
          <div className="order-waiting-icon">⏳</div>
          <div className="order-waiting-text">
            <h2>Waiting for a shop owner to accept your order</h2>
            <p>This usually takes 2-5 minutes. We'll notify you once your order is accepted.</p>
          </div>
        </div>
      )}
      
      <div className="order-tracking-content">
        <div className="order-info-section">
          <div className="order-header">
            <div>
              <h2>Order #{order.id}</h2>
              <p className="order-date">Placed on {order.createdAt || new Date().toLocaleDateString()}</p>
            </div>
            <div className="order-status-badge">
              <span className={`status-${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                {order.status}
              </span>
            </div>
          </div>
          
          <div className="tracking-container">
            <OrderTracker 
              steps={orderSteps} 
              currentStep={currentStepIndex} 
            />
          </div>
          
          {order.shopOwner && (
            <div className="shop-owner-section">
              <h3>Your Order is being handled by:</h3>
              <ShopOwnerDetails shopOwner={order.shopOwner} />
            </div>
          )}
          
          <div className="delivery-info">
            <div className="delivery-address">
              <h3>Delivery Address</h3>
              <div className="address-box">
                <p>{order.address.addressLine1}</p>
                {order.address.addressLine2 && <p>{order.address.addressLine2}</p>}
                <p>{order.address.city}, {order.address.state} {order.address.zipCode}</p>
              </div>
            </div>
            
            <div className="delivery-time">
              <h3>Estimated Delivery</h3>
              <div className="time-box">
                <div className="time-icon">🕒</div>
                <div className="time-details">
                  {order.status === 'Delivered' ? (
                    <p className="delivered-time">Delivered at {order.deliveredAt || '2:45 PM'}</p>
                  ) : (
                    <>
                      <p className="time-estimate">Today, {order.estimatedDelivery || '3:30 PM - 4:00 PM'}</p>
                      <p className="time-note">Delivery timing may vary based on traffic</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="order-details-section">
          <h3>Order Summary</h3>
          
          <div className="order-items">
            {order.items.map(item => (
              <div key={item.id} className="order-item">
                <div className="order-item-image">
                  <img 
                    src={item.image || '/src/assets/images/product-placeholder.jpg'} 
                    alt={item.name} 
                  />
                </div>
                <div className="order-item-details">
                  <h4 className="order-item-name">{item.name}</h4>
                  <div className="order-item-meta">
                    <span className="order-item-quantity">Qty: {item.quantity}</span>
                    <span className="order-item-price">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="order-summary">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${order.subtotal || order.totalAmount.toFixed(2)}</span>
            </div>
            
            <div className="summary-row">
              <span>Delivery Fee</span>
              <span>${order.deliveryFee || '0.00'}</span>
            </div>
            
            {order.discount && (
              <div className="summary-row discount">
                <span>Discount</span>
                <span>-${order.discount}</span>
              </div>
            )}
            
            <div className="summary-row total">
              <span>Total</span>
              <span>${order.totalAmount.toFixed(2)}</span>
            </div>
            
            <div className="summary-row payment">
              <span>Payment Method</span>
              <span className="payment-method">
                {order.paymentMethod === 'card' && '💳 Credit/Debit Card'}
                {order.paymentMethod === 'cash' && '💵 Cash on Delivery'}
                {order.paymentMethod === 'wallet' && '📱 Mobile Wallet'}
              </span>
            </div>
          </div>
          
          <div className="order-actions">
            <Button variant="outline" fullWidth onClick={() => navigate('/buyer/orders')}>
              View All Orders
            </Button>
            
            {order.status === 'Delivered' && (
              <Button variant="primary" fullWidth>
                Rate & Review
              </Button>
            )}
            
            {['Placed', 'Accepted'].includes(order.status) && (
              <Button variant="outline" fullWidth className="cancel-btn">
                Cancel Order
              </Button>
            )}
            
            <Button variant="outline" fullWidth>
              Request Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;