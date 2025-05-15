const express = require('express');
const router = express.Router();
const addressController = require('../controllers/address.controller');
const { verifyToken, isBuyer } = require('../middleware/auth.middleware');
const { addressValidationRules, validate } = require('../middleware/validation.middleware');

// Get all addresses for user
router.get('/', verifyToken, addressController.findAll);

// Create a new address
router.post('/', verifyToken, addressValidationRules, validate, addressController.create);

// Get address by ID
router.get('/:id', verifyToken, addressController.findOne);

// Update address
router.put('/:id', verifyToken, addressValidationRules, validate, addressController.update);

// Delete address
router.delete('/:id', verifyToken, addressController.delete);

// Set address as default
router.put('/:id/default', verifyToken, addressController.setDefault);

module.exports = router;