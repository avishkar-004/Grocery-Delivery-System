import React from 'react';
import '../../styles/shop-owner-details.css';

const ShopOwnerDetails = ({ shopOwner }) => {
  if (!shopOwner) {
    return null;
  }

  return (
    <div className="shop-owner-details">
      <div className="shop-owner-card">
        <div className="shop-image">
          {shopOwner.image ? (
            <img src={shopOwner.image} alt={shopOwner.name} />
          ) : (
            <div className="shop-avatar">
              {shopOwner.name ? shopOwner.name.charAt(0).toUpperCase() : 'S'}
            </div>
          )}
        </div>
        
        <div className="shop-info">
          <h3 className="shop-name">{shopOwner.name}</h3>
          <div className="shop-rating">
            <span className="rating-stars">
              {'⭐'.repeat(Math.floor(shopOwner.rating))}
              {shopOwner.rating % 1 >= 0.5 ? '⭐' : ''}
            </span>
            <span className="rating-value">{shopOwner.rating} ({shopOwner.reviewCount} reviews)</span>
          </div>
          
          {shopOwner.address && (
            <div className="shop-address">
              <span className="address-icon">📍</span>
              <span>{shopOwner.address}</span>
            </div>
          )}
          
          {shopOwner.phone && (
            <div className="shop-phone">
              <span className="phone-icon">📞</span>
              <span>{shopOwner.phone}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="contact-actions">
        <button className="contact-button phone-button">
          <span className="button-icon">📞</span>
          Call
        </button>
        <button className="contact-button message-button">
          <span className="button-icon">💬</span>
          Message
        </button>
      </div>
    </div>
  );
};

export default ShopOwnerDetails;