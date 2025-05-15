const db = require('../models');
const { successResponse, errorResponse, notFoundResponse, forbiddenResponse } = require('../utils/response.utils');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const Product = db.products;
const Category = db.categories;
const ShopProfile = db.shopProfiles;
const ProductReview = db.productReviews;

// Create a new product
exports.create = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Check if user has a shop profile
    const shopProfile = await ShopProfile.findOne({ where: { userId } });
    if (!shopProfile) {
      return errorResponse(res, 'Shop profile not found for this user', 400);
    }
    
    const {
      name, description, price, originalPrice, categoryId,
      stock, inStock, weight, origin, shelfLife, storage
    } = req.body;
    
    // Check if category exists
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return notFoundResponse(res, 'Category not found');
    }
    
    // Handle file upload if image is provided
    let imagePath = null;
    if (req.file) {
      const uniqueFilename = `${uuidv4()}_${req.file.originalname}`;
      const uploadDir = path.join(process.env.UPLOAD_DIR || 'public/uploads', 'products');
      
      // Ensure upload directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const finalPath = path.join(uploadDir, uniqueFilename);
      fs.writeFileSync(finalPath, req.file.buffer);
      
      imagePath = `/uploads/products/${uniqueFilename}`;
    }
    
    // Create product
    const product = await Product.create({
      name,
      description,
      price,
      originalPrice,
      categoryId,
      shopId: shopProfile.id,
      image: imagePath,
      stock: stock || 0,
      inStock: inStock !== undefined ? inStock : true,
      weight,
      origin,
      shelfLife,
      storage
    });
    
    return successResponse(res, product, 'Product created successfully', 201);
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// Get all products
exports.findAll = async (req, res) => {
  try {
    const {
      categoryId, shopId, minPrice, maxPrice, search, inStock, limit, offset
    } = req.query;
    
    // Build query conditions
    const condition = {};
    
    if (categoryId) condition.categoryId = categoryId;
    if (shopId) condition.shopId = shopId;
    if (inStock !== undefined) condition.inStock = inStock === 'true';
    
    if (minPrice && maxPrice) {
      condition.price = {
        [db.Sequelize.Op.between]: [parseFloat(minPrice), parseFloat(maxPrice)]
      };
    } else if (minPrice) {
      condition.price = {
        [db.Sequelize.Op.gte]: parseFloat(minPrice)
      };
    } else if (maxPrice) {
      condition.price = {
        [db.Sequelize.Op.lte]: parseFloat(maxPrice)
      };
    }
    
    if (search) {
      condition[db.Sequelize.Op.or] = [
        {
          name: {
            [db.Sequelize.Op.like]: `%${search}%`
          }
        },
        {
          description: {
            [db.Sequelize.Op.like]: `%${search}%`
          }
        }
      ];
    }
    
    // Set up pagination
    const paginationOptions = {};
    if (limit) paginationOptions.limit = parseInt(limit);
    if (offset) paginationOptions.offset = parseInt(offset);
    
    // Fetch products with associations
    const products = await Product.findAll({
      where: condition,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: ShopProfile,
          as: 'shop',
          attributes: ['id', 'shopName', 'rating']
        }
      ],
      ...paginationOptions,
      order: [['createdAt', 'DESC']]
    });
    
    // Get total count for pagination
    const totalProducts = await Product.count({ where: condition });
    
    return successResponse(res, {
      products,
      totalProducts,
      currentPage: offset ? Math.floor(parseInt(offset) / parseInt(limit)) + 1 : 1,
      totalPages: limit ? Math.ceil(totalProducts / parseInt(limit)) : 1
    }, 'Products retrieved successfully');
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// Get product by ID
exports.findOne = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: ShopProfile,
          as: 'shop',
          attributes: ['id', 'shopName', 'rating', 'shopAddress', 'deliveryRadius']
        },
        {
          model: ProductReview,
          as: 'reviews',
          include: [
            {
              model: db.users,
              as: 'user',
              attributes: ['id', 'name']
            }
          ],
          limit: 5,
          order: [['createdAt', 'DESC']]
        }
      ]
    });
    
    if (!product) {
      return notFoundResponse(res, 'Product not found');
    }
    
    // Get review count for pagination
    const reviewCount = await ProductReview.count({
      where: { productId: id }
    });
    
    return successResponse(res, {
      ...product.toJSON(),
      reviewCount
    }, 'Product retrieved successfully');
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// Update product
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    // Find product
    const product = await Product.findByPk(id);
    if (!product) {
      return notFoundResponse(res, 'Product not found');
    }
    
    // Check if user owns the shop
    const shopProfile = await ShopProfile.findOne({ where: { userId } });
    if (!shopProfile || shopProfile.id !== product.shopId) {
      return forbiddenResponse(res, 'You do not have permission to update this product');
    }
    
    const {
      name, description, price, originalPrice, categoryId,
      stock, inStock, weight, origin, shelfLife, storage
    } = req.body;
    
    // Check if category exists if it's being updated
    if (categoryId && categoryId !== product.categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return notFoundResponse(res, 'Category not found');
      }
    }
    
    // Handle file upload if image is provided
    let imagePath = product.image;
    if (req.file) {
      // Remove old image if exists
      if (product.image) {
        const oldImagePath = path.join(__dirname, '..', 'public', product.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      const uniqueFilename = `${uuidv4()}_${req.file.originalname}`;
      const uploadDir = path.join(process.env.UPLOAD_DIR || 'public/uploads', 'products');
      
      // Ensure upload directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const finalPath = path.join(uploadDir, uniqueFilename);
      fs.writeFileSync(finalPath, req.file.buffer);
      
      imagePath = `/uploads/products/${uniqueFilename}`;
    }
    
    // Update product
    await product.update({
      name: name || product.name,
      description: description !== undefined ? description : product.description,
      price: price || product.price,
      originalPrice: originalPrice !== undefined ? originalPrice : product.originalPrice,
      categoryId: categoryId || product.categoryId,
      image: imagePath,
      stock: stock !== undefined ? stock : product.stock,
      inStock: inStock !== undefined ? inStock : product.inStock,
      weight: weight !== undefined ? weight : product.weight,
      origin: origin !== undefined ? origin : product.origin,
      shelfLife: shelfLife !== undefined ? shelfLife : product.shelfLife,
      storage: storage !== undefined ? storage : product.storage
    });
    
    return successResponse(res, product, 'Product updated successfully');
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// Delete product
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    // Find product
    const product = await Product.findByPk(id);
    if (!product) {
      return notFoundResponse(res, 'Product not found');
    }
    
    // Check if user owns the shop
    const shopProfile = await ShopProfile.findOne({ where: { userId } });
    if (!shopProfile || shopProfile.id !== product.shopId) {
      return forbiddenResponse(res, 'You do not have permission to delete this product');
    }
    
    // Remove product image if exists
    if (product.image) {
      const imagePath = path.join(__dirname, '..', 'public', product.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Delete product
    await product.destroy();
    
    return successResponse(res, null, 'Product deleted successfully');
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// Get shop products
exports.getShopProducts = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Check if user has a shop profile
    const shopProfile = await ShopProfile.findOne({ where: { userId } });
    if (!shopProfile) {
      return errorResponse(res, 'Shop profile not found for this user', 400);
    }
    
    // Get shop products
    const products = await Product.findAll({
      where: { shopId: shopProfile.id },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    return successResponse(res, products, 'Shop products retrieved successfully');
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};