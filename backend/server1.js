// Check all route files for issues

// 1. Look in server.js
// The issue may be in how routes are mounted
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import route files
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const shopRoutes = require('./routes/shop.routes');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const orderRoutes = require('./routes/order.routes');
const addressRoutes = require('./routes/address.routes');
const reviewRoutes = require('./routes/review.routes');

// Import error middleware
const { errorHandler } = require('./middleware/error.middleware');

// Initialize database connection
const db = require('./models');

// Create Express application
const app = express();

// Set up basic security with helmet
app.use(helmet());

// Configure CORS
app.use(cors(require('./config/cors.config')));

// Parse JSON bodies
app.use(express.json());
// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Set up logging in development mode
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Set up rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// API Routes - FIX: Make sure these are all relative paths, not URLs
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/reviews', reviewRoutes);

// Serve static files from the 'public' directory
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// Error handling middleware
app.use(errorHandler);

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Database synchronization
const syncOptions = {
  // Set to true in development to drop and re-create tables
  force: process.env.DB_FORCE_SYNC === 'true' ? true : false,
  // Set to true to automatically apply migrations
  alter: process.env.DB_ALTER_SYNC === 'true' ? true : false
};

db.sequelize.sync(syncOptions)
  .then(() => {
    console.log('Database synchronized successfully');
    
    // Seed initial data if needed
    if (process.env.SEED_INITIAL_DATA === 'true') {
      require('./seeders')();
    }
  })
  .catch(err => {
    console.error('Failed to synchronize database:', err);
  });

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Implement proper logging here
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Implement proper logging here
});

module.exports = app;