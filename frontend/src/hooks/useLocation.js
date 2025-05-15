import { useState, useEffect } from 'react';

/**
 * Custom hook for handling user location
 * @returns {Object} Location data and methods
 */
const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Get current location using the Geolocation API
   */
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        
        // In a real app, you would use a geocoding service to get the address
        // For demo, we'll simulate this with a timeout
        setTimeout(() => {
          const mockAddress = {
            addressLine1: '123 Current Location St',
            addressLine2: '',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
          };
          
          setAddress(mockAddress);
          setLoading(false);
        }, 1000);
      },
      (error) => {
        let errorMessage = 'Failed to get your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'You denied the request for geolocation';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'The request to get your location timed out';
            break;
          default:
            errorMessage = 'An unknown error occurred';
        }
        
        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  /**
   * Calculate distance between two coordinates in kilometers
   * @param {number} lat1 - Latitude of first point
   * @param {number} lon1 - Longitude of first point
   * @param {number} lat2 - Latitude of second point
   * @param {number} lon2 - Longitude of second point
   * @returns {number} Distance in kilometers
   */
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) {
      return null;
    }
    
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

  /**
   * Convert degrees to radians
   * @param {number} deg - Degrees
   * @returns {number} Radians
   */
  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  /**
   * Check if a location is within a specified radius
   * @param {Object} targetLocation - Target location coordinates
   * @param {number} radius - Radius in kilometers
   * @returns {boolean} Whether location is within radius
   */
  const isWithinRadius = (targetLocation, radius = 10) => {
    if (!location || !targetLocation) {
      return false;
    }
    
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      targetLocation.latitude,
      targetLocation.longitude
    );
    
    return distance <= radius;
  };

  return {
    location,
    address,
    loading,
    error,
    getCurrentLocation,
    calculateDistance,
    isWithinRadius,
  };
};

export default useLocation;