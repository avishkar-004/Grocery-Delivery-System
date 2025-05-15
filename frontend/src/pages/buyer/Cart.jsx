import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../../context/CartContext';
import Button from '../../components/common/Button';
import CartItem from '../../components/buyer/CartItem';
import '../../styles/cart.css';

const Cart = () => {
  const { cartItems, totalAmount, updateCartItemQuantity, removeFromCart, clearCart } = useContext(CartContext);
  const [isCheckoutEnabled, setIsCheckoutEnabled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Enable checkout if cart has items
    setIsCheckoutEnabled(cartItems.length > 0);
  }, [cartItems]);

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    updateCartItemQuantity(productId, newQuantity);
  };

  const handleRemoveItem = (productId) => {
    removeFromCart(productId);
  };

  const handleClearCart = () => {
    // Confirm before clearing cart
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearCart();
    }
  };

  const handleCheckout = () => {
    navigate('/buyer/checkout');
  };

  return (
    <div className="cart-page">
      <div className="page-header">
        <h1>Your Cart</h1>
        <p className="breadcrumb">
          <Link to="/buyer">Home</Link> / <span>Cart</span>
        </p>
      </div>

      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <div className="empty-cart-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added any items to your cart yet.</p>
          <Button 
            variant="primary" 
            onClick={() => navigate('/buyer')}
          >
            Continue Shopping
          </Button>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items-container">
            <div className="cart-header">
              <div className="cart-column product-column">Product</div>
              <div className="cart-column price-column">Price</div>
              <div className="cart-column quantity-column">Quantity</div>
              <div className="cart-column total-column">Total</div>
              <div className="cart-column action-column"></div>
            </div>

            {cartItems.map(item => (
              <CartItem 
                key={item.id} 
                item={item} 
                onQuantityChange={handleQuantityChange}
                onRemove={handleRemoveItem}
              />
            ))}

            <div className="cart-actions">
              <Button 
                variant="outline" 
                onClick={() => navigate('/buyer')}
              >
                Continue Shopping
              </Button>
              <Button 
                variant="outline" 
                onClick={handleClearCart}
                className="clear-cart-btn"
              >
                Clear Cart
              </Button>
            </div>
          </div>

          <div className="cart-summary">
            <h2>Order Summary</h2>
            
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
            
            <div className="summary-row">
              <span>Delivery Fee</span>
              <span>${(5).toFixed(2)}</span>
            </div>
            
            {totalAmount >= 50 && (
              <div className="summary-row discount">
                <span>Free Delivery (orders over $50)</span>
                <span>-${(5).toFixed(2)}</span>
              </div>
            )}
            
            <div className="summary-row total">
              <span>Total</span>
              <span>${(totalAmount >= 50 ? totalAmount : totalAmount + 5).toFixed(2)}</span>
            </div>
            
            <div className="checkout-button">
              <Button 
                variant="primary" 
                fullWidth 
                disabled={!isCheckoutEnabled}
                onClick={handleCheckout}
              >
                Proceed to Checkout
              </Button>
            </div>
            
            <div className="accepted-payment-methods">
              <p>We Accept:</p>
              <div className="payment-icons">
                <span className="payment-icon">💳</span>
                <span className="payment-icon">💵</span>
                <span className="payment-icon">📱</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;