const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { verifyToken, isBuyer, isOwner } = require('../middleware/auth.middleware');
const { orderValidationRules, validate } = require('../middleware/validation.middleware');

// Buyer routes
router.post('/', verifyToken, isBuyer, orderValidationRules, validate, orderController.create);
router.get('/buyer', verifyToken, isBuyer, orderController.getBuyerOrders);
router.post('/:id/cancel', verifyToken, isBuyer, orderController.cancelOrder);

// Shop owner routes
router.get('/owner', verifyToken, isOwner, orderController.getOwnerOrders);
router.get('/nearby', verifyToken, isOwner, orderController.getNearbyOrders);
router.post('/:id/accept', verifyToken, isOwner, orderController.acceptOrder);
router.put('/:id/status', verifyToken, isOwner, orderController.updateStatus);
router.get('/stats', verifyToken, isOwner, orderController.getOwnerStats);

// Common route
router.get('/:id', verifyToken, orderController.findOne);

module.exports = router;