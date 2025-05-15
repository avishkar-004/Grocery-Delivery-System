import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import { OrderContext } from '../../context/OrderContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import '../../styles/checkout.css';

const Checkout = () => {
  const { cartItems, totalAmount, clearCart } = useContext(CartContext);
  const { currentUser } = useContext(AuthContext);
  const { createOrder } = useContext(OrderContext);
  const navigate = useNavigate();
  
  const [addressType, setAddressType] = useState('existing');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [formData, setFormData] = useState({
    fullName: currentUser?.name || '',
    phone: currentUser?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    deliveryInstructions: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  
  const [savedAddresses, setSavedAddresses] = useState([
    // Example addresses - in a real app, these would come from the API
    {
      id: '1',
      label: 'Home',
      addressLine1: '123 Main St',
      addressLine2: 'Apt 4B',
      city: 'Brooklyn',
      state: 'NY',
      zipCode: '11201',
      isDefault: true,
    },
    {
      id: '2',
      label: 'Work',
      addressLine1: '456 Park Ave',
      addressLine2: 'Floor 8',
      city: 'New York',
      state: 'NY',
      zipCode: '10022',
      isDefault: false,
    },
  ]);
  
  // Delivery fee and calculation
  const deliveryFee = 5;
  const freeDeliveryThreshold = 50;
  const finalTotal = totalAmount >= freeDeliveryThreshold ? totalAmount : totalAmount + deliveryFee;
  
  useEffect(() => {
    // If cart is empty, redirect to cart page
    if (cartItems.length === 0) {
      navigate('/buyer/cart');
    }
    
    // Set selected address to default (if any)
    const defaultAddress = savedAddresses.find(addr => addr.isDefault);
    if (defaultAddress) {
      setSelectedAddress(defaultAddress.id);
    }
  }, [cartItems, navigate, savedAddresses]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };
  
  const detectCurrentLocation = () => {
    setLoadingLocation(true);
    
    // In a real app, this would use the Geolocation API and a geocoding service
    // For demo, we'll simulate getting the location after a short delay
    setTimeout(() => {
      setFormData({
        ...formData,
        addressLine1: '789 Current St',
        city: 'Current City',
        state: 'Current State',
        zipCode: '12345',
      });
      setLoadingLocation(false);
      setUseCurrentLocation(true);
    }, 1500);
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (addressType === 'existing' && !selectedAddress) {
      newErrors.selectedAddress = 'Please select an address';
    }
    
    if (addressType === 'new') {
      if (!formData.fullName) newErrors.fullName = 'Full name is required';
      if (!formData.phone) newErrors.phone = 'Phone number is required';
      if (!formData.addressLine1) newErrors.addressLine1 = 'Address is required';
      if (!formData.city) newErrors.city = 'City is required';
      if (!formData.state) newErrors.state = 'State is required';
      if (!formData.zipCode) newErrors.zipCode = 'Zip code is required';
    }
    
    if (!paymentMethod) {
      newErrors.paymentMethod = 'Please select a payment method';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare order data
      let orderAddress;
      if (addressType === 'existing') {
        orderAddress = savedAddresses.find(addr => addr.id === selectedAddress);
      } else {
        orderAddress = {
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
        };
      }
      
      const orderData = {
        items: cartItems,
        totalAmount: finalTotal,
        address: orderAddress,
        paymentMethod,
        deliveryInstructions: formData.deliveryInstructions,
      };
      
      // Create order
      const order = await createOrder(orderData);
      
      // Clear cart
      clearCart();
      
      // Redirect to order confirmation
      navigate(`/buyer/tracking/${order.id}`, { state: { order } });
    } catch (error) {
      console.error('Failed to place order:', error);
      setErrors({
        submit: error.message || 'Failed to place order. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="checkout-page">
      <div className="page-header">
        <h1>Checkout</h1>
        <p className="breadcrumb">
          <Link to="/buyer">Home</Link> / <Link to="/buyer/cart">Cart</Link> / <span>Checkout</span>
        </p>
      </div>
      
      <div className="checkout-content">
        <div className="checkout-form-container">
          <form className="checkout-form" onSubmit={handleSubmit}>
            {/* Delivery Address */}
            <div className="checkout-section">
              <h2 className="section-title">Delivery Address</h2>
              
              {savedAddresses.length > 0 && (
                <div className="address-type-selector">
                  <button
                    type="button"
                    className={`address-type-btn ${addressType === 'existing' ? 'active' : ''}`}
                    onClick={() => setAddressType('existing')}
                  >
                    Saved Addresses
                  </button>
                  <button
                    type="button"
                    className={`address-type-btn ${addressType === 'new' ? 'active' : ''}`}
                    onClick={() => setAddressType('new')}
                  >
                    New Address
                  </button>
                </div>
              )}
              
              {addressType === 'existing' && savedAddresses.length > 0 ? (
                <div className="saved-addresses">
                  {errors.selectedAddress && (
                    <div className="form-error mb-md">{errors.selectedAddress}</div>
                  )}
                  
                  {savedAddresses.map(address => (
                    <div 
                      key={address.id}
                      className={`address-card ${selectedAddress === address.id ? 'selected' : ''}`}
                      onClick={() => setSelectedAddress(address.id)}
                    >
                      <div className="address-card-header">
                        <h3>{address.label}</h3>
                        {address.isDefault && (
                          <span className="default-badge">Default</span>
                        )}
                      </div>
                      <div className="address-card-content">
                        <p>{address.addressLine1}</p>
                        {address.addressLine2 && <p>{address.addressLine2}</p>}
                        <p>{address.city}, {address.state} {address.zipCode}</p>
                      </div>
                      <div className="address-card-radio">
                        <input 
                          type="radio" 
                          name="address" 
                          checked={selectedAddress === address.id} 
                          onChange={() => setSelectedAddress(address.id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="new-address-form">
                  <div className="current-location-btn-container">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={detectCurrentLocation}
                      isLoading={loadingLocation}
                      icon={useCurrentLocation ? "✓" : "📍"}
                      className={useCurrentLocation ? "location-detected" : ""}
                    >
                      {useCurrentLocation ? "Location Detected" : "Detect Current Location"}
                    </Button>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-column">
                      <Input
                        label="Full Name"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        error={errors.fullName}
                        required
                      />
                    </div>
                    <div className="form-column">
                      <Input
                        label="Phone Number"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        error={errors.phone}
                        required
                      />
                    </div>
                  </div>
                  
                  <Input
                    label="Address Line 1"
                    name="addressLine1"
                    value={formData.addressLine1}
                    onChange={handleInputChange}
                    error={errors.addressLine1}
                    required
                  />
                  
                  <Input
                    label="Address Line 2 (Optional)"
                    name="addressLine2"
                    value={formData.addressLine2}
                    onChange={handleInputChange}
                  />
                  
                  <div className="form-row">
                    <div className="form-column">
                      <Input
                        label="City"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        error={errors.city}
                        required
                      />
                    </div>
                    <div className="form-column">
                      <Input
                        label="State"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        error={errors.state}
                        required
                      />
                    </div>
                    <div className="form-column">
                      <Input
                        label="Zip Code"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        error={errors.zipCode}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Delivery Instructions (Optional)</label>
                    <textarea
                      name="deliveryInstructions"
                      value={formData.deliveryInstructions}
                      onChange={handleInputChange}
                      className="form-control"
                      placeholder="E.g., Leave at door, call upon arrival, etc."
                      rows="3"
                    ></textarea>
                  </div>
                </div>
              )}
            </div>
            
            {/* Payment Method */}
            <div className="checkout-section">
              <h2 className="section-title">Payment Method</h2>
              
              {errors.paymentMethod && (
                <div className="form-error mb-md">{errors.paymentMethod}</div>
              )}
              
              <div className="payment-methods">
                <div
                  className={`payment-method-card ${paymentMethod === 'card' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('card')}
                >
                  <div className="payment-icon">💳</div>
                  <div className="payment-details">
                    <h3>Credit/Debit Card</h3>
                    <p>Pay securely with your card</p>
                  </div>
                  <div className="payment-radio">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                    />
                  </div>
                </div>
                
                <div
                  className={`payment-method-card ${paymentMethod === 'cash' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('cash')}
                >
                  <div className="payment-icon">💵</div>
                  <div className="payment-details">
                    <h3>Cash on Delivery</h3>
                    <p>Pay with cash upon delivery</p>
                  </div>
                  <div className="payment-radio">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'cash'}
                      onChange={() => setPaymentMethod('cash')}
                    />
                  </div>
                </div>
                
                <div
                  className={`payment-method-card ${paymentMethod === 'wallet' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('wallet')}
                >
                  <div className="payment-icon">📱</div>
                  <div className="payment-details">
                    <h3>Mobile Wallet</h3>
                    <p>Pay with your mobile wallet</p>
                  </div>
                  <div className="payment-radio">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'wallet'}
                      onChange={() => setPaymentMethod('wallet')}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Submit error */}
            {errors.submit && (
              <div className="alert alert-danger mb-lg">{errors.submit}</div>
            )}
            
            {/* Actions */}
            <div className="checkout-actions">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/buyer/cart')}
              >
                Back to Cart
              </Button>
              
              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
              >
                Place Order
              </Button>
            </div>
          </form>
        </div>
        
        <div className="checkout-summary">
          <div className="checkout-summary-content">
            <h2>Order Summary</h2>
            
            <div className="order-items">
              {cartItems.map(item => (
                <div key={item.id} className="order-item">
                  <div className="order-item-info">
                    <span className="order-item-quantity">{item.quantity}x</span>
                    <span className="order-item-name">{item.name}</span>
                  </div>
                  <div className="order-item-price">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="order-totals">
              <div className="total-row">
                <span>Subtotal</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
              
              <div className="total-row">
                <span>Delivery Fee</span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>
              
              {totalAmount >= freeDeliveryThreshold && (
                <div className="total-row discount">
                  <span>Free Delivery (orders over ${freeDeliveryThreshold})</span>
                  <span>-${deliveryFee.toFixed(2)}</span>
                </div>
              )}
              
              <div className="total-row final">
                <span>Total</span>
                <span>${finalTotal.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="order-notes">
              <p className="delivery-estimate">
                <strong>Estimated Delivery:</strong> 30-45 minutes
              </p>
              
              {totalAmount < freeDeliveryThreshold && (
                <p className="free-delivery-note">
                  Add ${(freeDeliveryThreshold - totalAmount).toFixed(2)} more to get FREE delivery!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;