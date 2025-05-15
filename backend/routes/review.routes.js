const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { verifyToken, isBuyer } = require('../middleware/auth.middleware');
const { reviewValidationRules, validate } = require('../middleware/validation.middleware');

// Get reviews for a product
router.get('/product/:productId', reviewController.getProductReviews);

// Get reviews by a user
router.get('/user', verifyToken, reviewController.getUserReviews);

// Create a review
router.post('/', verifyToken, isBuyer, reviewValidationRules, validate, reviewController.create);

// Update a review
router.put('/:id', verifyToken, isBuyer, reviewController.update);

// Delete a review
router.delete('/:id', verifyToken, isBuyer, reviewController.delete);

module.exports = router;