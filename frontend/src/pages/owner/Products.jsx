import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProductsByOwner, deleteProduct } from '../../services/product.service';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import '../../styles/products.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getProductsByOwner();
        setProducts(data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const confirmDelete = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;

    try {
      await deleteProduct(productToDelete.id);
      setProducts(products.filter(p => p.id !== productToDelete.id));
      setShowDeleteModal(false);
      setProductToDelete(null);
      // Show success message
    } catch (error) {
      console.error('Failed to delete product:', error);
      // Show error message
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    // Search filter
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Category filter
    const matchesCategory = filter === 'all' || product.category === filter;
    
    return matchesSearch && matchesCategory;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else if (sortBy === 'oldest') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    } else if (sortBy === 'name-asc') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'name-desc') {
      return b.name.localeCompare(a.name);
    } else if (sortBy === 'price-low') {
      return a.price - b.price;
    } else if (sortBy === 'price-high') {
      return b.price - a.price;
    }
    return 0;
  });

  // Get unique categories
  const categories = [...new Set(products.map(product => product.category))];
  
  return (
    <div className="products-page">
      <div className="page-header">
        <h1>Products</h1>
        <Button 
          variant="primary"
          onClick={() => {}}
          as={Link}
          to="/owner/products/add"
        >
          Add New Product
        </Button>
      </div>
      
      <div className="products-filters">
        <div className="search-box">
          <Input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={handleSearch}
            icon="🔍"
          />
        </div>
        
        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="category-filter">Category:</label>
            <select 
              id="category-filter" 
              value={filter} 
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
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
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="price-low">Price (Low to High)</option>
              <option value="price-high">Price (High to Low)</option>
            </select>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="products-loading">
          <div className="loader"></div>
          <p>Loading products...</p>
        </div>
      ) : sortedProducts.length === 0 ? (
        <div className="products-empty">
          <div className="empty-icon">📦</div>
          <h2>No products found</h2>
          <p>
            {searchQuery || filter !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by adding your first product'
            }
          </p>
          {!(searchQuery || filter !== 'all') && (
            <Button 
              variant="primary"
              onClick={() => {}}
              as={Link}
              to="/owner/products/add"
            >
              Add New Product
            </Button>
          )}
        </div>
      ) : (
        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.map(product => (
                <tr key={product.id}>
                  <td className="product-image-cell">
                    <img 
                      src={product.image || '/src/assets/images/product-placeholder.jpg'} 
                      alt={product.name} 
                      className="product-thumbnail"
                    />
                  </td>
                  <td className="product-name-cell">
                    <div className="product-name">{product.name}</div>
                    <div className="product-id">ID: {product.id}</div>
                  </td>
                  <td>{product.category}</td>
                  <td className="price-cell">${product.price.toFixed(2)}</td>
                  <td>{product.stock || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${product.inStock ? 'in-stock' : 'out-of-stock'}`}>
                      {product.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <Button 
                        variant="outline" 
                        size="sm"
                        as={Link}
                        to={`/owner/products/edit/${product.id}`}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => confirmDelete(product)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>Confirm Delete</h2>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{productToDelete?.name}</strong>?</p>
              <p className="warning-text">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <Button variant="outline" onClick={cancelDelete}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;