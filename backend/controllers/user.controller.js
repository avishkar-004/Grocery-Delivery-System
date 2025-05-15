const db = require('../models');
const { hashPassword } = require('../utils/password.utils');
const { successResponse, errorResponse, notFoundResponse } = require('../utils/response.utils');

const User = db.users;

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, phone } = req.body;
    
    // Find user
    const user = await User.findByPk(userId);
    if (!user) {
      return notFoundResponse(res, 'User not found');
    }
    
    // Update user data
    await user.update({
      name: name || user.name,
      phone: phone || user.phone
    });
    
    return successResponse(res, {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    }, 'Profile updated successfully');
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// Admin function: Get all users (not exposed in routes for this application)
exports.findAll = async (req, res) => {
  try {
    const users = await User.findAll();
    return successResponse(res, users, 'Users retrieved successfully');
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// Get user by ID
exports.findOne = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return notFoundResponse(res, 'User not found');
    }
    
    return successResponse(res, {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    }, 'User retrieved successfully');
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// Delete user account
exports.delete = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Find user
    const user = await User.findByPk(userId);
    if (!user) {
      return notFoundResponse(res, 'User not found');
    }
    
    // Delete user
    await user.destroy();
    
    return successResponse(res, null, 'Account deleted successfully');
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};