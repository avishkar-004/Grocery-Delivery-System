import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle,
  ShoppingBag, // Representing a buyer's login, like a shopping bag/cart
  ArrowRight,
  UserPlus, // For register link/button
  ArrowLeft, // For back button in forgot password flow
  Send, // For send OTP
  RefreshCw, // For reset password icon
  Home, // Added Home icon
  Sun, // Sun icon for light mode
  Moon, // Moon icon for dark mode
} from "lucide-react";

// Helper function for password strength check
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

// The main login content component
const BuyerLogin = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    otp: "",
    newPassword: "",
    confirmNewPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [passwordStrength, setPasswordStrength] = useState({ rating: '', tip: '' }); // New state for password strength

  // State to manage the current form mode: 'login', 'sendOtp', 'resetPassword'
  const [formMode, setFormMode] = useState('login'); // Default mode

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('theme');
    return savedMode === 'dark';
  });

  // Apply dark mode class to HTML on load and state change
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 4000);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    // Check password strength when newPassword field changes
    if (field === "newPassword") {
      if (value.length > 0) { // Only check if there's input
        const strength = checkPasswordStrengthLocally(value);
        setPasswordStrength(strength);
      } else {
        setPasswordStrength({ rating: '', tip: '' }); // Clear strength if input is empty
      }
    }
  };

  // --- Validation Functions ---
  const validateLoginForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "A valid email address is required.";
      isValid = false;
    }
    if (!formData.password.trim()) {
      newErrors.password = "Password is required.";
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
      isValid = false;
    }
    setErrors(newErrors);
    return isValid;
  };

  const validateSendOtpForm = () => {
    const newErrors = {};
    let isValid = true;
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "A valid email address is required.";
      isValid = false;
    }
    setErrors(newErrors);
    return isValid;
  };

  const validateResetPasswordForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!formData.otp.trim() || formData.otp.length !== 6) {
      newErrors.otp = "A 6-digit OTP is required.";
      isValid = false;
    }

    // Use local password strength checker
    const passwordStrengthResult = checkPasswordStrengthLocally(formData.newPassword);
    if (passwordStrengthResult.rating !== 'strong') {
      newErrors.newPassword = passwordStrengthResult.tip;
      isValid = false;
    }


    if (formData.newPassword !== formData.confirmNewPassword) {
      newErrors.confirmNewPassword = "Passwords do not match.";
      isValid = false;
    }
    setErrors(newErrors);
    return isValid;
  };

  // --- API Call Handlers ---
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!validateLoginForm()) {
      showToast("Please correct the errors in the form.", "error");
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const loginData = {
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        role: "buyer",
      };

      console.log("Sending login request:", loginData);
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();
      console.log("Login response:", data);

      if (response.ok) { // Status 200-299
        showToast("Login successful! Redirecting...", "success");
        if (data.data?.token) {
          localStorage.setItem("buyer_token", data.data.token);
          localStorage.setItem("buyer_user", JSON.stringify(data.data.user));
        }
        navigate("/buyer/dashboard");
      } else {
        // Handle errors based on status code
        if ( data.message.is_active === 0) { // 403 Forbidden for suspended
          showToast(data.message || "Your account has been suspended. Please contact support.", "error");
        } else if (response.status === 401) { // 401 Unauthorized for invalid credentials
          showToast(data.message || "Invalid credentials. Please check your email and password.", "error");
        } else { // Other errors
          showToast(data.message || "An unexpected error occurred.", "error");
        }
      }
    } catch (error) {
      console.error("Login network error:", error);
      showToast("Network error. Could not connect to server. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!validateSendOtpForm()) {
      showToast("Please enter a valid email address.", "error");
      return;
    }

    setIsLoading(true);
    setErrors({});
    try {
      const response = await fetch("http://localhost:3000/api/auth/send-password-reset-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: formData.email.toLowerCase().trim(), role: "buyer" }),
      });
      const data = await response.json();

      if (data.success) {
        showToast(data.message || "OTP sent to your email!", "success");
        setFormMode('resetPassword'); // Move to Reset Password step
      } else {
        showToast(data.message || "Failed to send OTP. Please try again.", "error");
      }
    } catch (error) {
      console.error("Send OTP network error:", error);
      showToast("Network error. Could not connect to server. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!validateResetPasswordForm()) {
      showToast("Please fill in all fields correctly.", "error");
      return;
    }

    setIsLoading(true);
    setErrors({});
    try {
      const response = await fetch("http://localhost:3000/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.toLowerCase().trim(),
          otp: formData.otp,
          new_password: formData.newPassword,
          role: "buyer",
        }),
      });
      const data = await response.json();

      if (data.success) {
        showToast("Password reset successfully! Redirecting to login...", "success");
        setTimeout(() => {
          setFormMode('login'); // Go back to login form
          // Clear password fields after successful reset for security
          setFormData(prev => ({ ...prev, password: '', newPassword: '', confirmNewPassword: '', otp: '' }));
          setPasswordStrength({ rating: '', tip: '' }); // Clear password strength display
        }, 2000); // 2-second delay
      } else {
        showToast(data.message || "Password reset failed. Invalid OTP or other error.", "error");
      }
    } catch (error) {
      console.error("Reset password network error:", error);
      showToast("Network error. Could not connect to server. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to navigate back based on current form mode
  const handleGoBack = () => {
    if (formMode === 'sendOtp') {
      setFormMode('login');
    } else if (formMode === 'resetPassword') {
      setFormMode('sendOtp');
    }
    setErrors({}); // Clear errors when navigating back
    setPasswordStrength({ rating: '', tip: '' }); // Clear strength when going back
  };

  // Helper to get strength text color
  const getStrengthTextColor = (rating) => {
    switch (rating) {
      case 'strong':
        return 'text-green-500 dark:text-green-400';
      case 'medium':
        return 'text-yellow-500 dark:text-yellow-400';
      case 'weak':
        return 'text-red-500 dark:text-red-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  // --- Render Forms Based on Mode ---
  const renderFormContent = () => {
    switch (formMode) {
      case 'login':
        return (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-8 text-center animate-fade-in-up">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-700">
                Sign In to FreshMarket
              </span>
              </h1>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300 sr-only">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors duration-200" />
                  <input
                      id="email"
                      type="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className={`w-full pl-12 pr-4 py-3.5 rounded-full border border-gray-300 dark:border-gray-600 transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-blue-200 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-gray-100 dark:bg-gray-700 hover:border-blue-400 dark:hover:border-blue-500
                    ${errors.email ? "border-red-400 focus:border-red-600 bg-red-50 dark:bg-red-900/20" : ""} animate-input-slide`}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-sm mt-1 animate-fade-in">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300 sr-only">Password</label>
                <div className="relative group">
                  <KeyRound className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors duration-200" />
                  <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className={`w-full pl-12 pr-12 py-3.5 rounded-full border border-gray-300 dark:border-gray-600 transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-blue-200 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-gray-100 dark:bg-gray-700 hover:border-blue-400 dark:hover:border-blue-500
                    ${errors.password ? "border-red-400 focus:border-red-600 bg-red-50 dark:bg-red-900/20" : ""} animate-input-slide`}
                  />
                  <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 animate-icon-bounce-subtle"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-sm mt-1 animate-fade-in">{errors.password}</p>}
              </div>

              <div className="flex justify-end items-center text-sm mt-4">
                <button
                    type="button"
                    onClick={() => setFormMode('sendOtp')}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors duration-200"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 mt-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-700 text-white font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl hover:from-cyan-700 hover:to-blue-600 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2 animate-button-pop"
              >
                {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Logging In...</span>
                    </>
                ) : (
                    <>
                      <span>SIGN IN</span>
                      <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                    </>
                )}
              </button>
            </form>
        );
      case 'sendOtp':
        return (
            <form onSubmit={handleSendOtp} className="space-y-6 animate-fade-in pt-16">
              <button
                  type="button"
                  onClick={handleGoBack}
                  className="absolute top-6 left-6 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors duration-200 flex items-center text-sm font-semibold z-30"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </button>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8 text-center animate-fade-in-up">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-700">
                Forgot Password?
              </span>
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-center mb-6 animate-fade-in">
                Enter your email to receive a password reset code.
              </p>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300 sr-only">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors duration-200" />
                  <input
                      id="email"
                      type="email"
                      placeholder="Your Email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className={`w-full pl-12 pr-4 py-3.5 rounded-full border border-gray-300 dark:border-gray-600 transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-blue-200 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-gray-100 dark:bg-gray-700 hover:border-blue-400 dark:hover:border-blue-500
                    ${errors.email ? "border-red-400 focus:border-red-600 bg-red-50 dark:bg-red-900/20" : ""} animate-input-slide`}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-sm mt-1 animate-fade-in">{errors.email}</p>}
              </div>

              <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 mt-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-700 text-white font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl hover:from-cyan-700 hover:to-blue-600 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2 animate-button-pop"
              >
                {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      <span>Send Reset Code</span>
                    </>
                )}
              </button>
            </form>
        );
      case 'resetPassword':
        return (
            <form onSubmit={handleResetPassword} className="space-y-6 animate-fade-in pt-16">
              <button
                  type="button"
                  onClick={handleGoBack}
                  className="absolute top-6 left-6 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors duration-200 flex items-center text-sm font-semibold z-30"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </button>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8 text-center animate-fade-in-up">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-700">
                Reset Password
              </span>
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-center mb-6 animate-fade-in">
                Enter the code from your email and your new password.
              </p>

              <div className="space-y-2">
                <label htmlFor="otp" className="text-sm font-semibold text-gray-700 dark:text-gray-300 sr-only">OTP</label>
                <div className="relative group">
                  <KeyRound className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors duration-200" />
                  <input
                      id="otp"
                      type="text"
                      placeholder="6-digit OTP"
                      value={formData.otp}
                      onChange={(e) => handleInputChange("otp", e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength="6"
                      inputMode="numeric"
                      className={`w-full pl-12 pr-4 py-3.5 rounded-full border border-gray-300 dark:border-gray-600 transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-blue-200 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-gray-100 dark:bg-gray-700 hover:border-blue-400 dark:hover:border-blue-500
                    ${errors.otp ? "border-red-400 focus:border-red-600 bg-red-50 dark:bg-red-900/20" : ""} animate-input-slide`}
                  />
                </div>
                {errors.otp && <p className="text-red-500 text-sm mt-1 animate-fade-in">{errors.otp}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-semibold text-gray-700 dark:text-gray-300 sr-only">New Password</label>
                <div className="relative group">
                  <KeyRound className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors duration-200" />
                  <input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="New Password"
                      value={formData.newPassword}
                      onChange={(e) => handleInputChange("newPassword", e.target.value)}
                      className={`w-full pl-12 pr-12 py-3.5 rounded-full border border-gray-300 dark:border-gray-600 transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-blue-200 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-gray-100 dark:bg-gray-700 hover:border-blue-400 dark:hover:border-blue-500
                    ${errors.newPassword ? "border-red-400 focus:border-red-600 bg-red-50 dark:bg-red-900/20" : ""} animate-input-slide`}
                  />
                  <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 animate-icon-bounce-subtle"
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.newPassword ? (
                    <p className="text-red-500 text-sm mt-1 animate-fade-in">{errors.newPassword}</p>
                ) : (
                    passwordStrength.rating && (
                        <p className={`text-sm mt-1 animate-fade-in ${getStrengthTextColor(passwordStrength.rating)}`}>
                          Password Strength: <span className="capitalize font-semibold">{passwordStrength.rating}</span>. {passwordStrength.tip}
                        </p>
                    )
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmNewPassword" className="text-sm font-semibold text-gray-700 dark:text-gray-300 sr-only">Confirm New Password</label>
                <div className="relative group">
                  <KeyRound className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors duration-200" />
                  <input
                      id="confirmNewPassword"
                      type={showConfirmNewPassword ? "text" : "password"}
                      placeholder="Confirm New Password"
                      value={formData.confirmNewPassword}
                      onChange={(e) => handleInputChange("confirmNewPassword", e.target.value)}
                      className={`w-full pl-12 pr-12 py-3.5 rounded-full border border-gray-300 dark:border-gray-600 transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-blue-200 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-gray-100 dark:bg-gray-700 hover:border-blue-400 dark:hover:border-blue-500
                    ${errors.confirmNewPassword ? "border-red-400 focus:border-red-600 bg-red-50 dark:bg-red-900/20" : ""} animate-input-slide`}
                  />
                  <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 animate-icon-bounce-subtle"
                      aria-label={showConfirmNewPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmNewPassword && <p className="text-red-500 text-sm mt-1 animate-fade-in">{errors.confirmNewPassword}</p>}
              </div>

              <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 mt-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-700 text-white font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl hover:from-cyan-700 hover:to-blue-600 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2 animate-button-pop"
              >
                {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Resetting Password...</span>
                    </>
                ) : (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2" />
                      <span>Reset Password</span>
                    </>
                )}
              </button>
            </form>
        );
      default:
        return null;
    }
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-inter overflow-hidden relative transition-colors duration-300">
        {/* Subtle Full-page Background: Single gradient overlay (white to mild blue) */}
        {/* This div now acts as the sole, subtle background for the entire page */}
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-gray-950 dark:to-gray-850 opacity-90 transition-colors duration-300"></div>

        {/* Dark Mode Toggle */}
        <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="absolute top-6 right-6 p-3 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-md hover:scale-105 transition-all duration-200 z-20"
            aria-label="Toggle dark mode"
        >
          {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </button>


        {/* Toast Notification */}
        {toast.show && (
            <div
                className={`fixed top-5 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 transition-all duration-300 ease-out
            ${toast.type === "success" ? "bg-blue-500 text-white" : "bg-red-500 text-white"}`}
            >
              {toast.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-semibold">{toast.message}</span>
            </div>
        )}

        {/* Main card container */}
        <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden my-8 flex flex-col md:flex-row z-10 transition-colors duration-300">

          {/* Left Half: Branding and Welcome */}
          <div className="md:w-1/2 p-8 flex flex-col items-center justify-center bg-gradient-to-br from-blue-700 to-indigo-800 text-white text-center
          rounded-l-3xl rounded-r-none md:rounded-r-none rounded-b-3xl md:rounded-b-none relative overflow-hidden">

            <div className="w-28 h-28 bg-white/20 rounded-full flex items-center justify-center mb-6 shadow-xl animate-scale-in-subtle z-10">
              <ShoppingBag className="w-16 h-16 text-white transform rotate-6" />
            </div>
            <h2 className="text-4xl font-extrabold mb-4 text-shadow-lg animate-fade-in-up z-10">
              Welcome to <br />FreshMarket
            </h2>
            <p className="text-lg opacity-90 leading-relaxed max-w-sm mb-8 animate-fade-in z-10">
              Your daily dose of fresh groceries, delivered to your doorstep.
            </p>

            {/* Buttons container for Home and Sign Up - now below the paragraph */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full max-w-sm justify-center items-center z-10 mt-6"> {/* Adjusted mt-6 for spacing */}
              <button
                  onClick={() => navigate("/")}
                  className="w-full sm:w-auto py-3.5 px-6 border-2 border-white text-white font-bold text-lg rounded-full shadow-lg hover:shadow-xl hover:bg-white hover:text-blue-700 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2 group"
              >
                <Home className="w-5 h-5 transition-transform duration-300 group-hover:rotate-6" />
                <span>HOME</span>
              </button>
              <button
                  onClick={() => navigate("/buyer/register")}
                  className="w-full sm:w-auto py-3.5 px-6 border-2 border-white text-white font-bold text-lg rounded-full shadow-lg hover:shadow-xl hover:bg-white hover:text-blue-700 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2 group"
              >
                <UserPlus className="w-5 h-5 transition-transform duration-300 group-hover:rotate-6" />
                <span>SIGN UP</span>
                <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </div>
          </div>

          {/* Right Half: Dynamic Form Content (Login / Forgot Password) */}
          <div className="md:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-white dark:bg-gray-800
          rounded-r-3xl rounded-l-none md:rounded-l-none rounded-t-3xl md:rounded-t-none relative transition-colors duration-300">
            {renderFormContent()}
          </div>
        </div>

        {/* Tailwind CSS animations and custom keyframes */}
        <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes scaleInSubtle {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes bounce-subtle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
        }
        @keyframes inputSlide {
            from { transform: translateX(-10px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes buttonPop {
            0% { transform: scale(0.98); }
            50% { transform: scale(1.02); }
            100% { transform: scale(1); }
        }
        @keyframes iconBounceSubtle {
            0%, 100% { transform: translateY(-50%); }
            25% { transform: translateY(-60%); }
            50% { transform: translateY(-50%); }
            75% { transform: translateY(-40%); }
        }

        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
        .animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
        .animate-scale-in { animation: scaleIn 0.7s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards; }
        .animate-scale-in-subtle { animation: scaleInSubtle 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
        .animate-bounce-subtle { animation: bounce-subtle 3s infinite ease-in-out; }

        .animate-input-slide { animation: inputSlide 0.5s ease-out forwards; animation-delay: 0.2s; }
        .animate-button-pop { animation: buttonPop 0.4s ease-out; }
        .animate-icon-bounce-subtle { animation: iconBounceSubtle 2s infinite ease-in-out; }

        .text-shadow-lg {
            text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.2);
        }
      `}</style>
      </div>
  );
};

export default BuyerLogin;
