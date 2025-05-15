const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { userValidationRules, validate } = require('../middleware/validation.middleware');

// Register a new user
router.post('/register', userValidationRules, validate, authController.register);

// Login for existing user
router.post('/login', authController.login);

// Get current user profile
router.get('/me', verifyToken, authController.me);

// Change password
router.post('/change-password', verifyToken, authController.changePassword);

module.exports = router;