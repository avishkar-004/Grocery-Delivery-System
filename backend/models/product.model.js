module.exports = (sequelize, DataTypes, uuidv4) => {
  const Product = sequelize.define('product', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4()
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    originalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'original_price'
    },
    categoryId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      field: 'category_id',
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    shopId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      field: 'shop_id',
      references: {
        model: 'shop_profiles',
        key: 'id'
      }
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    inStock: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'in_stock'
    },
    weight: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    origin: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    shelfLife: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'shelf_life'
    },
    storage: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    rating: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: false,
      defaultValue: 0
    },
    reviewCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'review_count'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    tableName: 'products',
    timestamps: true,
    underscored: true,
    hooks: {
      // Auto-update rating when reviews are added
      beforeUpdate: async (product) => {
        if (product.changed('reviewCount') && product.reviewCount > 0) {
          const reviews = await product.getReviews();
          const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
          product.rating = totalRating / product.reviewCount;
        }
      }
    }
  });

  return Product;
};