import React, { useState, useEffect } from 'react';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/landing/categories');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
          setCategories(data.data);
        } else {
          setError(data.message || 'Failed to fetch categories');
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setError('Failed to load categories. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <p className="text-xl text-gray-600 dark:text-gray-400">Loading categories...</p>
          </div>
        </section>
    );
  }

  if (error) {
    return (
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <p className="text-xl text-red-600 dark:text-red-400">{error}</p>
          </div>
        </section>
    );
  }

  return (
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">
              <span className="gradient-text">Product Categories</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover fresh groceries across all categories. From spices to beverages,
              we have everything you need for your kitchen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category, index) => (
                <div
                    key={category.id}
                    className="glass-card p-6 glow-effect group"
                    style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {category.icon || "📦"}
                  </div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {category.product_count} items
                  </p>
                </div>
            ))}
          </div>
        </div>
      </section>
  );
};

export default Categories;
