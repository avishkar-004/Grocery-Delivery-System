const db = require('../models');
const { successResponse, errorResponse, notFoundResponse } = require('../utils/response.utils');

const Category = db.categories;
const Product = db.products;

// Get all categories
exports.findAll = async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['name', 'ASC']]
    });
    
    return successResponse(res, categories, 'Categories retrieved successfully');
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// Get category by ID with products
exports.findOne = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit, offset } = req.query;
    
    // Find category
    const category = await Category.findByPk(id);
    if (!category) {
      return notFoundResponse(res, 'Category not found');
    }
    
    // Set up pagination
    const paginationOptions = {};
    if (limit) paginationOptions.limit = parseInt(limit);
    if (offset) paginationOptions.offset = parseInt(offset);
    
    // Find products in this category
    const products = await Product.findAll({
      where: { 
        categoryId: id,
        inStock: true
      },
      ...paginationOptions,
      order: [['createdAt', 'DESC']]
    });
    
    // Get total count for pagination
    const totalProducts = await Product.count({
      where: { 
        categoryId: id,
        inStock: true
      }
    });
    
    return successResponse(res, {
      category,
      products,
      totalProducts,
      currentPage: offset ? Math.floor(parseInt(offset) / parseInt(limit)) + 1 : 1,
      totalPages: limit ? Math.ceil(totalProducts / parseInt(limit)) : 1
    }, 'Category with products retrieved successfully');
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// Admin functionality: Create a new category
exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    
    // Check if category with this name already exists
    const existingCategory = await Category.findOne({
      where: { name }
    });
    
    if (existingCategory) {
      return errorResponse(res, 'Category with this name already exists', 409);
    }
    
    // Create category
    const category = await Category.create({ name });
    
    return successResponse(res, category, 'Category created successfully', 201);
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// Admin functionality: Update category
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    // Find category
    const category = await Category.findByPk(id);
    if (!category) {
      return notFoundResponse(res, 'Category not found');
    }
    
    // Check if another category with this name already exists
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({
        where: { name }
      });
      
      if (existingCategory) {
        return errorResponse(res, 'Category with this name already exists', 409);
      }
    }
    
    // Update category
    await category.update({ name });
    
    return successResponse(res, category, 'Category updated successfully');
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// Admin functionality: Delete category
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find category
    const category = await Category.findByPk(id);
    if (!category) {
      return notFoundResponse(res, 'Category not found');
    }
    
    // Check if there are products in this category
    const productCount = await Product.count({
      where: { categoryId: id }
    });
    
    if (productCount > 0) {
      return errorResponse(res, `Cannot delete category that contains ${productCount} products`, 400);
    }
    
    // Delete category
    await category.destroy();
    
    return successResponse(res, null, 'Category deleted successfully');
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};