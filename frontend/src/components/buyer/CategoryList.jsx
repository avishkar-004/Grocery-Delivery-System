import React from 'react';
import '../../styles/category-list.css';

const CategoryList = ({ categories, selectedCategory, onSelectCategory, loading }) => {
  // Default categories if none provided
  const defaultCategories = [
    'Fruits',
    'Vegetables',
    'Dairy',
    'Bakery',
    'Meat',
    'Seafood',
    'Beverages',
  ];
  
  const displayCategories = categories?.length > 0 ? categories : defaultCategories;
  
  if (loading) {
    return (
      <div className="categories-loading">
        <div className="category-skeleton"></div>
        <div className="category-skeleton"></div>
        <div className="category-skeleton"></div>
        <div className="category-skeleton"></div>
        <div className="category-skeleton"></div>
      </div>
    );
  }
  
  // Category icons mapping
  const categoryIcons = {
    'Fruits': '🍎',
    'Vegetables': '🥦',
    'Dairy': '🥛',
    'Bakery': '🍞',
    'Meat': '🥩',
    'Seafood': '🐟',
    'Beverages': '🥤',
    'Snacks': '🍿',
    'Canned Goods': '🥫',
    'Frozen Foods': '❄️',
  };
  
  return (
    <div className="categories-container">
      <div className="category-item-wrapper">
        <div 
          className={`category-item ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => onSelectCategory('all')}
        >
          <div className="category-icon">🏠</div>
          <div className="category-name">All</div>
        </div>
      </div>
      
      {displayCategories.map(category => (
        <div key={category} className="category-item-wrapper">
          <div 
            className={`category-item ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => onSelectCategory(category)}
          >
            <div className="category-icon">
              {categoryIcons[category] || '📦'}
            </div>
            <div className="category-name">{category}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CategoryList;