// Error handling middleware
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', err);

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      message: 'Validation error',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      message: 'Unique constraint error',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Sequelize foreign key constraint error
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      message: 'Foreign key constraint error. The referenced entity does not exist.',
      field: err.fields
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token expired'
    });
  }

  // Handle validation middleware errors
  if (err.statusCode === 400 && err.validation) {
    return res.status(400).json({
      message: 'Validation error',
      errors: err.validation
    });
  }

  // Handle not found errors
  if (err.statusCode === 404) {
    return res.status(404).json({
      message: err.message || 'Resource not found'
    });
  }

  // Handle forbidden errors
  if (err.statusCode === 403) {
    return res.status(403).json({
      message: err.message || 'Forbidden'
    });
  }

  // Default error response for unhandled errors
  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal server error'
  });
};

// 404 handler - for routes that don't exist
const notFoundHandler = (req, res) => {
  res.status(404).json({
    message: 'Resource not found'
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};