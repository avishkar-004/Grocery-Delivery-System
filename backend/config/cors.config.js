module.exports = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token'],
  exposedHeaders: ['Content-Length', 'x-refresh-token'],
  credentials: true,
  maxAge: 86400 // 24 hours
};