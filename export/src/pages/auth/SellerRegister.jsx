import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingCart, // Re-using ShoppingCart for the main SVG on the left
  MapPin,
  Loader2,
  CheckCircle,
  AlertCircle,
  Mail,
  Eye,
  EyeOff,
  Map,
  Navigation,
  User,
  KeyRound,
  Home, // Added Home icon for navigation
  ArrowRight,
  Sun, // Icon for light mode
  Moon, // Icon for dark mode
  Clock, // Added Clock for timer icon
  RefreshCw // Added RefreshCw for resend icon
} from "lucide-react";

// Custom ShoppingCart SVG Component for the main illustration
const ShoppingCartIcon = ({ className = "w-6 h-6", fill = "none", stroke = "currentColor" }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        viewBox="0 0 24 24"
        fill={fill}
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
      <circle cx="9" cy="21" r="1"></circle>
      <circle cx="20" cy="21" r="1"></circle>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
    </svg>
);

// Password strength validation function (same as BuyerRegister)
const checkPasswordStrengthLocally = (password) => {
  let strength = { rating: 'weak', tip: 'Password needs to be stronger.' };
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  }
  if (/[A-Z]/.test(password)) {
    score += 1;
  }
  if (/[a-z]/.test(password)) {
    score += 1;
  }
  if (/\d/.test(password)) {
    score += 1;
  }
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  }

  // Define tips for each requirement
  const tips = [];
  if (password.length < 8) tips.push("at least 8 characters");
  if (!/[A-Z]/.test(password)) tips.push("an uppercase letter");
  if (!/[a-z]/.test(password)) tips.push("a lowercase letter");
  if (!/\d/.test(password)) tips.push("a number");
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) tips.push("a special character");

  if (score === 5) {
    strength = { rating: 'strong', tip: 'Great password!' };
  } else if (score >= 3) {
    strength = { rating: 'medium', tip: `Consider adding: ${tips.join(", ")}.` };
  } else {
    strength = { rating: 'weak', tip: `Must include: ${tips.join(", ")}.` };
  }

  return strength;
};


const SellerRegister = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    gender: "",
    date_of_birth: "",
    address: "",
    latitude: "",
    longitude: ""
  });

  const [isLoading, setIsLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [isResendingOTP, setIsResendingOTP] = useState(false);


  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);

  const [otpCode, setOtpCode] = useState("");

  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const [passwordStrength, setPasswordStrength] = useState({ rating: '', tip: '' });

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  // Apply dark mode class to body on state change
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // OTP Timer states
  const [otpTimer, setOtpTimer] = useState(600); // 10 minutes in seconds
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [canResendOTP, setCanResendOTP] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (isTimerActive && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(timer => {
          if (timer <= 1) {
            setIsTimerActive(false);
            setCanResendOTP(true);
            return 0;
          }
          return timer - 1;
        });
      }, 1000);
    } else if (!isTimerActive) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, otpTimer]);

  // Format timer display
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Refs for Leaflet map integration
  const mapRef = useRef(null);
  const leafletMapInstance = useRef(null);
  const leafletMarkerInstance = useRef(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 4000);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Local Password Strength Check (replaces LLM integration)
  useEffect(() => {
    const password = formData.password.trim();
    if (password.length === 0) {
      setPasswordStrength({ rating: '', tip: '' });
      return;
    }
    const strength = checkPasswordStrengthLocally(password);
    setPasswordStrength(strength);
  }, [formData.password]);


  // --- Leaflet (OpenStreetMap) Integration Logic ---

  // Effect to dynamically load Leaflet CSS and JS files
  useEffect(() => {
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAo9TxxGgCCSgPropynS9kSqyFastalU8PkUWfmkz/tdwG62/rqQkFFMlK/RTgsqT4A2jW/CntN9C7A5VfCg==';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    if (!window.L && !document.querySelector('script[src*="leaflet.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      script.async = true;
      script.onload = () => {
        setLeafletLoaded(true);
      };
      script.onerror = () => {
        showToast("Failed to load map library script.", "error");
        setLeafletLoaded(false);
      };
      document.head.appendChild(script);
    } else if (window.L) {
      setLeafletLoaded(true);
    }
  }, []);

  // Function to perform reverse geocoding using Nominatim (OpenStreetMap's geocoding service)
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
        console.error("Nominatim reverse geocoding failed (status:", response.status, "). Check User-Agent and network.", response.statusText);
        showToast("Address lookup failed. Coordinates captured.", "error");
        return `Lat: ${lat.toFixed(6)}, Lng: ${lon.toFixed(6)}`;
      }
    } catch (error) {
      console.error("Nominatim reverse geocoding network error:", error);
      showToast("Network error during address lookup. Coordinates captured.", "error");
      return `Lat: ${lat.toFixed(6)}, Lng: ${lon.toFixed(6)}`;
    }
  };

  // Function to initialize and render the Leaflet map
  const initializeLeafletMap = async () => {
    if (!leafletLoaded || !window.L || !mapRef.current) {
      console.warn("Leaflet library not loaded or mapRef not available. Cannot initialize map.");
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
      setFormData(prev => ({ ...prev, latitude: latlng.lat.toString(), longitude: latlng.lng.toString() }));
      const address = await reverseGeocodeNominatim(latlng.lat, latlng.lng);
      setFormData(prev => ({ ...prev, address: address }));
      showToast("Location selected from map!", "success");
    };

    await updateLocationAndAddress(marker.getLatLng());

    marker.on('dragend', async (event) => {
      await updateLocationAndAddress(event.target.getLatLng());
    });

    map.on('click', async (event) => {
      marker.setLatLng(event.latlng);
      await updateLocationAndAddress(event.latlng);
    });
  };

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
  }, [showMap, leafletLoaded]);

  const openMapPicker = () => {
    setLocationLoading(true);
    setShowMap(true);
    setTimeout(() => setLocationLoading(false), 500);
  };

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
            address: address
          }));
          showToast("Current location detected successfully!", "success");
          setLocationLoading(false);
        },
        (error) => {
          console.error("Geolocation error:", {
            code: error.code,
            message: error.message
          });
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
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // --- Form Validation Logic ---
  const validateStep = (step) => {
    const newErrors = {};
    let isValid = true;

    switch (step) {
      case 1: // Personal Information Step Validation
        if (!formData.name.trim() || formData.name.length < 2) {
          newErrors.name = "Full name is required and must be at least 2 characters.";
          isValid = false;
        }
        if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = "A valid email address is required.";
          isValid = false;
        }
        if (!formData.phone.trim() || !/^\d{10}$/.test(formData.phone)) {
          newErrors.phone = "A valid 10-digit phone number is required.";
          isValid = false;
        }
        break;
      case 2: // Business Location Step Validation
        if (!formData.address.trim()) {
          newErrors.address = "Business address is required.";
          isValid = false;
        }
        if (isNaN(parseFloat(formData.latitude)) || isNaN(parseFloat(formData.longitude)) || !formData.latitude || !formData.longitude) {
          newErrors.location = "Location coordinates are required. Please use 'Current Location' or 'Choose on Map'.";
          isValid = false;
        }
        break;
      case 3: // Security Step Validation (now using local validation)
        const passwordStrengthResult = checkPasswordStrengthLocally(formData.password);
        if (passwordStrengthResult.rating !== 'strong') {
          newErrors.password = passwordStrengthResult.tip;
          isValid = false;
        }
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = "Passwords do not match.";
          isValid = false;
        }
        break;
      default:
        break;
    }
    setErrors(newErrors);
    return isValid;
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    } else {
      showToast("Please complete the required information.", "error");
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep(3)) {
      showToast("Please complete the required information.", "error");
      return;
    }

    setIsLoading(true);

    try {
      const registrationData = {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone,
        password: formData.password,
        role: "seller",
        gender: formData.gender || undefined,
        date_of_birth: formData.date_of_birth || undefined,
        address: formData.address.trim(),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      };

      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData)
      });

      const data = await response.json();

      if (data.success) {
        showToast("OTP sent to your email! Please check your inbox!", "success");
        setCurrentStep(4); // Move to OTP verification step
        setOtpTimer(600); // Reset to 10 minutes
        setIsTimerActive(true);
        setCanResendOTP(false);
      } else {
        showToast(data.message || "Registration failed. Please try again.", "error");
      }
    } catch (error) {
      console.error("Registration network error:", error);
      showToast("Network error. Could not connect to server. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerification = async () => {
    if (!otpCode || otpCode.length !== 6) {
      showToast("Please enter a valid 6-digit OTP.", "error");
      return;
    }

    setIsLoading(true);

    const otpVerificationData = {
      email: formData.email.toLowerCase().trim(),
      otp: otpCode,
      type: 'registration',
      role: 'seller'
    };

    try {
      const response = await fetch('http://localhost:3000/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(otpVerificationData)
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: response.statusText }));
        const errorMessage = errorBody.message || `API error: ${response.status}`;
        console.error(`OTP verification API error: ${response.status} ${response.statusText} - Message:`, errorBody);
        showToast(errorMessage, "error");
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      if (data.success) {
        showToast("Registration completed successfully! Please sign in.", "success");
        if (data.data?.token) {
          localStorage.setItem('seller_token', data.data.token);
          localStorage.setItem('seller_user', JSON.stringify(data.data.user));
        }
        setTimeout(() => {
          navigate('/seller/login'); // Redirect to seller login page after a delay
        }, 2000); // 2-second delay
      } else {
        showToast(data.message || "OTP verification failed. Please check your OTP and try again.", "error");
      }
    } catch (error) {
      console.error("OTP verification network or parsing error:", error);
      showToast("Network error or invalid server response. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResendingOTP(true);

    try {
      const registrationData = {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone,
        password: formData.password,
        role: "seller",
        gender: formData.gender || undefined,
        date_of_birth: formData.date_of_birth || undefined,
        address: formData.address.trim(),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      };

      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData)
      });

      const data = await response.json();

      if (data.success) {
        showToast("New OTP sent to your email!", "success");
        setOtpTimer(600);
        setIsTimerActive(true);
        setCanResendOTP(false);
        setOtpCode("");
      } else {
        showToast(data.message || "Failed to resend OTP. Please try again.", "error");
      }
    } catch (error) {
      console.error("Resend OTP network error:", error);
      showToast("Network error. Could not resend OTP. Please try again.", "error");
    } finally {
      setIsResendingOTP(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">1</div>
                Personal Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Full Name *</label>
                  <input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-0
                          ${errors.name
                          ? 'border-red-300 focus:border-red-500 bg-red-50 dark:bg-red-900/20'
                          : 'border-gray-200 focus:border-green-500 bg-white dark:bg-gray-800 hover:border-green-300 dark:border-gray-700 dark:focus:border-green-400 dark:hover:border-green-600 text-gray-900 dark:text-gray-100'
                      }`}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="phoneNumber" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Phone Number *</label>
                  <input
                      id="phoneNumber"
                      type="tel"
                      placeholder="10-digit phone number"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-0
                          ${errors.phone
                          ? 'border-red-300 focus:border-red-500 bg-red-50 dark:bg-red-900/20'
                          : 'border-gray-200 focus:border-green-500 bg-white dark:bg-gray-800 hover:border-green-300 dark:border-gray-700 dark:focus:border-green-400 dark:hover:border-green-600 text-gray-900 dark:text-gray-100'
                      }`}
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="emailAddress" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                  <input
                      id="emailAddress"
                      type="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-0
                          ${errors.email
                          ? 'border-red-300 focus:border-red-500 bg-red-50 dark:bg-red-900/20'
                          : 'border-gray-200 focus:border-green-500 bg-white dark:bg-gray-800 hover:border-green-300 dark:border-gray-700 dark:focus:border-green-400 dark:hover:border-green-600 text-gray-900 dark:text-gray-100'
                      }`}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="gender" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Gender</label>
                  <select
                      id="gender"
                      value={formData.gender}
                      onChange={(e) => handleInputChange("gender", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 bg-white dark:bg-gray-800 hover:border-green-300 dark:border-gray-700 dark:focus:border-green-400 dark:hover:border-green-600 transition-all duration-300 focus:outline-none focus:ring-0 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="dob" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Date of Birth</label>
                  <input
                      id="dob"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 bg-white dark:bg-gray-800 hover:border-green-300 dark:border-gray-700 dark:focus:border-green-400 dark:hover:border-green-600 transition-all duration-300 focus:outline-none focus:ring-0 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>
        );
      case 2: // Business Location Step
        return (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">2</div>
                Business Location
              </h3>

              <div className="space-y-2">
                <label htmlFor="address" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Business Address *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                  <input
                      id="address"
                      type="text"
                      placeholder="Enter your business address"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-0
                          ${errors.address
                          ? 'border-red-300 focus:border-red-500 bg-red-50 dark:bg-red-900/20'
                          : 'border-gray-200 focus:border-green-500 bg-white dark:bg-gray-800 hover:border-green-300 dark:border-gray-700 dark:focus:border-green-400 dark:hover:border-green-600 text-gray-900 dark:text-gray-100'
                      }`}
                  />
                </div>
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={locationLoading}
                    className="flex items-center justify-center px-4 py-3 bg-indigo-500 text-white font-bold rounded-xl shadow-md hover:bg-indigo-600 transition-all duration-300 disabled:opacity-50"
                >
                  {locationLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                      <Navigation className="w-5 h-5 mr-2" />
                  )}
                  Current Location
                </button>
                <button
                    type="button"
                    onClick={openMapPicker}
                    disabled={locationLoading}
                    className="flex items-center justify-center px-4 py-3 bg-purple-500 text-white font-bold rounded-xl shadow-md hover:bg-purple-600 transition-all duration-300 disabled:opacity-50"
                >
                  <Map className="w-5 h-5 mr-2" />
                  Choose on Map
                </button>
              </div>

              {errors.location && <p className="text-red-500 text-sm mt-1 text-center">{errors.location}</p>}

              {showMap && (
                  <div className="mt-6">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">Select Location on Map:</label>
                    <div id="map" ref={mapRef} className="w-full h-64 rounded-xl shadow-inner border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900/50">
                      {!leafletLoaded && (
                          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                            <Loader2 className="w-8 h-8 animate-spin mr-2" /> Loading Map...
                          </div>
                      )}
                    </div>
                  </div>
              )}


            </div>
        );
      case 3: // Security step
        return (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">3</div>
                Security
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Password *</label>
                  <div className="relative">
                    <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        className={`w-full px-4 py-3 pr-12 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-0
                            ${errors.password
                            ? 'border-red-300 focus:border-red-500 bg-red-50 dark:bg-red-900/20'
                            : 'border-gray-200 focus:border-green-500 bg-white dark:bg-gray-800 hover:border-green-300 dark:border-gray-700 dark:focus:border-green-400 dark:hover:border-green-600 text-gray-900 dark:text-gray-100'
                        }`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                  {formData.password.length > 0 && passwordStrength.rating && (
                      <div className="mt-2 text-sm">
                        <p className={`font-semibold ${
                            passwordStrength.rating === 'strong' ? 'text-green-600 dark:text-green-400' :
                                passwordStrength.rating === 'medium' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          Password Strength: {passwordStrength.rating.charAt(0).toUpperCase() + passwordStrength.rating.slice(1)}
                        </p>
                        {passwordStrength.tip && <p className="text-gray-600 dark:text-gray-300">{passwordStrength.tip}</p>}
                      </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Confirm Password *</label>
                  <div className="relative">
                    <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                        className={`w-full px-4 py-3 pr-12 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-0
                            ${errors.confirmPassword
                            ? 'border-red-300 focus:border-red-500 bg-red-50 dark:bg-red-900/20'
                            : 'border-gray-200 focus:border-green-500 bg-white dark:bg-gray-800 hover:border-green-300 dark:border-gray-700 dark:focus:border-green-400 dark:hover:border-green-600 text-gray-900 dark:text-gray-100'
                        }`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>
        );
      case 4: // OTP Verification step
        return (
            <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 dark:border-gray-700/30 overflow-hidden max-w-md mx-auto p-8">
              <div className="relative bg-gradient-to-r from-green-600 via-teal-600 to-emerald-600 p-8 text-center rounded-2xl mb-8">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Verify Your Email</h2>
                <p className="text-green-100">Enter the 6-digit code sent to your email</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2 text-center">
                  <label htmlFor="otpCode" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Verification Code</label>
                  <input
                      id="otpCode"
                      type="text"
                      placeholder="000000"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full px-4 py-4 text-center text-2xl font-bold tracking-widest rounded-xl border-2 border-gray-200 focus:border-green-500 bg-white dark:bg-gray-800 hover:border-green-300 dark:border-gray-700 dark:focus:border-green-400 dark:hover:border-green-600 transition-all duration-300 focus:outline-none focus:ring-0 text-gray-900 dark:text-gray-100"
                      maxLength="6"
                      inputMode="numeric"
                      pattern="\d{6}"
                  />
                </div>

                <div className="text-center text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center">
                  {isTimerActive ? (
                      <>
                        <Clock className="w-4 h-4 mr-1" />
                        <span>Resend OTP in: {formatTime(otpTimer)}</span>
                      </>
                  ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-1" />
                        <button
                            type="button"
                            onClick={handleResendOTP}
                            disabled={isResendingOTP}
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 font-semibold disabled:opacity-50"
                        >
                          {isResendingOTP ? "Sending..." : "Resend OTP"}
                        </button>
                      </>
                  )}
                </div>

                <button
                    type="button"
                    onClick={handleOTPVerification}
                    disabled={isLoading || otpCode.length !== 6 }
                    className="w-full py-4 bg-gradient-to-r from-green-600 via-teal-600 to-emerald-600 text-white font-bold text-lg rounded-xl hover:from-emerald-600 hover:via-teal-600 hover:to-green-600 transition-all duration-300 shadow-xl hover:shadow-2xl disabled:opacity-50 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Verifying...</span>
                      </div>
                  ) : (
                      "Verify & Complete Registration"
                  )}
                </button>

                <div className="text-center mt-4">
                  <button
                      type="button"
                      onClick={() => navigate('/')}
                      className="flex items-center justify-center mx-auto text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-semibold transition-colors duration-200"
                  >
                    <Home className="w-4 h-4 mr-1" /> {/* Changed to Home icon */}
                    Back to Home
                  </button>
                </div>
              </div>
            </div>
        );
      default:
        return null;
    }
  };


  return (
      <div className={`min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 font-inter
      ${isDarkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100' : 'bg-gradient-to-br from-green-50 to-emerald-100 text-gray-900'}`}>
        {/* Subtle background SVG pattern */}
        <div className={`absolute inset-0 overflow-hidden pointer-events-none opacity-20
        ${isDarkMode ? 'text-gray-700' : ''}`}>
          <svg className="w-full h-full" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="50" r="80" fill="currentColor" className="text-green-300 opacity-50" />
            <circle cx="700" cy="150" r="120" fill="currentColor" className="text-emerald-300 opacity-40" />
            <circle cx="250" cy="400" r="90" fill="currentColor" className="text-green-200 opacity-60" />
            <circle cx="550" cy="550" r="100" fill="currentColor" className="text-emerald-200 opacity-50" />
            <path d="M50 250 Q150 150 250 250 T450 250 T650 250" stroke="currentColor" strokeWidth="2" className="text-green-300 opacity-30" />
            <path d="M750 300 Q650 400 550 300 T350 300 T150 300" stroke="currentColor" strokeWidth="2" className="text-emerald-300 opacity-20" />
          </svg>
        </div>

        {/* Toast Notification */}
        {toast.show && (
            <div
                className={`fixed top-5 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 transition-all duration-300 ease-out
            ${toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
            >
              {toast.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-semibold">{toast.message}</span>
            </div>
        )}

        {/* Main registration card container */}
        <div className={`w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden my-8 flex flex-col md:flex-row z-10
        ${isDarkMode ? 'bg-gray-800/80 border border-gray-700/30' : 'bg-white/80 border border-white/30 backdrop-blur-xl'}`}>

          {/* Left Half: Reactive Image Animation */}
          <div className="relative flex-1 hidden md:flex items-center justify-center p-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-l-3xl overflow-hidden">
            {/* Abstract pulsating background circles */}
            <div className="absolute inset-0 z-0 flex items-center justify-center">
              <div className="relative w-64 h-64 bg-white/10 rounded-full animate-pulse top-1/4 left-1/4"></div>
              <div className="absolute w-96 h-96 bg-white/5 rounded-full animate-pulse-slow bottom-1/3 right-1/4"></div>
              <div className="absolute w-48 h-48 bg-white/15 rounded-full animate-pulse-delay top-1/2 left-1/3"></div>
            </div>
            {/* Main SVG illustration: Shopping Cart for seller */}
            <div className="relative z-10 text-white text-center flex flex-col items-center">
              <ShoppingCartIcon className="w-40 h-40 md:w-56 md:h-56 animate-bounce-subtle" stroke="white" />
              <h2 className="text-4xl font-extrabold mb-4 text-shadow-lg">Sell Smarter, Grow Faster</h2>
              <p className="text-xl opacity-90 leading-relaxed max-w-sm">Reach more customers and manage your grocery business with ease. Join our platform today!</p>
            </div>
          </div>

          {/* Right Half: Form Content */}
          <div className="w-full md:w-1/2 p-4 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                {/* "Back to Home" link and Dark mode toggle */}
                <div className="flex items-center gap-2">
                  {/* Dark mode toggle */}
                  <button
                      onClick={() => setIsDarkMode(!isDarkMode)}
                      className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      aria-label="Toggle dark mode"
                  >
                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </button>
                  <button
                      onClick={() => navigate('/')}
                      className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors duration-200 font-semibold text-sm"
                  >
                    <Home className="w-4 h-4 mr-1" /> {/* Changed to Home icon */}
                    Home
                  </button>
                </div>

                {/* "Already have an account?" link */}
                {currentStep !== 4 && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Already have an account?{" "}
                      <button
                          onClick={() => navigate('/seller/login')}
                          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 font-semibold transition-colors duration-200"
                      >
                        Sign In
                      </button>
                    </p>
                )}
              </div>

              {currentStep !== 4 && (
                  <>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-50 mb-6 text-center md:text-left">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-700">
                    Register as a Seller
                  </span>
                    </h1>

                    {/* Step progress indicators for 3 steps */}
                    <div className="flex justify-between items-center mb-6 relative px-5">
                      {[1, 2, 3].map((step) => (
                          <div key={step} className="flex-1 flex flex-col items-center z-10">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-all duration-300 ease-in-out
                          ${currentStep === step
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-md transform scale-110 ring-4 ring-offset-2 ring-emerald-400'
                                    : currentStep > step
                                        ? 'bg-green-400 opacity-70'
                                        : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                            >
                              {step === 1 && <User className="w-5 h-5" />}
                              {step === 2 && <Map className="w-5 h-5" />}
                              {step === 3 && <KeyRound className="w-5 h-5" />}
                            </div>
                            <p
                                className={`text-sm mt-2 font-medium transition-colors duration-300 text-center
                          ${currentStep === step ? 'text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}
                            >
                              {step === 1 ? "Personal" : step === 2 ? "Location" : "Security"}
                            </p>
                          </div>
                      ))}
                    </div>
                  </>
              )}

              <form onSubmit={(currentStep === 3) ? handleSubmit : handleNextStep} className="pt-4">
                {renderStepContent()}

                {/* Navigation buttons for multi-step form */}
                {currentStep !== 4 && (
                    <div className="mt-8 flex justify-between items-center">
                      {/* Previous Step Button */}
                      {currentStep > 1 && (
                          <button
                              type="button"
                              onClick={handlePreviousStep}
                              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl shadow-md hover:shadow-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center"
                          >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Back
                          </button>
                      )}
                      {/* Next Step / Register Now Button */}
                      {currentStep < 3 && (
                          <button
                              type="submit"
                              className={`ml-auto px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:from-emerald-700 hover:to-green-600 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center
                        ${currentStep === 1 ? 'w-full md:w-auto' : ''}`}
                              disabled={isLoading}
                          >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            ) : (
                                <>
                                  Next Step <ArrowRight className="w-5 h-5 ml-2" />
                                </>
                            )}
                          </button>
                      )}

                      {currentStep === 3 && (
                          <button
                              type="submit"
                              className="ml-auto px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:from-emerald-700 hover:to-green-600 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center"
                              disabled={isLoading}
                          >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            ) : (
                                "Register Now"
                            )}
                          </button>
                      )}
                    </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
  );
};

export default SellerRegister;