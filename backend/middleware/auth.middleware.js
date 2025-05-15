const jwt = require('jsonwebtoken');
const config = require('../config/auth.config');
const db = require('../models');
const User = db.users;

// Verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers['x-access-token'] || req.headers['authorization'];
  
  if (!token) {
    return res.status(403).json({
      message: 'No token provided.'
    });
  }

  // Remove 'Bearer ' prefix if present
  const tokenValue = token.startsWith('Bearer ') ? token.slice(7) : token;

  jwt.verify(tokenValue, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        message: 'Unauthorized! Token is invalid or expired.'
      });
    }
    
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  });
};

// Check if user is a buyer
const isBuyer = (req, res, next) => {
  User.findByPk(req.userId)
    .then(user => {
      if (user && user.role === 'buyer') {
        next();
        return;
      }
      
      res.status(403).json({
        message: 'Requires Buyer Role!'
      });
    })
    .catch(err => {
      res.status(500).json({
        message: err.message || 'Error checking user role.'
      });
    });
};

// Check if user is a shop owner
const isOwner = (req, res, next) => {
  User.findByPk(req.userId)
    .then(user => {
      if (user && user.role === 'owner') {
        next();
        return;
      }
      
      res.status(403).json({
        message: 'Requires Shop Owner Role!'
      });
    })
    .catch(err => {
      res.status(500).json({
        message: err.message || 'Error checking user role.'
      });
    });
};

// Check if user is either a buyer or shop owner
const isBuyerOrOwner = (req, res, next) => {
  User.findByPk(req.userId)
    .then(user => {
      if (user && (user.role === 'buyer' || user.role === 'owner')) {
        req.user = user; // Attach user object to request
        next();
        return;
      }
      
      res.status(403).json({
        message: 'Requires Buyer or Shop Owner Role!'
      });
    })
    .catch(err => {
      res.status(500).json({
        message: err.message || 'Error checking user role.'
      });
    });
};

// Check if the user owns the resource (for authorization)
const isResourceOwner = (modelName, paramIdName = 'id', userIdField = 'userId') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramIdName];
      if (!resourceId) {
        return res.status(400).json({ message: 'Resource ID is required' });
      }
      
      const resource = await db[modelName].findByPk(resourceId);
      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }
      
      if (resource[userIdField] !== req.userId) {
        return res.status(403).json({ message: 'You do not have permission to access this resource' });
      }
      
      req.resource = resource; // Attach resource to request for later use
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  verifyToken,
  isBuyer,
  isOwner,
  isBuyerOrOwner,
  isResourceOwner
};