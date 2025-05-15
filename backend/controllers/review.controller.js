const db = require('../models');
const { successResponse, errorResponse, notFoundResponse, forbiddenResponse } = require('../utils/response.utils');

const ProductReview = db.productReviews;
const Order = db.orderItems;
const User = db.users;

// Create a product review
exports.create = async (req, res) => {
  try {
    const userId = req.userId;
    const { productId, rating, comment } = req.body;
    
    // Check if product exists
    const product = await db.products.findByPk(productId);
    if (!product) {
      return notFoundResponse(res, 'Product not found');
    }
    
    // Check if user has purchased this product
    const hasPurchased = await Order.findOne({
      where: { productId },
      include: [
        {
          model: db.orders,
          as: 'order',
          where: {
            buyerId: userId,
            status: 'Delivered'
          }
        }
      ]
    });
    
    if (!hasPurchased) {
      return errorResponse(res, 'You can only review products you have purchased', 400);
    }
    
    // Check if user has already reviewed this product
    const existingReview = await ProductReview.findOne({
      where: {
        productId,
        userId
      }
    });
    
    if (existingReview) {
      return errorResponse(res, 'You have already reviewed this product', 409);
    }
    
    // Create review
    const review = await ProductReview.create({
      productId,
      userId,
      rating,
      comment
    });
    
    // Get user info for response
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name']
    });
    
    return successResponse(res, {
      ...review.toJSON(),
      user
    }, 'Review created successfully', 201);
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// Get reviews for a product
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit, offset } = req.query;
    
    // Check if product exists
    const product = await db.products.findByPk(productId);
    if (!product) {
      return notFoundResponse(res, 'Product not found');
    }
    
    // Set up pagination
    const paginationOptions = {};
    if (limit) paginationOptions.limit = parseInt(limit);
    if (offset) paginationOptions.offset = parseInt(offset);
    
    // Get reviews
    const reviews = await ProductReview.findAll({
      where: { productId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name']
        }
      ],
      ...paginationOptions,
      order: [['createdAt', 'DESC']]
    });
    
    // Get total count for pagination
    const totalReviews = await ProductReview.count({
      where: { productId }
    });
    
    return successResponse(res, {
      reviews,
      totalReviews,
      currentPage: offset ? Math.floor(parseInt(offset) / parseInt(limit)) + 1 : 1,
      totalPages: limit ? Math.ceil(totalReviews / parseInt(limit)) : 1
    }, 'Reviews retrieved successfully');
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// Get reviews by a user
exports.getUserReviews = async (req, res) => {
  try {
    const userId = req.userId;
    
    const reviews = await ProductReview.findAll({
      where: { userId },
      include: [
        {
          model: db.products,
          as: 'product',
          attributes: ['id', 'name', 'image']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    return successResponse(res, reviews, 'User reviews retrieved successfully');
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// Update a review
exports.update = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { rating, comment } = req.body;
    
    // Find review
    const review = await ProductReview.findByPk(id);
    if (!review) {
      return notFoundResponse(res, 'Review not found');
    }
    
    // Check if user owns the review
    if (review.userId !== userId) {
      return forbiddenResponse(res, 'You do not have permission to update this review');
    }
    
    // Update review
    await review.update({
      rating: rating || review.rating,
      comment: comment !== undefined ? comment : review.comment
    });
    
    // Get user info for response
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name']
    });
    
    return successResponse(res, {
      ...review.toJSON(),
      user
    }, 'Review updated successfully');
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// Delete a review
exports.delete = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    
    // Find review
    const review = await ProductReview.findByPk(id);
    if (!review) {
      return notFoundResponse(res, 'Review not found');
    }
    
    // Check if user owns the review
    if (review.userId !== userId) {
      return forbiddenResponse(res, 'You do not have permission to delete this review');
    }
    
    // Delete review
    await review.destroy();
    
    return successResponse(res, null, 'Review deleted successfully');
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};