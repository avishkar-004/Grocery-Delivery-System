const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Public routes
router.get('/', categoryController.findAll);
router.get('/:id', categoryController.findOne);

// Admin routes (not exposed in frontend for this application)
// router.post('/', verifyToken, isAdmin, categoryController.create);
// router.put('/:id', verifyToken, isAdmin, categoryController.update);
// router.delete('/:id', verifyToken, isAdmin, categoryController.delete);

module.exports = router;