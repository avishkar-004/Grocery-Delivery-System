const dbConfig = require('../config/db.config');
const Sequelize = require('sequelize');
const { v4: uuidv4 } = require('uuid');

// Create Sequelize instance
const sequelize = new Sequelize(
  dbConfig.DB,
  dbConfig.USER,
  dbConfig.PASSWORD,
  {
    host: dbConfig.HOST,
    dialect: dbConfig.dialect,
    operatorsAliases: 0,
    pool: {
      max: dbConfig.pool.max,
      min: dbConfig.pool.min,
      acquire: dbConfig.pool.acquire,
      idle: dbConfig.pool.idle
    },
    logging: dbConfig.logging
  }
);

// Initialize db object
const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.uuidv4 = uuidv4;

// Import models
db.users = require('./user.model')(sequelize, Sequelize, uuidv4);
db.shopProfiles = require('./shop.model')(sequelize, Sequelize, uuidv4);
db.categories = require('./category.model')(sequelize, Sequelize, uuidv4);
db.products = require('./product.model')(sequelize, Sequelize, uuidv4);
db.productReviews = require('./review.model')(sequelize, Sequelize, uuidv4);
db.addresses = require('./address.model')(sequelize, Sequelize, uuidv4);
db.orders = require('./order.model')(sequelize, Sequelize, uuidv4);
db.orderItems = require('./orderItem.model')(sequelize, Sequelize, uuidv4);

// Define associations

// User associations
db.users.hasOne(db.shopProfiles, {
  foreignKey: 'userId',
  as: 'shopProfile'
});
db.shopProfiles.belongsTo(db.users, {
  foreignKey: 'userId',
  as: 'user'
});

db.users.hasMany(db.addresses, {
  foreignKey: 'userId',
  as: 'addresses'
});
db.addresses.belongsTo(db.users, {
  foreignKey: 'userId',
  as: 'user'
});

db.users.hasMany(db.productReviews, {
  foreignKey: 'userId',
  as: 'reviews'
});
db.productReviews.belongsTo(db.users, {
  foreignKey: 'userId',
  as: 'user'
});

db.users.hasMany(db.orders, {
  foreignKey: 'buyerId',
  as: 'orders'
});
db.orders.belongsTo(db.users, {
  foreignKey: 'buyerId',
  as: 'buyer'
});

// Shop associations
db.shopProfiles.hasMany(db.products, {
  foreignKey: 'shopId',
  as: 'products'
});
db.products.belongsTo(db.shopProfiles, {
  foreignKey: 'shopId',
  as: 'shop'
});

db.shopProfiles.hasMany(db.orders, {
  foreignKey: 'shopId',
  as: 'orders'
});
db.orders.belongsTo(db.shopProfiles, {
  foreignKey: 'shopId',
  as: 'shop'
});

// Category associations
db.categories.hasMany(db.products, {
  foreignKey: 'categoryId',
  as: 'products'
});
db.products.belongsTo(db.categories, {
  foreignKey: 'categoryId',
  as: 'category'
});

// Product associations
db.products.hasMany(db.productReviews, {
  foreignKey: 'productId',
  as: 'reviews'
});
db.productReviews.belongsTo(db.products, {
  foreignKey: 'productId',
  as: 'product'
});

db.products.hasMany(db.orderItems, {
  foreignKey: 'productId',
  as: 'orderItems'
});
db.orderItems.belongsTo(db.products, {
  foreignKey: 'productId',
  as: 'product'
});

// Address associations
db.addresses.hasMany(db.orders, {
  foreignKey: 'addressId',
  as: 'orders'
});
db.orders.belongsTo(db.addresses, {
  foreignKey: 'addressId',
  as: 'address'
});

// Order associations
db.orders.hasMany(db.orderItems, {
  foreignKey: 'orderId',
  as: 'items'
});
db.orderItems.belongsTo(db.orders, {
  foreignKey: 'orderId',
  as: 'order'
});

module.exports = db;