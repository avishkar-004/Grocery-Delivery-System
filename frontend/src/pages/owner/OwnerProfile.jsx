import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { updateProfile, changePassword } from '../../services/auth.service';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import '../../styles/owner-profile.css';

const OwnerProfile = () => {
  const { currentUser } = useContext(AuthContext);
  
  const [activeTab, setActiveTab] = useState('shop');
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [shopInfo, setShopInfo] = useState({
    shopName: '',
    shopDescription: '',
    shopAddress: '',
    shopCity: '',
    shopState: '',
    shopZipCode: '',
    deliveryRadius: '10',
    openingTime: '08:00',
    closingTime: '20:00',
    minimumOrder: '10',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  
  // Prepopulate form with user data
  useEffect(() => {
    if (currentUser) {
      setPersonalInfo({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
      });
      
      // In a real app, shop info would be fetched from the API
      // For demo, we'll use mock data
      setShopInfo({
        shopName: 'Fresh Grocers',
        shopDescription: 'We offer the freshest produce, dairy, and meats, sourced from local farms and suppliers.',
        shopAddress: '123 Market St',
        shopCity: 'New York',
        shopState: 'NY',
        shopZipCode: '10001',
        deliveryRadius: '10',
        openingTime: '08:00',
        closingTime: '20:00',
        minimumOrder: '10',
      });
    }
  }, [currentUser]);
  
  const handlePersonalInfoChange = (e) => {
    const { name, value } = e.target;
    setPersonalInfo(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleShopInfoChange = (e) => {
    const { name, value } = e.target;
    setShopInfo(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const validatePersonalInfo = () => {
    const newErrors = {};
    
    if (!personalInfo.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!personalInfo.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(personalInfo.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!personalInfo.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validateShopInfo = () => {
    const newErrors = {};
    
    if (!shopInfo.shopName.trim()) {
      newErrors.shopName = 'Shop name is required';
    }
    
    if (!shopInfo.shopAddress.trim()) {
      newErrors.shopAddress = 'Shop address is required';
    }
    
    if (!shopInfo.shopCity.trim()) {
      newErrors.shopCity = 'City is required';
    }
    
    if (!shopInfo.shopState.trim()) {
      newErrors.shopState = 'State is required';
    }
    
    if (!shopInfo.shopZipCode.trim()) {
      newErrors.shopZipCode = 'ZIP code is required';
    }
    
    if (!shopInfo.deliveryRadius) {
      newErrors.deliveryRadius = 'Delivery radius is required';
    } else if (isNaN(shopInfo.deliveryRadius) || parseInt(shopInfo.deliveryRadius) <= 0) {
      newErrors.deliveryRadius = 'Delivery radius must be a positive number';
    }
    
    if (!shopInfo.minimumOrder) {
      newErrors.minimumOrder = 'Minimum order amount is required';
    } else if (isNaN(shopInfo.minimumOrder) || parseFloat(shopInfo.minimumOrder) < 0) {
      newErrors.minimumOrder = 'Minimum order amount must be a non-negative number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validatePassword = () => {
    const newErrors = {};
    
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleUpdatePersonalInfo = async (e) => {
    e.preventDefault();
    
    if (!validatePersonalInfo()) {
      return;
    }
    
    try {
      setLoading(true);
      await updateProfile(personalInfo);
      
      setSuccessMessage('Personal information updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
      setErrors(prev => ({ 
        ...prev, 
        general: error.message || 'Failed to update profile'
      }));
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateShopInfo = async (e) => {
    e.preventDefault();
    
    if (!validateShopInfo()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // In a real app, you would send the shop info to the API
      // For demo, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccessMessage('Shop information updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to update shop info:', error);
      setErrors(prev => ({ 
        ...prev, 
        general: error.message || 'Failed to update shop information'
      }));
    } finally {
      setLoading(false);
    }
  };
  
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }
    
    try {
      setLoading(true);
      await changePassword(passwordData);
      
      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      setSuccessMessage('Password changed successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to change password:', error);
      setErrors(prev => ({ 
        ...prev, 
        general: error.message || 'Failed to change password'
      }));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="owner-profile-page">
      <div className="page-header">
        <h1>Shop Profile</h1>
      </div>
      
      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}
      
      {errors.general && (
        <div className="error-message">
          {errors.general}
        </div>
      )}
      
      <div className="profile-container">
        <div className="profile-sidebar">
          <div className="shop-info">
            <div className="shop-logo">
              {shopInfo.shopName?.charAt(0) || 'S'}
            </div>
            <div className="shop-details">
              <h2>{shopInfo.shopName || 'My Shop'}</h2>
              <div className="shop-meta">
                <span className="shop-rating">⭐ 4.8</span>
                <span className="shop-orders">120 orders</span>
              </div>
            </div>
          </div>
          
          <div className="profile-tabs">
            <button
              className={`tab-button ${activeTab === 'shop' ? 'active' : ''}`}
              onClick={() => setActiveTab('shop')}
            >
              <span className="tab-icon">🏪</span>
              Shop Information
            </button>
            
            <button
              className={`tab-button ${activeTab === 'personal' ? 'active' : ''}`}
              onClick={() => setActiveTab('personal')}
            >
              <span className="tab-icon">👤</span>
              Personal Information
            </button>
            
            <button
              className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <span className="tab-icon">🔒</span>
              Security
            </button>
          </div>
        </div>
        
        <div className="profile-content">
          {activeTab === 'shop' && (
            <div className="tab-content">
              <h2 className="section-title">Shop Information</h2>
              
              <form onSubmit={handleUpdateShopInfo} className="profile-form">
                <div className="form-group">
                  <Input
                    label="Shop Name"
                    name="shopName"
                    value={shopInfo.shopName}
                    onChange={handleShopInfoChange}
                    error={errors.shopName}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">
                    Shop Description <span className="required">*</span>
                  </label>
                  <textarea
                    name="shopDescription"
                    value={shopInfo.shopDescription}
                    onChange={handleShopInfoChange}
                    className={`form-textarea ${errors.shopDescription ? 'error' : ''}`}
                    rows="3"
                    required
                  ></textarea>
                  {errors.shopDescription && (
                    <div className="form-error">{errors.shopDescription}</div>
                  )}
                </div>
                
                <h3 className="subsection-title">Shop Location</h3>
                
                <div className="form-group">
                  <Input
                    label="Address"
                    name="shopAddress"
                    value={shopInfo.shopAddress}
                    onChange={handleShopInfoChange}
                    error={errors.shopAddress}
                    required
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-column">
                    <Input
                      label="City"
                      name="shopCity"
                      value={shopInfo.shopCity}
                      onChange={handleShopInfoChange}
                      error={errors.shopCity}
                      required
                    />
                  </div>
                  
                  <div className="form-column">
                    <Input
                      label="State"
                      name="shopState"
                      value={shopInfo.shopState}
                      onChange={handleShopInfoChange}
                      error={errors.shopState}
                      required
                    />
                  </div>
                  
                  <div className="form-column">
                    <Input
                      label="ZIP Code"
                      name="shopZipCode"
                      value={shopInfo.shopZipCode}
                      onChange={handleShopInfoChange}
                      error={errors.shopZipCode}
                      required
                    />
                  </div>
                </div>
                
                <h3 className="subsection-title">Shop Settings</h3>
                
                <div className="form-row">
                  <div className="form-column">
                    <Input
                      label="Delivery Radius (km)"
                      type="number"
                      name="deliveryRadius"
                      value={shopInfo.deliveryRadius}
                      onChange={handleShopInfoChange}
                      error={errors.deliveryRadius}
                      required
                      min="1"
                    />
                  </div>
                  
                  <div className="form-column">
                    <Input
                      label="Minimum Order ($)"
                      type="number"
                      name="minimumOrder"
                      value={shopInfo.minimumOrder}
                      onChange={handleShopInfoChange}
                      error={errors.minimumOrder}
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-column">
                    <Input
                      label="Opening Time"
                      type="time"
                      name="openingTime"
                      value={shopInfo.openingTime}
                      onChange={handleShopInfoChange}
                      error={errors.openingTime}
                      required
                    />
                  </div>
                  
                  <div className="form-column">
                    <Input
                      label="Closing Time"
                      type="time"
                      name="closingTime"
                      value={shopInfo.closingTime}
                      onChange={handleShopInfoChange}
                      error={errors.closingTime}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-actions">
                  <Button 
                    type="submit" 
                    variant="primary"
                    isLoading={loading}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          )}
          
          {activeTab === 'personal' && (
            <div className="tab-content">
              <h2 className="section-title">Personal Information</h2>
              
              <form onSubmit={handleUpdatePersonalInfo} className="profile-form">
                <div className="form-group">
                  <Input
                    label="Full Name"
                    name="name"
                    value={personalInfo.name}
                    onChange={handlePersonalInfoChange}
                    error={errors.name}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <Input
                    label="Email"
                    type="email"
                    name="email"
                    value={personalInfo.email}
                    onChange={handlePersonalInfoChange}
                    error={errors.email}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <Input
                    label="Phone Number"
                    type="tel"
                    name="phone"
                    value={personalInfo.phone}
                    onChange={handlePersonalInfoChange}
                    error={errors.phone}
                    required
                  />
                </div>
                
                <div className="form-actions">
                  <Button 
                    type="submit" 
                    variant="primary"
                    isLoading={loading}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          )}
          
          {activeTab === 'security' && (
            <div className="tab-content">
              <h2 className="section-title">Security</h2>
              
              <form onSubmit={handleChangePassword} className="profile-form">
                <div className="form-group">
                  <Input
                    label="Current Password"
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    error={errors.currentPassword}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <Input
                    label="New Password"
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    error={errors.newPassword}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <Input
                    label="Confirm New Password"
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    error={errors.confirmPassword}
                    required
                  />
                </div>
                
                <div className="password-requirements">
                  <h4>Password Requirements:</h4>
                  <ul>
                    <li>At least 6 characters long</li>
                    <li>Include at least one uppercase letter</li>
                    <li>Include at least one number</li>
                    <li>Include at least one special character</li>
                  </ul>
                </div>
                
                <div className="form-actions">
                  <Button 
                    type="submit" 
                    variant="primary"
                    isLoading={loading}
                  >
                    Change Password
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerProfile;