import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Edit, X, Loader2, PlusCircle, LocateFixed } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import BuyerDashboardNavbar from './BuyerDashboardNavbar';

const API_BASE_URL = 'http://localhost:3000';

const Address = () => {
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    address_line: '',
    landmark: '',
    latitude: '',
    longitude: '',
    is_default: false,
  });

  const [editingAddressId, setEditingAddressId] = useState(null);

  const [showMap, setShowMap] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const mapRef = useRef(null);
  const leafletMapInstance = useRef(null);
  const leafletMarkerInstance = useRef(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const [theme, setTheme] = useState(() => {
    const savedMode = localStorage.getItem('theme');
    return savedMode || 'light';
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

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const showToast = (message, type = 'info') => {
    switch (type) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      default:
        toast(message);
        break;
    }
  };

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      return newTheme;
    });
  };

  const getAuthToken = useCallback(() => {
    return localStorage.getItem('buyer_token');
  }, []);

  const fetchUserAddresses = useCallback(async () => {
    setLoadingAddresses(true);
    setError(null);
    try {
      const token = getAuthToken();
      if (!token) {
        setAddresses([]);
        setLoadingAddresses(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/addresses/my-addresses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('buyer_token');
          localStorage.removeItem('buyer_user');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setAddresses(data.data || []);
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
      setLoadingAddresses(false);
    }
  }, [getAuthToken]);

  const reverseGeocodeNominatim = async (lat, lon) => {
    try {
      const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'GrocerySellerRegistrationApp/1.0 (your.email@example.com)'
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

  const initializeLeafletMap = useCallback(async () => {
    if (!leafletLoaded || !window.L || !mapRef.current) {
      return;
    }

    if (leafletMapInstance.current) {
      leafletMapInstance.current.remove();
      leafletMapInstance.current = null;
    }

    const defaultCenter = { lat: 20.5937, lng: 78.9629 };
    let initialLat = parseFloat(formData.latitude);
    let initialLng = parseFloat(formData.longitude);
    let center = (initialLat && initialLng && !isNaN(initialLat) && !isNaN(initialLng))
        ? [initialLat, initialLng]
        : [defaultCenter.lat, defaultCenter.lng];

    const map = window.L.map(mapRef.current).setView(center, 15);
    leafletMapInstance.current = map;

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const marker = window.L.marker(center, { draggable: true }).addTo(map);
    leafletMarkerInstance.current = marker;

    const updateLocationAndAddress = async (latlng) => {
      setFormData(prev => ({
        ...prev,
        latitude: latlng.lat.toString(),
        longitude: latlng.lng.toString()
      }));
      const address = await reverseGeocodeNominatim(latlng.lat, latlng.lng);
      setFormData(prev => ({ ...prev, address_line: address }));
      showToast("Location selected from map!", "success");
    };

    if (formData.latitude && formData.longitude) {
      await updateLocationAndAddress({ lat: initialLat, lng: initialLng });
    } else {
      await updateLocationAndAddress({ lat: center[0], lng: center[1] });
    }

    marker.on('dragend', async (event) => {
      await updateLocationAndAddress(event.target.getLatLng());
    });

    map.on('click', async (event) => {
      marker.setLatLng(event.latlng);
      await updateLocationAndAddress(event.latlng);
    });
  }, [showMap, leafletLoaded, formData.latitude, formData.longitude]);

  const getCurrentLocation = () => {
    setLocationLoading(true);
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
            address_line: address
          }));
          showToast("Current location detected successfully!", "success");
          setLocationLoading(false);
          setShowMap(true);
        },
        (error) => {
          console.error("Geolocation error:", error);
          let errorMessage = "Unable to retrieve your location.";
          if (error.code === error.PERMISSION_DENIED) {
            errorMessage = "Location access denied. Please allow location permissions in your browser settings.";
          }
          showToast(errorMessage, "error");
          setLocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();

    if (!formData.latitude || !formData.longitude) {
      showToast("Please select a precise location on the map.", "error");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      showToast("You must be logged in to manage addresses.", "error");
      return;
    }

    const apiCall = async () => {
      const method = editingAddressId ? 'PUT' : 'POST';
      const url = editingAddressId
          ? `${API_BASE_URL}/api/addresses/${editingAddressId}`
          : `${API_BASE_URL}/api/addresses/add`;

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || `Failed to ${editingAddressId ? 'update' : 'add'} address.`);
      }
      return data;
    };

    toast.promise(apiCall(), {
      loading: 'Saving address...',
      success: (data) => {
        fetchUserAddresses();
        setFormData({ name: '', address_line: '', landmark: '', latitude: '', longitude: '', is_default: false });
        setEditingAddressId(null);
        setShowMap(false);
        return `Address ${editingAddressId ? 'updated' : 'added'} successfully!`;
      },
      error: (err) => err.message
    });
  };

  const handleEditAddress = (address) => {
    setEditingAddressId(address.id);
    setFormData({
      name: address.name,
      address_line: address.address_line,
      landmark: address.landmark || '',
      latitude: address.latitude ? address.latitude.toString() : '',
      longitude: address.longitude ? address.longitude.toString() : '',
      is_default: address.is_default,
    });
    setShowMap(true);
  };

  const handleCancelEdit = () => {
    setEditingAddressId(null);
    setFormData({ name: '', address_line: '', landmark: '', latitude: '', longitude: '', is_default: false });
    setShowMap(false);
  };

  const handleDeleteAddress = (addressId) => {
    setShowDeleteConfirm(addressId);
  };

  const confirmDelete = async () => {
    const addressIdToDelete = showDeleteConfirm;
    setShowDeleteConfirm(null);

    const token = getAuthToken();
    if (!token) {
      showToast("You must be logged in.", "error");
      return;
    }

    const apiCall = async () => {
      const response = await fetch(`${API_BASE_URL}/api/addresses/${addressIdToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete address.');
      }
      return data;
    };

    toast.promise(apiCall(), {
      loading: 'Deleting address...',
      success: () => {
        fetchUserAddresses();
        return 'Address deleted successfully!';
      },
      error: (err) => err.message
    });
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    fetchUserAddresses();
  }, [fetchUserAddresses]);

  useEffect(() => {
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setLeafletLoaded(true);
      document.head.appendChild(script);
    } else {
      setLeafletLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (showMap && leafletLoaded) {
      initializeLeafletMap();
    }
    return () => {
      if (leafletMapInstance.current) {
        leafletMapInstance.current.remove();
        leafletMapInstance.current = null;
      }
    };
  }, [showMap, leafletLoaded, initializeLeafletMap]);

  return (
      <div className={`min-h-screen font-inter transition-colors duration-300 ${
          theme === 'light' ? 'bg-gradient-to-br from-green-50 to-green-100 text-gray-900' : 'bg-gray-900 text-gray-100'
      }`}>
        {/* === BEAUTIFIED TOASTER WITH THEME SUPPORT === */}
        <Toaster
            position="top-center"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
              duration: 4000,
              style: {
                background: theme === 'light' ? '#FFFFFF' : '#1F2937', // Light: white, Dark: gray-800
                color: theme === 'light' ? '#111827' : '#F9FAFB',      // Light: gray-900, Dark: gray-50
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',   // green-500
                  secondary: '#FFFFFF',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#EF4444', // red-500
                  secondary: '#FFFFFF',
                },
              },
            }}
        />

        <BuyerDashboardNavbar
            theme={theme}
            toggleTheme={toggleTheme}
            buyerUser={buyerUser}
            cartItemCount={0}
        />
        <div className="container mx-auto p-4 py-8">
          <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-center text-green-700 dark:text-green-400 mb-8"
          >
            Manage Your Addresses
          </motion.h1>

          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 mb-8"
          >
            <h2 className="text-2xl font-semibold mb-6 text-green-600 dark:text-green-300">
              {editingAddressId ? 'Edit Address' : 'Add New Address'}
            </h2>
            <form onSubmit={handleAddressSubmit}>
              {/* Form content remains the same */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200 flex items-center">
                    <MapPin className="mr-2 text-green-500" size={20} /> Select Location
                    <button
                        type="button"
                        onClick={() => setShowMap(!showMap)}
                        disabled={!leafletLoaded}
                        className="ml-auto p-2 rounded-full bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 dark:text-purple-400 transition disabled:opacity-50"
                        aria-label={showMap ? "Hide Map" : "Show Map"}
                    >
                      {showMap ? "Close Map" : "Open Map"}
                    </button>
                  </h3>
                  <AnimatePresence>
                    {showMap && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: '300px', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                          <div
                              ref={mapRef}
                              className="w-full h-full rounded-md shadow-inner border border-gray-300 dark:border-gray-600"
                          ></div>
                        </motion.div>
                    )}
                  </AnimatePresence>
                  <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={locationLoading}
                      className="mt-4 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold py-3 px-4 rounded-md transition flex items-center justify-center disabled:opacity-50"
                  >
                    {locationLoading ? (
                        <Loader2 className="animate-spin mr-2" size={20} />
                    ) : (
                        <LocateFixed className="mr-2" size={20} />
                    )}
                    Get Current Location
                  </button>
                </div>

                <div className="flex flex-col space-y-4">
                  <h3 className="text-lg font-semibold -mb-1 text-gray-800 dark:text-gray-200">Address Details</h3>
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Address Name
                    </label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., My Home, Office" className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-green-500" required />
                  </div>
                  <div>
                    <label htmlFor="address_line" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Address
                    </label>
                    <textarea id="address_line" name="address_line" value={formData.address_line} onChange={handleChange} placeholder="House No., Street, Area" rows="3" className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-green-500 resize-y" required></textarea>
                  </div>
                  <div>
                    <label htmlFor="landmark" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Landmark (Optional)
                    </label>
                    <input type="text" id="landmark" name="landmark" value={formData.landmark} onChange={handleChange} placeholder="e.g., Near City Hospital" className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div className="flex items-center pt-2">
                    <input type="checkbox" id="is_default" name="is_default" checked={formData.is_default} onChange={handleChange} className="h-5 w-5 text-green-600 border-gray-300 rounded focus:ring-green-500" />
                    <label htmlFor="is_default" className="ml-2 block text-sm">
                      Set as Default Address
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                {editingAddressId && (
                    <button type="button" onClick={handleCancelEdit} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-md transition dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200">
                      Cancel
                    </button>
                )}
                <button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-md transition disabled:opacity-50">
                  {editingAddressId ? 'Update Address' : 'Add Address'}
                </button>
              </div>
            </form>
          </motion.div>

          {/* Saved Addresses List and Delete Confirmation Modal remain the same */}
          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6"
          >
            <h2 className="text-2xl font-semibold mb-6 text-green-600 dark:text-green-300">Your Saved Addresses</h2>
            {loadingAddresses ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="animate-spin text-green-500" size={32} />
                </div>
            ) : addresses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {addresses.map((address) => (
                      <motion.div
                          key={address.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          layout
                          className="relative border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                      >
                        {address.is_default == 1
                            && (
                            <span className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">Default</span>
                        )}
                        <div>
                          <h3 className="text-lg font-semibold mb-2 flex items-center"><MapPin className="mr-2 text-green-500" size={20} />{address.name}</h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">{address.address_line}</p>
                          {address.landmark && <p className="text-gray-500 dark:text-gray-400 text-xs">Landmark: {address.landmark}</p>}
                        </div>
                        <div className="flex justify-end space-x-2 mt-4">
                          <button onClick={() => handleEditAddress(address)} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60 transition"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteAddress(address.id)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60 transition"><X className="w-4 h-4" /></button>
                        </div>
                      </motion.div>
                  ))}
                </div>
            ) : (
                <div className="text-center py-10 text-gray-500 dark:text-zinc-400">
                  <PlusCircle className="w-12 h-12 mx-auto text-gray-400 dark:text-zinc-500 mb-4" />
                  <p>No addresses found.</p>
                </div>
            )}
          </motion.div>
        </div>

        <AnimatePresence>
          {showDeleteConfirm && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm text-center">
                  <h3 className="text-xl font-bold mb-4">Confirm Deletion</h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-6">Are you sure you want to delete this address?</p>
                  <div className="flex justify-center space-x-4">
                    <button onClick={cancelDelete} className="px-5 py-2 bg-gray-200 hover:bg-gray-300 rounded-md font-semibold transition dark:bg-gray-700 dark:hover:bg-gray-600">Cancel</button>
                    <button onClick={confirmDelete} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-semibold transition">Yes, Delete</button>
                  </div>
                </motion.div>
              </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
};

export default Address;