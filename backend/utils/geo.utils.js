const axios = require('axios');

// Calculate distance between two points (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  const distance = R * c; // Distance in km
  return distance;
};

// Convert degrees to radians
const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

// Get coordinates from address using Google Maps Geocoding API
const getCoordinatesFromAddress = async (address) => {
  try {
    const apiKey = process.env.GEOCODING_API_KEY;
    if (!apiKey) {
      throw new Error('Geocoding API key not configured');
    }

    const formattedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${formattedAddress}&key=${apiKey}`;
    
    const response = await axios.get(url);
    
    if (response.data.status !== 'OK') {
      throw new Error(`Geocoding failed: ${response.data.status}`);
    }
    
    const location = response.data.results[0].geometry.location;
    return {
      latitude: location.lat,
      longitude: location.lng
    };
  } catch (error) {
    console.error('Error in geocoding:', error);
    throw error;
  }
};

// Filter nearby shops based on buyer location and shop delivery radius
const filterNearbyShops = (buyerLocation, shops) => {
  if (!buyerLocation.latitude || !buyerLocation.longitude) {
    return [];
  }
  
  return shops.filter(shop => {
    if (!shop.latitude || !shop.longitude) {
      return false;
    }
    
    const distance = calculateDistance(
      buyerLocation.latitude,
      buyerLocation.longitude,
      shop.latitude,
      shop.longitude
    );
    
    // Check if the buyer is within the shop's delivery radius
    return distance <= shop.deliveryRadius;
  });
};

// Find nearby orders for a shop
const findNearbyOrders = (shopLocation, deliveryRadius, orders) => {
  if (!shopLocation.latitude || !shopLocation.longitude) {
    return [];
  }
  
  return orders.filter(order => {
    if (!order.address || !order.address.latitude || !order.address.longitude) {
      return false;
    }
    
    const distance = calculateDistance(
      shopLocation.latitude,
      shopLocation.longitude,
      order.address.latitude,
      order.address.longitude
    );
    
    // Check if the order is within the shop's delivery radius
    return distance <= deliveryRadius;
  }).map(order => ({
    ...order.toJSON(),
    distance: calculateDistance(
      shopLocation.latitude,
      shopLocation.longitude,
      order.address.latitude,
      order.address.longitude
    ).toFixed(2) // Add distance in km
  }));
};

module.exports = {
  calculateDistance,
  getCoordinatesFromAddress,
  filterNearbyShops,
  findNearbyOrders
};