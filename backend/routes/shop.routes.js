// Fix issues in shop.routes.js - likely culprit

const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shop.controller');
const { verifyToken, isOwner } = require('../middleware/auth.middleware');
const { shopProfileValidationRules, validate } = require('../middleware/validation.middleware');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024 // 5MB default
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Public routes
// FIX: Make sure these are relative paths not full URLs
router.get('/nearby', shopController.getNearbyShops);
router.get('/all', shopController.getAllShops);
// FIX: Changed from '/public/:id' to '/:id/public' to avoid colon confusion
router.get('/:id/public', shopController.getShopById);

// Shop owner routes
router.get('/profile', verifyToken, isOwner, shopController.getProfile);
router.put('/profile', 
  verifyToken, 
  isOwner, 
  upload.single('shopImage'), 
  shopProfileValidationRules, 
  validate, 
  shopController.updateProfile
);

module.exports = router;