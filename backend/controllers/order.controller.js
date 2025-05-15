const db = require('../models');
const { successResponse, errorResponse, notFoundResponse, forbiddenResponse } = require('../utils/response.utils');
const { findNearbyOrders } = require('../utils/geo.utils');

const Order = db.orders;
const OrderItem = db.orderItems;
const Product = db.products;
const Address = db.addresses;
const ShopProfile = db.shopProfiles;
const User = db.users;

// Create a new order
exports.create = async (req, res) => {
  try {
    const buyerId = req.userId;
    const { addressId, paymentMethod, items, deliveryInstructions } = req.body;
    
    // Check if address exists and belongs to user
    const address = await Address.findOne({
      where: { id: addressId, userId: buyerId }
    });
    if (!address) {
      return notFoundResponse(res, 'Address not found or does not belong to user');
    }
    
    // Begin transaction
    const transaction = await db.sequelize.transaction();
    
    try {
      // Calculate total amount and validate items
      let totalAmount = 0;
      const orderItems = [];
      
      for (const item of items) {
        const { productId, quantity } = item;
        
        // Check if product exists and is in stock
        const product = await Product.findByPk(productId);
        if (!product) {
          await transaction.rollback();
          return notFoundResponse(res, `Product with ID ${productId} not found`);
        }
        
        if (!product.inStock || (product.stock > 0 && product.stock < quantity)) {
          await transaction.rollback();
          return errorResponse(res, `Product "${product.name}" is out of stock or has insufficient quantity`, 400);
        }
        
        // Add to total
        const itemTotal = product.price * quantity;
        totalAmount += itemTotal;
        
        // Add to order items
        orderItems.push({
          productId,
          productName: product.name,
          productPrice: product.price,
          quantity,
          itemTotal
        });
        
        // Update product stock if tracked
        if (product.stock > 0) {
          await product.update(
            { stock: product.stock - quantity },
            { transaction }
          );
          
          // Mark as out of stock if necessary
          if (product.stock - quantity <= 0) {
            await product.update(
              { inStock: false },
              { transaction }
            );
          }
        }
      }
      
      // Create order
      const order = await Order.create({
        buyerId,
        totalAmount,
        status: 'Placed',
        paymentMethod,
        addressId,
        deliveryInstructions
      }, { transaction });
      
      // Create order items
      for (const item of orderItems) {
        await OrderItem.create({
          ...item,
          orderId: order.id
        }, { transaction });
      }
      
      // Commit transaction
      await transaction.commit();
      
      // Fetch order with items for response
      const createdOrder = await Order.findByPk(order.id, {
        include: [
          {
            model: OrderItem,
            as: 'items'
          },
          {
            model: Address,
            as: 'address'
          }
        ]
      });
      
      return successResponse(res, createdOrder, 'Order placed successfully', 201);
      
    } catch (error) {
      // Rollback transaction in case of error
      await transaction.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// Get buyer's orders
exports.getBuyerOrders = async (req, res) => {
  try {
    const buyerId = req.userId;
    const { status, limit, offset } = req.query;
    
    // Build query conditions
    const condition = { buyerId };
    if (status) condition.status = status;
    
    // Set up pagination
    const paginationOptions = {};
    if (limit) paginationOptions.limit = parseInt(limit);
    if (offset) paginationOptions.offset = parseInt(offset);
    
    // Fetch orders with associations
    const orders = await Order.findAll({
      where: condition,
      include: [
        {
          model: OrderItem,
          as: 'items'
        },
        {
          model: Address,
          as: 'address'
        },
        {
          model: ShopProfile,
          as: 'shop',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['name', 'phone']
            }
          ]
        }
      ],
      ...paginationOptions,
      order: [['createdAt', 'DESC']]
    });
    
    // Get total count for pagination
    const totalOrders = await Order.count({ where: condition });
    
    return successResponse(res, {
      orders,
      totalOrders,
      currentPage: offset ? Math.floor(parseInt(offset) / parseInt(limit)) + 1 : 1,
      totalPages: limit ? Math.ceil(totalOrders / parseInt(limit)) : 1
    }, 'Orders retrieved successfully');
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// Get owner's orders
exports.getOwnerOrders = async (req, res) => {
  try {
    const userId = req.userId;
    const { status, limit, offset } = req.query;
    
    // Check if user has a shop profile
    const shopProfile = await ShopProfile.findOne({ where: { userId } });
    if (!shopProfile) {
      return errorResponse(res, 'Shop profile not found for this user', 400);
    }
    
    // Build query conditions
    const condition = { shopId: shopProfile.id };
    if (status) condition.status = status;
    
    // Set up pagination
    const paginationOptions = {};
    if (limit) paginationOptions.limit = parseInt(limit);
    if (offset) paginationOptions.offset = parseInt(offset);
    
    // Fetch orders with associations
    const orders = await Order.findAll({
      where: condition,
      include: [
        {
          model: OrderItem,
          as: 'items'
        },
        {
          model: Address,
          as: 'address'
        },
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'name', 'phone']
        }
      ],
      ...paginationOptions,
      order: [['createdAt', 'DESC']]
    });
    
    // Get total count for pagination
    const totalOrders = await Order.count({ where: condition });
    
    return successResponse(res, {
      orders,
      totalOrders,
      currentPage: offset ? Math.floor(parseInt(offset) / parseInt(limit)) + 1 : 1,
      totalPages: limit ? Math.ceil(totalOrders / parseInt(limit)) : 1
    }, 'Orders retrieved successfully');
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// Get nearby orders for shop owner
exports.getNearbyOrders = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Check if user has a shop profile
    const shopProfile = await ShopProfile.findOne({ where: { userId } });
    if (!shopProfile) {
      return errorResponse(res, 'Shop profile not found for this user', 400);
    }
    
    // Check if shop has location data
    if (!shopProfile.latitude || !shopProfile.longitude) {
      return errorResponse(res, 'Shop location not set. Please update your shop profile with location information.', 400);
    }
    
    // Get unassigned orders
    const unassignedOrders = await Order.findAll({
      where: { 
        shopId: null,
        status: 'Placed'
      },
      include: [
        {
          model: OrderItem,
          as: 'items'
        },
        {
          model: Address,
          as: 'address'
        },
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // Filter nearby orders based on shop location and delivery radius
    const shopLocation = {
      latitude: shopProfile.latitude,
      longitude: shopProfile.longitude
    };
    
    const nearbyOrders = findNearbyOrders(
      shopLocation,
      shopProfile.deliveryRadius,
      unassignedOrders
    );
    
    return successResponse(res, nearbyOrders, 'Nearby orders retrieved successfully');
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// Get order by ID
exports.findOne = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    // Find order with associations
    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'image']
            }
          ]
        },
        {
          model: Address,
          as: 'address'
        },
        {
          model: ShopProfile,
          as: 'shop',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['name', 'phone']
            }
          ]
        },
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'name', 'phone']
        }
      ]
    });
    
    if (!order) {
      return notFoundResponse(res, 'Order not found');
    }
    
    // Check if user is authorized to access this order
    const shopProfile = await ShopProfile.findOne({ where: { userId } });
    
    if (order.buyerId !== userId && (!shopProfile || order.shopId !== shopProfile.id)) {
      return forbiddenResponse(res, 'You do not have permission to access this order');
    }
    
    return successResponse(res, order, 'Order retrieved successfully');
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// Accept order (shop owner)
exports.acceptOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    // Check if user has a shop profile
    const shopProfile = await ShopProfile.findOne({ where: { userId } });
    if (!shopProfile) {
      return errorResponse(res, 'Shop profile not found for this user', 400);
    }
    
    // Find order
    const order = await Order.findByPk(id);
    if (!order) {
      return notFoundResponse(res, 'Order not found');
    }
    
    // Check if order is already accepted
    if (order.shopId) {
      return errorResponse(res, 'Order already accepted by another shop owner', 400);
    }
    
    // Check if order is in 'Placed' status
    if (order.status !== 'Placed') {
      return errorResponse(res, 'Order cannot be accepted in its current state', 400);
    }
    
    // Update order
    await order.update({
      shopId: shopProfile.id,
      status: 'Accepted',
      acceptedAt: new Date()
    });
    
    // Fetch updated order with associations
    const updatedOrder = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'items'
        },
        {
          model: Address,
          as: 'address'
        },
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'name', 'phone']
        }
      ]
    });
    
    return successResponse(res, updatedOrder, 'Order accepted successfully');
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// Update order status (shop owner)
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.userId;
    
    // Validate status
    const validStatuses = ['Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, 'Invalid status value', 400);
    }
    
    // Check if user has a shop profile
    const shopProfile = await ShopProfile.findOne({ where: { userId } });
    if (!shopProfile) {
      return errorResponse(res, 'Shop profile not found for this user', 400);
    }
    
    // Find order
    const order = await Order.findByPk(id);
    if (!order) {
      return notFoundResponse(res, 'Order not found');
    }
    
    // Check if order belongs to this shop
    if (order.shopId !== shopProfile.id) {
      return forbiddenResponse(res, 'You do not have permission to update this order');
    }
    
    // Check if status transition is valid
    const validTransitions = {
      'Accepted': ['Preparing', 'Cancelled'],
      'Preparing': ['Out for Delivery', 'Cancelled'],
      'Out for Delivery': ['Delivered', 'Cancelled'],
      'Delivered': [],
      'Cancelled': []
    };
    
    if (!validTransitions[order.status].includes(status)) {
      return errorResponse(res, `Cannot transition from ${order.status} to ${status}`, 400);
    }
    
    // Update order
    await order.update({ status });
    
    // Fetch updated order with associations
    const updatedOrder = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'items'
        },
        {
          model: Address,
          as: 'address'
        },
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'name', 'phone']
        }
      ]
    });
    
    return successResponse(res, updatedOrder, 'Order status updated successfully');
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// Cancel order (buyer)
exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const buyerId = req.userId;
    
    // Find order
    const order = await Order.findByPk(id);
    if (!order) {
      return notFoundResponse(res, 'Order not found');
    }
    
    // Check if order belongs to this buyer
    if (order.buyerId !== buyerId) {
      return forbiddenResponse(res, 'You do not have permission to cancel this order');
    }
    
    // Check if order can be cancelled
    const cancellableStatuses = ['Placed', 'Accepted', 'Preparing'];
    if (!cancellableStatuses.includes(order.status)) {
      return errorResponse(res, `Order in ${order.status} status cannot be cancelled`, 400);
    }
    
    // Begin transaction
    const transaction = await db.sequelize.transaction();
    
    try {
      // Update order status
      await order.update({
        status: 'Cancelled',
        cancelledAt: new Date()
      }, { transaction });
      
      // Restore product stock
      const orderItems = await OrderItem.findAll({
        where: { orderId: order.id }
      });
      
      for (const item of orderItems) {
        const product = await Product.findByPk(item.productId);
        if (product) {
          await product.update({
            stock: product.stock + item.quantity,
            inStock: true
          }, { transaction });
        }
      }
      
      // Commit transaction
      await transaction.commit();
      
      return successResponse(res, null, 'Order cancelled successfully');
      
    } catch (error) {
      // Rollback transaction in case of error
      await transaction.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// Get order statistics for shop owner
exports.getOwnerStats = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Check if user has a shop profile
    const shopProfile = await ShopProfile.findOne({ where: { userId } });
    if (!shopProfile) {
      return errorResponse(res, 'Shop profile not found for this user', 400);
    }
    
    // Get total orders count
    const totalOrders = await Order.count({
      where: { shopId: shopProfile.id }
    });
    
    // Get orders by status
    const ordersByStatus = await Order.findAll({
      attributes: [
        'status',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      where: { shopId: shopProfile.id },
      group: ['status']
    });
    
    // Get total revenue
    const revenueResult = await Order.findOne({
      attributes: [
        [db.sequelize.fn('SUM', db.sequelize.col('total_amount')), 'total']
      ],
      where: {
        shopId: shopProfile.id,
        status: {
          [db.Sequelize.Op.in]: ['Delivered']
        }
      }
    });
    const totalRevenue = revenueResult.getDataValue('total') || 0;
    
    // Get sales by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const salesByDate = await Order.findAll({
      attributes: [
        [db.sequelize.fn('DATE', db.sequelize.col('created_at')), 'date'],
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'orderCount'],
        [db.sequelize.fn('SUM', db.sequelize.col('total_amount')), 'totalAmount']
      ],
      where: {
        shopId: shopProfile.id,
        createdAt: {
          [db.Sequelize.Op.gte]: thirtyDaysAgo
        }
      },
      group: [db.sequelize.fn('DATE', db.sequelize.col('created_at'))],
      order: [[db.sequelize.fn('DATE', db.sequelize.col('created_at')), 'ASC']]
    });
    
    // Get top-selling products
    const topProducts = await OrderItem.findAll({
      attributes: [
        'productId',
        'productName',
        [db.sequelize.fn('SUM', db.sequelize.col('quantity')), 'totalQuantity'],
        [db.sequelize.fn('SUM', db.sequelize.col('item_total')), 'totalSales']
      ],
      include: [
        {
          model: Order,
          as: 'order',
          attributes: [],
          where: {
            shopId: shopProfile.id,
            status: 'Delivered'
          }
        }
      ],
      group: ['productId', 'productName'],
      order: [[db.sequelize.fn('SUM', db.sequelize.col('quantity')), 'DESC']],
      limit: 5
    });
    
    return successResponse(res, {
      totalOrders,
      ordersByStatus: ordersByStatus.map(item => ({
        status: item.status,
        count: item.get('count')
      })),
      totalRevenue,
      salesByDate: salesByDate.map(item => ({
        date: item.get('date'),
        orderCount: item.get('orderCount'),
        totalAmount: item.get('totalAmount')
      })),
      topProducts: topProducts.map(item => ({
        productId: item.productId,
        productName: item.productName,
        totalQuantity: item.get('totalQuantity'),
        totalSales: item.get('totalSales')
      }))
    }, 'Order statistics retrieved successfully');
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};