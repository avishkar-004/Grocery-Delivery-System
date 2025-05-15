import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CategoryList from '../../components/buyer/CategoryList';
import ProductCard from '../../components/buyer/ProductCard';
import { getProducts, getCategories } from '../../services/product.service';
import '../../styles/home.css';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsData, categoriesData] = await Promise.all([
          getProducts(),
          getCategories()
        ]);
        
        setProducts(productsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProducts = products.filter(product => {
    // Filter by category
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    
    // Filter by search query
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Fresh Groceries Delivered to Your Door</h1>
          <p>Order fresh fruits, vegetables, and groceries from your local stores</p>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search for groceries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button className="search-button">Search</button>
          </div>
        </div>
      </section>

      <section className="categories-section">
        <div className="section-header">
          <h2>Categories</h2>
          <Link to="/buyer/categories" className="view-all">View All</Link>
        </div>
        
        <CategoryList 
          categories={categories} 
          selectedCategory={selectedCategory} 
          onSelectCategory={setSelectedCategory} 
          loading={loading}
        />
      </section>

      <section className="products-section">
        <div className="section-header">
          <h2>{selectedCategory === 'all' ? 'All Products' : selectedCategory}</h2>
          <div className="filters">
            <select className="filter-select">
              <option value="popularity">Most Popular</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="products-loading">Loading products...</div>
        ) : (
          <div className="products-grid">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="no-products">
                <p>No products found</p>
                {searchQuery && (
                  <button 
                    className="btn btn-outline"
                    onClick={() => setSearchQuery('')}
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;