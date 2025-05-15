const db = require('../models');
const { successResponse, errorResponse, notFoundResponse } = require('../utils/response.utils');
const { getCoordinatesFromAddress } = require('../utils/geo.utils');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const ShopProfile = db.shopProfiles;
const User = db.users;

// Get shop profile for owner
exports.getProfile = async (req, res) => {
  try {
    const userId = req.userId;
    
    const shopProfile = await ShopProfile.findOne({
      where: { userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email', 'phone']
        }
      ]
    });
    
    if (!shopProfile) {
      return notFoundResponse(res, 'Shop profile not found for this user');
    }
    
    return successResponse(res, shopProfile, 'Shop profile retrieved successfully');
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// Get shop profile by ID (for buyers)
exports.getShopById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const shopProfile = await ShopProfile.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email', 'phone']
        }
      ]
    });
    
    if (!shopProfile) {
      return notFoundResponse(res, 'Shop profile not found');
    }
    
    return successResponse(res, shopProfile, 'Shop profile retrieved successfully');
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// Update shop profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      shopName, shopDescription, shopAddress, shopCity, shopState, shopZipCode,
      deliveryRadius, minimumOrder, openingTime, closingTime
    } = req.body;
    
    // Find shop profile
    const shopProfile = await ShopProfile.findOne({
      where: { userId }
    });
    
    if (!shopProfile) {
      return notFoundResponse(res, 'Shop profile not found for this user');
    }
    
    // Try to get coordinates if address fields changed
    let coords = { latitude: shopProfile.latitude, longitude: shopProfile.longitude };
    
    const addressChanged = 
      (shopAddress && shopAddress !== shopProfile.shopAddress) ||
      (shopCity && shopCity !== shopProfile.shopCity) ||
      (shopState && shopState !== shopProfile.shopState) ||
      (shopZipCode && shopZipCode !== shopProfile.shopZipCode);
      
    if (addressChanged) {
      try {
        const fullAddress = `${shopAddress || shopProfile.shopAddress}, ${shopCity || shopProfile.shopCity}, ${shopState || shopProfile.shopState}, ${shopZipCode || shopProfile.shopZipCode}`;
        coords = await getCoordinatesFromAddress(fullAddress);
      } catch (geoError) {
        console.error('Error getting coordinates:', geoError);
        // Continue with existing coordinates if geocoding fails
      }
    }
    
    // Handle file upload if shop image is provided
    let shopImage = shopProfile.shopImage;
    if (req.file) {
      // Remove old image if exists
      if (shopProfile.shopImage) {
        const oldImagePath = path.join(__dirname, '..', 'public', shopProfile.shopImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      const uniqueFilename = `${uuidv4()}_${req.file.originalname}`;
      const uploadDir = path.join(process.env.UPLOAD_DIR || 'public/uploads', 'shops');
      
      // Ensure upload directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const finalPath = path.join(uploadDir, uniqueFilename);
      fs.writeFileSync(finalPath, req.file.buffer);
      
      shopImage = `/uploads/shops/${uniqueFilename}`;
    }
    
    // Update shop profile
    await shopProfile.update({
      shopName: shopName || shopProfile.shopName,
      shopDescription: shopDescription !== undefined ? shopDescription : shopProfile.shopDescription,
      shopAddress: shopAddress || shopProfile.shopAddress,
      shopCity: shopCity || shopProfile.shopCity,
      shopState: shopState || shopProfile.shopState,
      shopZipCode: shopZipCode || shopProfile.shopZipCode,
      deliveryRadius: deliveryRadius || shopProfile.deliveryRadius,
      minimumOrder: minimumOrder !== undefined ? minimumOrder : shopProfile.minimumOrder,
      openingTime: openingTime || shopProfile.openingTime,
      closingTime: closingTime || shopProfile.closingTime,
      latitude: coords.latitude,
      longitude: coords.longitude,
      shopImage
    });
    
    return successResponse(res, shopProfile, 'Shop profile updated successfully');
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// Get nearby shops for a buyer
exports.getNearbyShops = async (req, res) => {
  try {
    const { latitude, longitude, radius } = req.query;
    
    if (!latitude || !longitude) {
      return errorResponse(res, 'Latitude and longitude are required', 400);
    }
    
    // Find all shops with geolocation data
    const shops = await ShopProfile.findAll({
      where: {
        latitude: { [db.Sequelize.Op.ne]: null },
        longitude: { [db.Sequelize.Op.ne]: null }
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name']
        }
      ]
    });
    
    // Calculate distance for each shop
    const maxRadius = radius ? parseFloat(radius) : 10; // Default 10 km
    const nearbyShops = shops
      .map(shop => {
        const R = 6371; // Earth radius in km
        const dLat = (shop.latitude - latitude) * Math.PI / 180;
        const dLon = (shop.longitude - longitude) * Math.PI / 180;
        const a = 
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(latitude * Math.PI / 180) * Math.cos(shop.latitude * Math.PI / 180) * 
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        
        return {
          ...shop.toJSON(),
          distance: parseFloat(distance.toFixed(2))
        };
      })
      .filter(shop => shop.distance <= maxRadius)
      .sort((a, b) => a.distance - b.distance);
    
    return successResponse(res, nearbyShops, 'Nearby shops retrieved successfully');
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// Get all shops
exports.getAllShops = async (req, res) => {
  try {
    const { limit, offset, search } = req.query;
    
    // Build query conditions
    const condition = {};
    
    if (search) {
      condition[db.Sequelize.Op.or] = [
        {
          shopName: {
            [db.Sequelize.Op.like]: `%${search}%`
          }
        },
        {
          shopDescription: {
            [db.Sequelize.Op.like]: `%${search}%`
          }
        }
      ];
    }
    
    // Set up pagination
    const paginationOptions = {};
    if (limit) paginationOptions.limit = parseInt(limit);
    if (offset) paginationOptions.offset = parseInt(offset);
    
    // Fetch shops with user info
    const shops = await ShopProfile.findAll({
      where: condition,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name']
        }
      ],
      ...paginationOptions,
      order: [['rating', 'DESC']]
    });
    
    // Get total count for pagination
    const totalShops = await ShopProfile.count({ where: condition });
    
    return successResponse(res, {
      shops,
      totalShops,
      currentPage: offset ? Math.floor(parseInt(offset) / parseInt(limit)) + 1 : 1,
      totalPages: limit ? Math.ceil(totalShops / parseInt(limit)) : 1
    }, 'Shops retrieved successfully');
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};