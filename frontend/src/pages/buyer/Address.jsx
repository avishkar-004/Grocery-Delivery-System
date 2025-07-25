import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Edit, X, Loader2, PlusCircle, LocateFixed } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // For animations
import BuyerDashboardNavbar from './BuyerDashboardNavbar'; // Ensure this path is correct relative to Address.jsx

// Base URL for your backend API
const API_BASE_URL = 'http://localhost:3000'; // Replace with your actual backend URL

const Address = () => {
  // State for managing addresses fetched from the backend
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true); // Loading state for address list
  const [error, setError] = useState(null); // Error state for address operations

  // State for the address form fields
  const [formData, setFormData] = useState({
    name: '',            // e.g., "Home", "Work"
    address_line: '',    // Full address string
    landmark: '',        // Optional landmark
    latitude: '',        // Latitude from map/GPS
    longitude: '',       // Longitude from map/GPS
    is_default: false,   // Whether this address is default
  });

  // State to track if we are currently editing an address (holds the ID of the address being edited)
  const [editingAddressId, setEditingAddressId] = useState(null);

  // States for Leaflet map functionality
  const [showMap, setShowMap] = useState(false); // Controls visibility of the map
  const [leafletLoaded, setLeafletLoaded] = useState(false); // Tracks if Leaflet library is loaded
  const mapRef = useRef(null); // React ref for the map container DOM element
  const leafletMapInstance = useRef(null); // Ref to hold the Leaflet map object
  const leafletMarkerInstance = useRef(null); // Ref to hold the Leaflet marker object
  const [locationLoading, setLocationLoading] = useState(false); // Loading state for geolocation API

  // States for theme and user info, passed to the Navbar
  const [theme, setTheme] = useState(() => {
    // Read theme from localStorage on initial render
    const savedMode = localStorage.getItem('theme');
    return savedMode || 'light'; // Default to 'light' if no theme is saved
  });

  const [buyerUser, setBuyerUser] = useState(() => {
    const savedUser = localStorage.getItem('buyer_user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error("Failed to parse buyer_user from localStorage", e);
      return null;
    }
  });

  // New state for controlling the delete confirmation modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // Stores ID of address to delete, or null

  // Dummy toast function for user feedback. Replace with a real toast library.
  const showToast = (message, type = 'info') => {
    console.log(`Toast (${type}): ${message}`);
    // Example for a real toast library (e.g., react-hot-toast):
    // if (type === 'success') toast.success(message);
    // else if (type === 'error') toast.error(message);
    // else toast(message);
  };

  // Function to toggle between light and dark themes (passed to Navbar)
  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme); // Save theme to localStorage
      return newTheme;
    });
  };

  // Function to retrieve the authentication token from localStorage
  const getAuthToken = useCallback(() => {
    return localStorage.getItem('buyer_token');
  }, []);

  // --- API Interaction Functions ---

  // Fetches all addresses for the current user
  const fetchUserAddresses = useCallback(async () => {
    setLoadingAddresses(true); // Set loading state for the address list
    setError(null); // Clear previous errors
    try {
      const token = getAuthToken();
      if (!token) {
        setAddresses([]); // Clear addresses if no token is found
        setLoadingAddresses(false);
        // No alert here; assume the main app handles login redirection if unauthorized
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/addresses/my-addresses`, {
        headers: {
          'Authorization': `Bearer ${token}` // Include authorization token
        }
      });

      if (!response.ok) {
        // Handle specific unauthorized/forbidden responses
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('buyer_token'); // Clear invalid token
          localStorage.removeItem('buyer_user'); // Clear invalid user data
          // No alert here, let the main app handle login redirect if needed
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setAddresses(data.data || []); // Update addresses state with fetched data
      } else {
        showToast(data.message || 'Failed to load addresses', 'error');
        setAddresses([]);
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
      setError('Network error fetching addresses. Please try again.');
      showToast('Network error fetching addresses.', 'error');
      setAddresses([]);
    } finally {
      setLoadingAddresses(false); // Clear loading state
    }
  }, [getAuthToken]); // Re-run if getAuthToken changes (unlikely, but good practice)

  // --- Leaflet Map Functions ---

  // Reverse geocoding function using Nominatim OpenStreetMap API
  const reverseGeocodeNominatim = async (lat, lon) => {
    try {
      const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'GrocerySellerRegistrationApp/1.0 (your.email@example.com)' // Required by Nominatim
            }
          }
      );

      if (response.ok) {
        const data = await response.json();
        return data.display_name || `Lat: ${lat.toFixed(6)}, Lng: ${lon.toFixed(6)}`;
      } else {
        console.error("Nominatim reverse geocoding failed:", response.status, response.statusText);
        showToast("Address lookup failed. Coordinates captured.", "error");
        return `Lat: ${lat.toFixed(6)}, Lng: ${lon.toFixed(6)}`;
      }
    } catch (error) {
      console.error("Nominatim reverse geocoding network error:", error);
      showToast("Network error during address lookup. Coordinates captured.", "error");
      return `Lat: ${lat.toFixed(6)}, Lng: ${lon.toFixed(6)}`;
    }
  };

  // Initializes and sets up the Leaflet map
  const initializeLeafletMap = useCallback(async () => {
    if (!leafletLoaded || !window.L || !mapRef.current) {
      console.warn("Leaflet library not loaded or mapRef not available.");
      return;
    }

    // Remove existing map instance if any to prevent multiple maps
    if (leafletMapInstance.current) {
      leafletMapInstance.current.remove();
      leafletMapInstance.current = null;
    }

    const defaultCenter = { lat: 20.5937, lng: 78.9629 }; // Center of India
    let initialLat = parseFloat(formData.latitude);
    let initialLng = parseFloat(formData.longitude);
    let center = (initialLat && initialLng && !isNaN(initialLat) && !isNaN(initialLng))
        ? [initialLat, initialLng]
        : [defaultCenter.lat, defaultCenter.lng];

    // Create new map instance
    const map = window.L.map(mapRef.current).setView(center, 15);
    leafletMapInstance.current = map;

    // Add OpenStreetMap tiles
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add draggable marker
    const marker = window.L.marker(center, { draggable: true }).addTo(map);
    leafletMarkerInstance.current = marker;

    // Function to update form data with new location and reverse geocoded address
    const updateLocationAndAddress = async (latlng) => {
      setFormData(prev => ({
        ...prev,
        latitude: latlng.lat.toString(),
        longitude: latlng.lng.toString()
      }));
      const address = await reverseGeocodeNominatim(latlng.lat, latlng.lng);
      setFormData(prev => ({ ...prev, address_line: address })); // Update address_line in form
      showToast("Location selected from map!", "success");
    };

    // Set initial marker position and get address if form data already has coordinates
    if (formData.latitude && formData.longitude) {
      await updateLocationAndAddress({ lat: initialLat, lng: initialLng });
    } else {
      // If no coordinates in form, get address for the initial center (default or current location)
      await updateLocationAndAddress({ lat: center[0], lng: center[1] });
    }

    // Event listener for marker drag end
    marker.on('dragend', async (event) => {
      await updateLocationAndAddress(event.target.getLatLng());
    });

    // Event listener for map click
    map.on('click', async (event) => {
      marker.setLatLng(event.latlng);
      await updateLocationAndAddress(event.latlng);
    });
  }, [showMap, leafletLoaded, formData.latitude, formData.longitude]); // Dependencies for useCallback

  // Get current geolocation using browser's Geolocation API
  const getCurrentLocation = () => {
    setLocationLoading(true); // Set loading state for geolocation
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by this browser.", "error");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const address = await reverseGeocodeNominatim(latitude, longitude);

          setFormData(prev => ({
            ...prev,
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            address_line: address // Update address_line with detected address
          }));
          showToast("Current location detected successfully!", "success");
          setLocationLoading(false);
          setShowMap(true); // Automatically show the map with the detected location
        },
        (error) => {
          console.error("Geolocation error:", error);
          let errorMessage = "Unable to retrieve your location. Please enter manually or try map selection.";
          if (error.code === error.PERMISSION_DENIED) {
            errorMessage = "Location access denied. Please allow location permissions in your browser settings.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMessage = "Location information is unavailable. Check your device's GPS or network.";
          } else if (error.code === error.TIMEOUT) {
            errorMessage = "Location request timed out. Please try again or enter manually.";
          }
          showToast(errorMessage, "error");
          setLocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // Geolocation options
    );
  };

  // --- Form and Address Management Functions ---

  // Handles changes in form input fields
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handles form submission for adding or updating an address
  const handleAddressSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    const token = getAuthToken();
    if (!token) {
      showToast("You must be logged in to manage addresses.", "error");
      return;
    }

    setLoadingAddresses(true); // Set loading state for form submission
    setError(null); // Clear previous errors

    const method = editingAddressId ? 'PUT' : 'POST'; // Determine API method (PUT for edit, POST for add)
    const url = editingAddressId
        ? `${API_BASE_URL}/api/addresses/${editingAddressId}` // Endpoint for updating
        : `${API_BASE_URL}/api/addresses/add`; // Endpoint for adding

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Include authorization token
        },
        body: JSON.stringify(formData) // Send form data as JSON
      });

      const data = await response.json(); // Parse API response

      if (response.ok && data.success) {
        showToast(`Address ${editingAddressId ? 'updated' : 'added'} successfully!`, 'success');
        // Reset form to initial empty state
        setFormData({
          name: '',
          address_line: '',
          landmark: '',
          latitude: '',
          longitude: '',
          is_default: false,
        });
        setEditingAddressId(null); // Exit editing mode
        setShowMap(false); // Hide map after successful submission
        fetchUserAddresses(); // Refresh the list of addresses to show changes
      } else {
        setError(data.message || `Failed to ${editingAddressId ? 'update' : 'add'} address.`);
        showToast(data.message || `Failed to ${editingAddressId ? 'update' : 'add'} address.`, 'error');
      }
    } catch (err) {
      console.error('Address submit error:', err);
      setError('Network error. Please try again.');
      showToast('Network error. Please try again.', 'error');
    } finally {
      setLoadingAddresses(false); // Clear loading state
    }
  };

  // Sets the form data and enters editing mode for a selected address
  const handleEditAddress = (address) => {
    setEditingAddressId(address.id); // Set the ID of the address being edited
    setFormData({ // Populate form with existing address data
      name: address.name,
      address_line: address.address_line,
      landmark: address.landmark || '', // Ensure landmark is not null
      latitude: address.latitude ? address.latitude.toString() : '',
      longitude: address.longitude ? address.longitude.toString() : '',
      is_default: address.is_default,
    });
    setShowMap(true); // Show map when editing an existing address
  };

  // Clears the form and exits editing mode
  const handleCancelEdit = () => {
    setEditingAddressId(null); // Exit editing mode
    // Reset form to initial empty state
    setFormData({
      name: '',
      address_line: '',
      landmark: '',
      latitude: '',
      longitude: '',
      is_default: false,
    });
    setShowMap(false); // Hide map
  };

  // Function to initiate deletion confirmation
  const handleDeleteAddress = (addressId) => {
    setShowDeleteConfirm(addressId); // Set the ID of the address to be deleted
  };

  // Function to confirm and proceed with deletion
  const confirmDelete = async () => {
    const addressIdToDelete = showDeleteConfirm; // Get the ID from state
    setShowDeleteConfirm(null); // Close the confirmation modal

    const token = getAuthToken();
    if (!token) {
      showToast("You must be logged in to delete addresses.", "error");
      return;
    }

    setLoadingAddresses(true); // Set loading state
    setError(null); // Clear previous errors
    try {
      const response = await fetch(`${API_BASE_URL}/api/addresses/${addressIdToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}` // Include authorization token
        }
      });

      const data = await response.json(); // Parse API response

      if (response.ok && data.success) {
        showToast('Address deleted successfully!', 'success');
        fetchUserAddresses(); // Refresh the list of addresses
      } else {
        setError(data.message || 'Failed to delete address.');
        showToast(data.message || 'Failed to delete address.', 'error');
      }
    } catch (err) {
      console.error('Delete address error:', err);
      setError('Network error. Please try again.');
      showToast('Network error. Please try again.', 'error');
    } finally {
      setLoadingAddresses(false); // Clear loading state
    }
  };

  // Function to cancel deletion
  const cancelDelete = () => {
    setShowDeleteConfirm(null); // Close the confirmation modal
  };

  // --- useEffect Hooks ---

  // Effect to apply the theme class to the document's HTML element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Initial fetch of addresses when the component mounts
  useEffect(() => {
    fetchUserAddresses();
  }, [fetchUserAddresses]); // Dependency on fetchUserAddresses useCallback

  // Effect to dynamically load Leaflet CSS and JS
  useEffect(() => {
    // Load Leaflet CSS if not already present
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAo9TxxGgCCSgPropynS9kSqyFastalU8PkUWfmkz/tdwG62/rqQkFFMlK/RTgsqT4A2jW/CntN9C7A5VfCg==';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    // Load Leaflet JS if not already loaded and not currently being loaded
    if (!window.L && !document.querySelector('script[src*="leaflet.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      script.async = true; // Load asynchronously
      script.onload = () => setLeafletLoaded(true); // Set state when script loads
      script.onerror = () => {
        showToast("Failed to load map library script.", "error");
        setLeafletLoaded(false);
      };
      document.head.appendChild(script);
    } else if (window.L) {
      // If Leaflet is already available (e.g., from a previous render), set loaded state
      setLeafletLoaded(true);
    }
  }, []); // Empty dependency array means this runs once on mount

  // Effect to initialize the Leaflet map when showMap is true and Leaflet is loaded
  useEffect(() => {
    if (showMap && leafletLoaded) {
      initializeLeafletMap();
    }

    // Cleanup function: remove map instance when component unmounts or map is hidden
    return () => {
      if (leafletMapInstance.current) {
        leafletMapInstance.current.remove();
        leafletMapInstance.current = null;
      }
    };
  }, [showMap, leafletLoaded, initializeLeafletMap]); // Dependencies for this effect

  return (
      <div className={`min-h-screen font-inter transition-colors duration-300 ${
          theme === 'light' ? 'bg-gradient-to-br from-green-50 to-green-100 text-gray-900' : 'bg-gray-900 text-gray-100'
      }`}>
        <BuyerDashboardNavbar
            theme={theme}
            toggleTheme={toggleTheme}
            buyerUser={buyerUser}
            cartItemCount={0} // Pass actual cart count if available from a global state/context
        />
        <div className="container mx-auto p-4 py-8">
          <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold text-center text-green-700 dark:text-green-400 mb-8"
          >
            Manage Your Addresses
          </motion.h1>

          {/* Address Form Section */}
          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 mb-8"
          >
            <h2 className="text-2xl font-semibold mb-6 text-green-600 dark:text-green-300">
              {editingAddressId ? 'Edit Address' : 'Add New Address'}
            </h2>
            <form onSubmit={handleAddressSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"> {/* Two-column layout */}
                {/* Left Half: Map and Location Buttons */}
                <div className="flex flex-col">
                  <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200 flex items-center">
                    <MapPin className="mr-2 text-green-500" size={20} /> Select Location
                    <button
                        type="button"
                        onClick={() => setShowMap(!showMap)}
                        disabled={!leafletLoaded}
                        className="ml-auto p-2 rounded-full bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 dark:text-purple-400 transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={showMap ? "Hide Map" : "Show Map"}
                    >
                      <MapPin className="w-5 h-5" />
                    </button>
                  </h3>
                  <AnimatePresence>
                    {showMap && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: '300px', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden flex-grow" // flex-grow to take available height
                        >
                          <div
                              id="mapid"
                              ref={mapRef}
                              className="w-full h-full rounded-md shadow-inner border border-gray-300 dark:border-gray-600"
                              style={{ minHeight: '250px' }}
                          ></div>
                          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Drag marker or click on map to set location.
                          </div>
                        </motion.div>
                    )}
                  </AnimatePresence>
                  <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={locationLoading}
                      className="mt-4 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {locationLoading ? (
                        <Loader2 className="animate-spin mr-2" size={20} />
                    ) : (
                        <LocateFixed className="mr-2" size={20} />
                    )}
                    Get Current Location
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Latitude
                      </label>
                      <input
                          type="text"
                          id="latitude"
                          name="latitude"
                          value={formData.latitude}
                          onChange={handleChange}
                          placeholder="Auto-filled from map/GPS"
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                          readOnly
                      />
                    </div>
                    <div>
                      <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Longitude
                      </label>
                      <input
                          type="text"
                          id="longitude"
                          name="longitude"
                          value={formData.longitude}
                          onChange={handleChange}
                          placeholder="Auto-filled from map/GPS"
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                          readOnly
                      />
                    </div>
                  </div>
                </div>

                {/* Right Half: Address Input Fields */}
                <div className="flex flex-col">
                  <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Address Details</h3>
                  <div className="space-y-4">
                    {/* Address Name Input */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Address Name (e.g., Home, Work)
                      </label>
                      <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="e.g., My Home, Office"
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                          required
                      />
                    </div>
                    {/* Full Address Line Input */}
                    <div>
                      <label htmlFor="address_line" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Full Address Line
                      </label>
                      <textarea
                          id="address_line"
                          name="address_line"
                          value={formData.address_line}
                          onChange={handleChange}
                          placeholder="House No., Street, Area, City, State, Pincode"
                          rows="3"
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 resize-y"
                          required
                      ></textarea>
                    </div>
                    {/* Landmark Input */}
                    <div>
                      <label htmlFor="landmark" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Landmark (Optional)
                      </label>
                      <input
                          type="text"
                          id="landmark"
                          name="landmark"
                          value={formData.landmark}
                          onChange={handleChange}
                          placeholder="e.g., Near City Hospital"
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    {/* Set as Default Checkbox */}
                    <div className="flex items-center">
                      <input
                          type="checkbox"
                          id="is_default"
                          name="is_default"
                          checked={formData.is_default}
                          onChange={handleChange}
                          className="h-5 w-5 text-green-600 border-gray-300 rounded focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <label htmlFor="is_default" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                        Set as Default Address
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex justify-end space-x-4 mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                {editingAddressId && (
                    <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-md transition duration-300 ease-in-out dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                    >
                      Cancel Edit
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loadingAddresses} // Disable button during API call
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-md transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingAddresses ? ( // Show loading spinner and text
                      <span className="flex items-center">
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Saving...
                  </span>
                  ) : editingAddressId ? ( // Text changes based on edit/add mode
                      'Update Address'
                  ) : (
                      'Add Address'
                  )}
                </button>
              </div>
              {error && <p className="text-red-500 text-center mt-4">{error}</p>}
            </form>
          </motion.div>

          {/* Existing Addresses List Section */}
          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6"
          >
            <h2 className="text-2xl font-semibold mb-6 text-green-600 dark:text-green-300">Your Saved Addresses</h2>
            {loadingAddresses ? ( // Show loading indicator for address list
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="animate-spin text-green-500" size={32} />
                  <p className="ml-3 text-gray-600 dark:text-gray-400">Loading addresses...</p>
                </div>
            ) : error ? ( // Show error if fetching failed
                <p className="text-red-500 text-center py-10">{error}</p>
            ) : addresses.length > 0 ? ( // Render addresses if available
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence> {/* For exit animations when addresses are deleted */}
                    {addresses.map((address) => (
                        <motion.div
                            key={address.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                            className="relative border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between"
                        >
                          {address.is_default && ( // "Default" badge
                              <span className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        Default
                      </span>
                          )}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center">
                              <MapPin className="mr-2 text-green-500" size={20} />
                              {address.name}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                              {address.address_line}
                            </p>
                            {address.landmark && (
                                <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">
                                  Landmark: {address.landmark}
                                </p>
                            )}
                            {address.latitude && address.longitude && (
                                <p className="text-gray-500 dark:text-gray-400 text-xs">
                                  Lat: {parseFloat(address.latitude).toFixed(4)}, Lng: {parseFloat(address.longitude).toFixed(4)}
                                </p>
                            )}
                          </div>
                          <div className="flex justify-end space-x-2 mt-4">
                            <button
                                onClick={() => handleEditAddress(address)}
                                className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors duration-200 dark:bg-blue-700 dark:text-white dark:hover:bg-blue-600"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleDeleteAddress(address.id)} // This will now open the modal
                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors duration-200 dark:bg-red-700 dark:text-white dark:hover:bg-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
            ) : ( // Message if no addresses are found
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-center py-10 text-gray-500 dark:text-zinc-400 flex flex-col items-center justify-center"
                >
                  <PlusCircle className="w-12 h-12 text-gray-400 dark:text-zinc-500 mb-4" />
                  <p className="text-lg font-medium">No addresses found.</p>
                  <p className="text-sm mt-1">Add your first address using the form above!</p>
                </motion.div>
            )}
          </motion.div>
        </div>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
              <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
              >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm text-center"
                >
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Confirm Deletion</h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-6">
                    Are you sure you want to delete this address? This action cannot be undone.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <button
                        onClick={cancelDelete}
                        className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-semibold transition duration-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                        onClick={confirmDelete}
                        className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-semibold transition duration-200"
                    >
                      Yes, Delete
                    </button>
                  </div>
                </motion.div>
              </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
};

export default Address;