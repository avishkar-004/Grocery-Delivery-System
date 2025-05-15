module.exports = (sequelize, DataTypes, uuidv4) => {
  const ProductReview = sequelize.define('productReview', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4()
    },
    productId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      field: 'product_id',
      references: {
        model: 'products',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    tableName: 'product_reviews',
    timestamps: true,
    updatedAt: false,
    underscored: true,
    hooks: {
      // Update product rating on review creation
      afterCreate: async (review, options) => {
        const product = await review.getProduct();
        product.reviewCount += 1;
        
        const reviews = await product.getReviews();
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        product.rating = (totalRating / product.reviewCount).toFixed(1);
        
        await product.save({ transaction: options.transaction });
      },
      // Update product rating on review update
      afterUpdate: async (review, options) => {
        if (review.changed('rating')) {
          const product = await review.getProduct();
          const reviews = await product.getReviews();
          const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
          product.rating = (totalRating / product.reviewCount).toFixed(1);
          
          await product.save({ transaction: options.transaction });
        }
      },
      // Update product rating on review deletion
      afterDestroy: async (review, options) => {
        const product = await review.getProduct();
        if (product.reviewCount > 0) {
          product.reviewCount -= 1;
          
          if (product.reviewCount === 0) {
            product.rating = 0;
          } else {
            const reviews = await product.getReviews();
            const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
            product.rating = (totalRating / product.reviewCount).toFixed(1);
          }
          
          await product.save({ transaction: options.transaction });
        }
      }
    }
  });

  return ProductReview;
};