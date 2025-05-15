const db = require('../models');
const { successResponse, errorResponse, notFoundResponse, forbiddenResponse } = require('../utils/response.utils');
const { getCoordinatesFromAddress } = require('../utils/geo.utils');

const Address = db.addresses;

// Create a new address
exports.create = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      label, addressLine1, addressLine2, city, state, zipCode,
      isDefault, latitude, longitude
    } = req.body;
    
    // Try to get coordinates if not provided
    let coords = { latitude, longitude };
    if (!latitude || !longitude) {
      try {
        const fullAddress = `${addressLine1}, ${city}, ${state}, ${zipCode}`;
        coords = await getCoordinatesFromAddress(fullAddress);
      } catch (geoError) {
        console.error('Error getting coordinates:', geoError);
        // Continue without coordinates if geocoding fails
      }
    }
    
    // Create address
    const address = await Address.create({
      userId,
      label,
      addressLine1,
      addressLine2,
      city,
      state,
      zipCode,
      isDefault: isDefault === true,
      latitude: coords.latitude,
      longitude: coords.longitude
    });
    
    return successResponse(res, address, 'Address created successfully', 201);
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// Get all addresses for a user
exports.findAll = async (req, res) => {
  try {
    const userId = req.userId;
    
    const addresses = await Address.findAll({
      where: { userId },
      order: [
        ['isDefault', 'DESC'],
        ['createdAt', 'DESC']
      ]
    });
    
    return successResponse(res, addresses, 'Addresses retrieved successfully');
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// Get address by ID
exports.findOne = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    
    const address = await Address.findOne({
      where: { id, userId }
    });
    
    if (!address) {
      return notFoundResponse(res, 'Address not found or does not belong to user');
    }
    
    return successResponse(res, address, 'Address retrieved successfully');
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// Update address
exports.update = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const {
      label, addressLine1, addressLine2, city, state, zipCode,
      isDefault, latitude, longitude
    } = req.body;
    
    // Find address
    const address = await Address.findOne({
      where: { id, userId }
    });
    
    if (!address) {
      return notFoundResponse(res, 'Address not found or does not belong to user');
    }
    
    // Try to get coordinates if address fields changed and coordinates not provided
    let coords = { 
      latitude: latitude !== undefined ? latitude : address.latitude,
      longitude: longitude !== undefined ? longitude : address.longitude
    };
    
    const addressChanged = 
      (addressLine1 && addressLine1 !== address.addressLine1) ||
      (city && city !== address.city) ||
      (state && state !== address.state) ||
      (zipCode && zipCode !== address.zipCode);
      
    if (addressChanged && (!coords.latitude || !coords.longitude)) {
      try {
        const fullAddress = `${addressLine1 || address.addressLine1}, ${city || address.city}, ${state || address.state}, ${zipCode || address.zipCode}`;
        coords = await getCoordinatesFromAddress(fullAddress);
      } catch (geoError) {
        console.error('Error getting coordinates:', geoError);
        // Continue with existing coordinates if geocoding fails
      }
    }
    
    // Update address
    await address.update({
      label: label || address.label,
      addressLine1: addressLine1 || address.addressLine1,
      addressLine2: addressLine2 !== undefined ? addressLine2 : address.addressLine2,
      city: city || address.city,
      state: state || address.state,
      zipCode: zipCode || address.zipCode,
      isDefault: isDefault !== undefined ? isDefault : address.isDefault,
      latitude: coords.latitude,
      longitude: coords.longitude
    });
    
    return successResponse(res, address, 'Address updated successfully');
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// Delete address
exports.delete = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    
    // Find address
    const address = await Address.findOne({
      where: { id, userId }
    });
    
    if (!address) {
      return notFoundResponse(res, 'Address not found or does not belong to user');
    }
    
    // Check if this is the only address
    const addressCount = await Address.count({
      where: { userId }
    });
    
    if (addressCount === 1) {
      return errorResponse(res, 'Cannot delete the only address', 400);
    }
    
    // If this is the default address, set another one as default
    if (address.isDefault) {
      const anotherAddress = await Address.findOne({
        where: {
          userId,
          id: { [db.Sequelize.Op.ne]: id }
        }
      });
      
      if (anotherAddress) {
        await anotherAddress.update({ isDefault: true });
      }
    }
    
    // Delete address
    await address.destroy();
    
    return successResponse(res, null, 'Address deleted successfully');
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// Set address as default
exports.setDefault = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    
    // Find address
    const address = await Address.findOne({
      where: { id, userId }
    });
    
    if (!address) {
      return notFoundResponse(res, 'Address not found or does not belong to user');
    }
    
    // Update all addresses to non-default first
    await Address.update(
      { isDefault: false },
      { where: { userId } }
    );
    
    // Set this address as default
    await address.update({ isDefault: true });
    
    return successResponse(res, address, 'Address set as default successfully');
    
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};