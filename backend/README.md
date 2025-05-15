# Create backend directory
mkdir grocery-delivery-backend
cd grocery-delivery-backend

# Initialize Node.js project
npm init -y

# Install necessary packages
npm install express cors mysql2 bcrypt jsonwebtoken dotenv multer nodemon axios


# Grocery Delivery System - Backend

This is the backend API for a grocery delivery system that allows buyers to purchase groceries from local shop owners.

## Features

- User authentication (register, login, profile management)
- Role-based access control (buyer and shop owner)
- Product management for shop owners
- Shopping cart and order placement for buyers
- Order tracking and status updates
- Location-based nearby shops/orders
- Reviews and ratings
- Analytics for shop owners

## Technology Stack

- Node.js with Express
- MySQL database with Sequelize ORM
- JWT authentication
- Multer for file uploads
- Geocoding for location-based features

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- NPM or Yarn

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/grocery-delivery-backend.git
   cd grocery-delivery-backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following environment variables:
   ```
   # Server Configuration
   NODE_ENV=development
   PORT=3000

   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=quick_grocery
   DB_FORCE_SYNC=false
   DB_ALTER_SYNC=true
   SEED_INITIAL_DATA=true

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=24h
   JWT_REFRESH_EXPIRES_IN=7d

   # CORS Configuration
   CORS_ORIGIN=http://localhost:5173

   # File Upload Configuration
   UPLOAD_DIR=public/uploads
   MAX_FILE_SIZE=5242880  # 5MB

   # Geocoding API Key (for address to coordinates conversion)
   GEOCODING_API_KEY=your_google_maps_api_key_here

   # Email Configuration (for order notifications)
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_USER=your_email@example.com
   SMTP_PASSWORD=your_email_password
   EMAIL_FROM=no-reply@grocery-delivery.com

   # Rate Limiting
   RATE_LIMIT_WINDOW=15  # 15 minutes
   RATE_LIMIT_MAX=100    # 100 requests per window
   ```

4. Create the MySQL database:
   ```
   mysql -u root -p
   CREATE DATABASE quick_grocery;
   EXIT;
   ```

5. Start the server:
   ```
   npm run dev
   ```

6. Seed initial data (if SEED_INITIAL_DATA=true in .env, this happens automatically):
   ```
   npm run seed
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/change-password` - Change password

### Users

- `PUT /api/users/profile` - Update user profile
- `GET /api/users/:id` - Get user by ID
- `DELETE /api/users` - Delete user account

### Shop Profiles

- `GET /api/shops/profile` - Get shop profile (for owners)
- `PUT /api/shops/profile` - Update shop profile
- `GET /api/shops/nearby` - Get nearby shops
- `GET /api/shops/all` - Get all shops
- `GET /api/shops/public/:id` - Get shop by ID (public)

### Products

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create a new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/shop/owner` - Get shop owner's products

### Categories

- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID with products

### Addresses

- `GET /api/addresses` - Get all addresses for user
- `POST /api/addresses` - Create a new address
- `GET /api/addresses/:id` - Get address by ID
- `PUT /api/addresses/:id` - Update address
- `DELETE /api/addresses/:id` - Delete address
- `PUT /api/addresses/:id/default` - Set address as default

### Orders

- `POST /api/orders` - Create a new order
- `GET /api/orders/buyer` - Get buyer's orders
- `GET /api/orders/owner` - Get owner's orders
- `GET /api/orders/nearby` - Get nearby orders for shop owner
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders/:id/accept` - Accept order (shop owner)
- `PUT /api/orders/:id/status` - Update order status (shop owner)
- `POST /api/orders/:id/cancel` - Cancel order (buyer)
- `GET /api/orders/stats` - Get order statistics for shop owner

### Reviews

- `GET /api/reviews/product/:productId` - Get reviews for a product
- `GET /api/reviews/user` - Get reviews by a user
- `POST /api/reviews` - Create a review
- `PUT /api/reviews/:id` - Update a review
- `DELETE /api/reviews/:id` - Delete a review

## Database Schema

The database consists of the following tables:

- `users` - User accounts for buyers and shop owners
- `shop_profiles` - Shop profiles for owner users
- `categories` - Product categories
- `products` - Products offered by shops
- `product_reviews` - Reviews for products
- `addresses` - Delivery addresses for buyers
- `orders` - Orders placed by buyers
- `order_items` - Items in an order

## Demo Accounts

After running the seeder, you can use these demo accounts:

- **Shop Owner:**
  - Email: shopowner@example.com
  - Password: password123

- **Buyer:**
  - Email: buyer@example.com
  - Password: password123

## Frontend Integration

This backend is designed to work with the frontend application built with React and Vite. Make sure the frontend is configured to connect to this backend API.

## Error Handling

The API uses consistent error handling with appropriate HTTP status codes and error messages. Error responses follow this format:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field-specific error message"
    }
  ]
}
```

## License

This project is licensed under the MIT License.