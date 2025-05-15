// Standard success response
const successResponse = (res, data, message = 'Operation successful', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

// Error response
const errorResponse = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  return res.status(statusCode).json(response);
};

// Not found response
const notFoundResponse = (res, message = 'Resource not found') => {
  return errorResponse(res, message, 404);
};

// Validation error response
const validationErrorResponse = (res, errors) => {
  return errorResponse(res, 'Validation error', 400, errors);
};

// Unauthorized response
const unauthorizedResponse = (res, message = 'Unauthorized access') => {
  return errorResponse(res, message, 401);
};

// Forbidden response
const forbiddenResponse = (res, message = 'Forbidden access') => {
  return errorResponse(res, message, 403);
};

// Conflict response (for duplicate resources)
const conflictResponse = (res, message = 'Resource already exists') => {
  return errorResponse(res, message, 409);
};

module.exports = {
  successResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  conflictResponse
};