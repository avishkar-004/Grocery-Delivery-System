import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/cart-item.css';

const CartItem = ({ item, onQuantityChange, onRemove }) => {
  const handleQuantityChange = (type) => {
    if (type === 'decrease') {
      onQuantityChange(item.id, item.quantity - 1);
    } else if (type === 'increase') {
      onQuantityChange(item.id, item.quantity + 1);
    }
  };

  const itemTotal = item.price * item.quantity;

  return (
    <div className="cart-item">
      <div className="cart-item-product">
        <div className="cart-item-image">
          <img 
            src={item.image || '/src/assets/images/product-placeholder.jpg'} 
            alt={item.name} 
          />
        </div>
        <div className="cart-item-details">
          <Link to={`/buyer/product/${item.id}`} className="cart-item-name">
            {item.name}
          </Link>
          <div className="cart-item-meta">
            <span className="cart-item-category">{item.category}</span>
            {item.shop && (
              <span className="cart-item-shop">Sold by: {item.shop.name}</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="cart-item-price">
        ${item.price.toFixed(2)}
      </div>
      
      <div className="cart-item-quantity">
        <div className="quantity-controls">
          <button 
            className="quantity-btn" 
            onClick={() => handleQuantityChange('decrease')}
            disabled={item.quantity <= 1}
          >
            -
          </button>
          <span className="quantity-value">{item.quantity}</span>
          <button 
            className="quantity-btn" 
            onClick={() => handleQuantityChange('increase')}
          >
            +
          </button>
        </div>
      </div>
      
      <div className="cart-item-total">
        ${itemTotal.toFixed(2)}
      </div>
      
      <div className="cart-item-actions">
        <button 
          className="cart-item-remove" 
          onClick={() => onRemove(item.id)}
          title="Remove item"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default CartItem;