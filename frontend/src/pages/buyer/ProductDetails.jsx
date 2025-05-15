import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CartContext } from '../../context/CartContext';
import { getProductById } from '../../services/product.service';
import Button from '../../components/common/Button';
import '../../styles/product-details.css';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const productData = await getProductById(id);
        setProduct(productData);
      } catch (err) {
        setError(err.message || 'Failed to fetch product details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  const handleQuantityChange = (type) => {
    if (type === 'decrease' && quantity > 1) {
      setQuantity(quantity - 1);
    } else if (type === 'increase') {
      setQuantity(quantity + 1);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      // Show a success message or toast notification
      // You can implement a toast notification system
    }
  };

  const handleBuyNow = () => {
    if (product) {
      addToCart(product, quantity);
      navigate('/buyer/checkout');
    }
  };

  if (loading) {
    return (
      <div className="product-details-loading">
        <div className="loader"></div>
        <p>Loading product details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-details-error">
        <h2>Error loading product</h2>
        <p>{error}</p>
        <Button variant="primary" onClick={() => navigate('/buyer')}>
          Back to Home
        </Button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-details-error">
        <h2>Product not found</h2>
        <p>The product you are looking for does not exist.</p>
        <Button variant="primary" onClick={() => navigate('/buyer')}>
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="product-details-page">
      <div className="breadcrumb">
        <span onClick={() => navigate('/buyer')}>Home</span>
        <span className="separator">/</span>
        <span onClick={() => navigate('/buyer', { state: { category: product.category } })}>
          {product.category}
        </span>
        <span className="separator">/</span>
        <span className="active">{product.name}</span>
      </div>

      <div className="product-details-content">
        <div className="product-image-container">
          <img 
            src={product.image || '/src/assets/images/product-placeholder.jpg'} 
            alt={product.name} 
            className="product-image" 
          />
        </div>

        <div className="product-info">
          <h1 className="product-name">{product.name}</h1>
          
          <div className="product-meta">
            <span className="product-category">{product.category}</span>
            {product.inStock ? (
              <span className="product-availability in-stock">In Stock</span>
            ) : (
              <span className="product-availability out-of-stock">Out of Stock</span>
            )}
          </div>
          
          <div className="product-price">
            <span className="current-price">${product.price.toFixed(2)}</span>
            {product.originalPrice && (
              <span className="original-price">${product.originalPrice.toFixed(2)}</span>
            )}
          </div>
          
          <div className="product-shop-owner">
            <h3>Sold by:</h3>
            <div className="shop-info">
              <div className="shop-avatar">
                {product.shop?.name?.charAt(0) || 'S'}
              </div>
              <div className="shop-details">
                <p className="shop-name">{product.shop?.name || 'Local Shop'}</p>
                <p className="shop-rating">
                  ⭐ {product.shop?.rating || '4.5'} ({product.shop?.reviewCount || '120'} reviews)
                </p>
              </div>
            </div>
          </div>
          
          <div className="quantity-selector">
            <span className="quantity-label">Quantity:</span>
            <div className="quantity-controls">
              <button 
                className="quantity-btn" 
                onClick={() => handleQuantityChange('decrease')}
                disabled={quantity <= 1}
              >
                -
              </button>
              <span className="quantity-value">{quantity}</span>
              <button 
                className="quantity-btn" 
                onClick={() => handleQuantityChange('increase')}
              >
                +
              </button>
            </div>
          </div>
          
          <div className="product-actions">
            <Button 
              variant="outline" 
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className="add-to-cart-btn"
            >
              Add to Cart
            </Button>
            <Button 
              variant="primary" 
              onClick={handleBuyNow}
              disabled={!product.inStock}
              className="buy-now-btn"
            >
              Buy Now
            </Button>
          </div>
        </div>
      </div>

      <div className="product-details-tabs">
        <div className="tabs-header">
          <button
            className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
            onClick={() => setActiveTab('description')}
          >
            Description
          </button>
          <button
            className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button
            className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            Reviews
          </button>
        </div>
        
        <div className="tabs-content">
          {activeTab === 'description' && (
            <div className="tab-panel">
              <p>{product.description}</p>
            </div>
          )}
          
          {activeTab === 'details' && (
            <div className="tab-panel">
              <div className="product-attributes">
                <div className="attribute-item">
                  <span className="attribute-label">Weight:</span>
                  <span className="attribute-value">{product.weight || '500g'}</span>
                </div>
                <div className="attribute-item">
                  <span className="attribute-label">Origin:</span>
                  <span className="attribute-value">{product.origin || 'Local'}</span>
                </div>
                <div className="attribute-item">
                  <span className="attribute-label">Shelf Life:</span>
                  <span className="attribute-value">{product.shelfLife || '3-5 days'}</span>
                </div>
                <div className="attribute-item">
                  <span className="attribute-label">Storage:</span>
                  <span className="attribute-value">{product.storage || 'Keep refrigerated'}</span>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'reviews' && (
            <div className="tab-panel">
              <div className="reviews-summary">
                <div className="average-rating">
                  <span className="rating-value">{product.rating || '4.3'}</span>
                  <div className="rating-stars">
                    ⭐⭐⭐⭐⭐
                  </div>
                  <span className="rating-count">
                    Based on {product.reviewCount || '27'} reviews
                  </span>
                </div>
                
                <Button variant="outline" className="write-review-btn">
                  Write a Review
                </Button>
              </div>
              
              <div className="reviews-list">
                {(product.reviews || [
                  {
                    id: 1,
                    user: 'John D.',
                    rating: 5,
                    date: '2023-04-15',
                    comment: 'Very fresh and tasty! Will buy again.',
                  },
                  {
                    id: 2,
                    user: 'Maria S.',
                    rating: 4,
                    date: '2023-04-10',
                    comment: 'Good quality product but delivery was a bit late.',
                  },
                ]).map(review => (
                  <div key={review.id} className="review-item">
                    <div className="review-header">
                      <div className="reviewer-info">
                        <span className="reviewer-name">{review.user}</span>
                        <span className="review-date">{review.date}</span>
                      </div>
                      <div className="review-rating">
                        {'⭐'.repeat(review.rating)}
                      </div>
                    </div>
                    <p className="review-comment">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="related-products">
        <h2>You may also like</h2>
        <div className="related-products-list">
          {/* Placeholder for related products */}
          <p>Related products will be displayed here</p>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;