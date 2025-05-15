module.exports = {
  secret: process.env.JWT_SECRET || 'grocery-delivery-secret-key',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h', // Token expiration time
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d', // Refresh token expiration
  issuer: 'grocery-delivery-app',
  audience: 'grocery-app-users'
};