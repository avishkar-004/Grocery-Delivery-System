const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Update user profile
router.put('/profile', verifyToken, userController.updateProfile);

// Get user by ID
router.get('/:id', verifyToken, userController.findOne);

// Delete user account
router.delete('/', verifyToken, userController.delete);

module.exports = router;