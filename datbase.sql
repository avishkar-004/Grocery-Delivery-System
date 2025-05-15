-- Create database
CREATE DATABASE IF NOT EXISTS quick_grocery;
USE quick_grocery;

-- Users table (for both buyers and owners)
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role ENUM('buyer', 'owner') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Shop profiles (for owner users)
CREATE TABLE shop_profiles (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  shop_name VARCHAR(100) NOT NULL,
  shop_description TEXT,
  shop_address VARCHAR(255) NOT NULL,
  shop_city VARCHAR(100) NOT NULL,
  shop_state VARCHAR(100) NOT NULL,
  shop_zip_code VARCHAR(20) NOT NULL,
  delivery_radius INT DEFAULT 10,
  minimum_order DECIMAL(10, 2) DEFAULT 0,
  opening_time TIME DEFAULT '08:00:00',
  closing_time TIME DEFAULT '20:00:00',
  rating DECIMAL(3, 1) DEFAULT 0,
  review_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Categories table
CREATE TABLE categories (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  category_id VARCHAR(36) NOT NULL,
  shop_id VARCHAR(36) NOT NULL,
  image VARCHAR(255),
  stock INT DEFAULT 0,
  in_stock BOOLEAN DEFAULT TRUE,
  weight VARCHAR(50),
  origin VARCHAR(100),
  shelf_life VARCHAR(100),
  storage VARCHAR(100),
  rating DECIMAL(3, 1) DEFAULT 0,
  review_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (shop_id) REFERENCES shop_profiles(id) ON DELETE CASCADE
);

-- Product reviews
CREATE TABLE product_reviews (
  id VARCHAR(36) PRIMARY KEY,
  product_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  rating INT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Addresses table (for buyers)
CREATE TABLE addresses (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  label VARCHAR(50) NOT NULL,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  zip_code VARCHAR(20) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Orders table
CREATE TABLE orders (
  id VARCHAR(36) PRIMARY KEY,
  buyer_id VARCHAR(36) NOT NULL,
  shop_id VARCHAR(36),
  total_amount DECIMAL(10, 2) NOT NULL,
  status ENUM('Placed', 'Accepted', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled') DEFAULT 'Placed',
  payment_method ENUM('Card', 'Cash', 'Wallet') NOT NULL,
  address_id VARCHAR(36) NOT NULL,
  delivery_instructions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP NULL,
  prepared_at TIMESTAMP NULL,
  out_for_delivery_at TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL,
  cancelled_at TIMESTAMP NULL,
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (shop_id) REFERENCES shop_profiles(id) ON DELETE SET NULL,
  FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE RESTRICT
);

-- Order items
CREATE TABLE order_items (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36) NOT NULL,
  product_name VARCHAR(100) NOT NULL,
  product_price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL,
  item_total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- Populate categories
INSERT INTO categories (id, name) VALUES
(UUID(), 'Fruits'),
(UUID(), 'Vegetables'),
(UUID(), 'Dairy'),
(UUID(), 'Bakery'),
(UUID(), 'Meat'),
(UUID(), 'Seafood'),
(UUID(), 'Beverages'),
(UUID(), 'Snacks'),
(UUID(), 'Canned Goods'),
(UUID(), 'Frozen Foods');