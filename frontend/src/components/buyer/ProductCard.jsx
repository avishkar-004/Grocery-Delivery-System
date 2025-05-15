import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../../context/CartContext';
import Button from '../common/Button';
import '../../styles/product-card.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useContext(CartContext);
  const navigate = useNavigate();
  
  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product.inStock) {
      addToCart(product, 1);
      // Show success message or notification
    }
  };
  
  const handleViewDetails = () => {
    navigate(`/buyer/product/${product.id}`);
  };
  
  return (
    <div className="product-card" onClick={handleViewDetails}>
      <div className="product-image-container">
        <img 
          src={product.image || '/src/assets/images/product-placeholder.jpg'} 
          alt={product.name} 
          className="product-image" 
        />
        
        {!product.inStock && (
          <div className="out-of-stock-badge">Out of Stock</div>
        )}
      </div>
      
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        
        <div className="product-meta">
          <span className="product-category">{product.category}</span>
          {product.weight && <span className="product-weight">{product.weight}</span>}
        </div>
        
        <div className="product-price">
          <span className="current-price">${product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <span className="original-price">${product.originalPrice.toFixed(2)}</span>
          )}
        </div>
        
        <div className="product-actions">
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className="add-to-cart-btn"
          >
            {product.inStock ? 'Add to Cart' : 'Out of Stock'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;