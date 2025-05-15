const jwt = require('jsonwebtoken');
const db = require('../models');
const { hashPassword, comparePassword } = require('../utils/password.utils');
const { successResponse, errorResponse, unauthorizedResponse } = require('../utils/response.utils');
const config = require('../config/auth.config');

const User = db.users;
const ShopProfile = db.shopProfiles;

// Register a new user
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return errorResponse(res, 'User already exists with this email', 409);
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create new user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role
    });
    
    // If user is shop owner, create empty shop profile
    if (role === 'owner') {
      await ShopProfile.create({
        userId: user.id,
        shopName: `${name}'s Shop`, // Default shop name
        shopDescription: '',
        shopAddress: '',
        shopCity: '',
        shopState: '',
        shopZipCode: ''
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      config.secret,
      { expiresIn: config.expiresIn }
    );
    
    // Return user info with token
    return successResponse(res, {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessToken: token
    }, 'User registered successfully', 201);
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// Log in existing user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.scope('withPassword').findOne({ where: { email } });
    if (!user) {
      return unauthorizedResponse(res, 'Invalid email or password');
    }
    
    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return unauthorizedResponse(res, 'Invalid email or password');
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      config.secret,
      { expiresIn: config.expiresIn }
    );
    
    // Return user info with token
    return successResponse(res, {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessToken: token
    }, 'Login successful');
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// Get current user profile
exports.me = async (req, res) => {
  try {
    const userId = req.userId;
    
    const user = await User.findByPk(userId);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }
    
    let userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    };
    
    // If user is shop owner, get shop profile
    if (user.role === 'owner') {
      const shopProfile = await ShopProfile.findOne({
        where: { userId: user.id }
      });
      
      if (shopProfile) {
        userProfile.shopProfile = shopProfile;
      }
    }
    
    return successResponse(res, userProfile, 'User profile retrieved successfully');
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return errorResponse(res, 'Current password and new password are required', 400);
    }
    
    // Find user with password
    const user = await User.scope('withPassword').findByPk(userId);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }
    
    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      return errorResponse(res, 'Current password is incorrect', 400);
    }
    
    // Hash and update new password
    const hashedPassword = await hashPassword(newPassword);
    await user.update({ password: hashedPassword });
    
    return successResponse(res, null, 'Password changed successfully');
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};