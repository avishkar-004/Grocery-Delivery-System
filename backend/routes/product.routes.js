const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { verifyToken, isOwner } = require('../middleware/auth.middleware');
const { productValidationRules, validate } = require('../middleware/validation.middleware');
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
router.get('/', productController.findAll);
router.get('/:id', productController.findOne);

// Shop owner routes
router.post('/', 
  verifyToken, 
  isOwner, 
  upload.single('image'), 
  productValidationRules, 
  validate, 
  productController.create
);
router.put('/:id', 
  verifyToken, 
  isOwner, 
  upload.single('image'), 
  productController.update
);
router.delete('/:id', verifyToken, isOwner, productController.delete);
router.get('/shop/owner', verifyToken, isOwner, productController.getShopProducts);

module.exports = router;