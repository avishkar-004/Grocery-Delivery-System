import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { updateProfile, changePassword } from '../../services/auth.service';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import '../../styles/profile.css';

const Profile = () => {
  const { currentUser } = useContext(AuthContext);
  
  const [activeTab, setActiveTab] = useState('personal');
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState({
    label: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    isDefault: false,
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Prepopulate form with user data
  useEffect(() => {
    if (currentUser) {
      setPersonalInfo({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
      });
      
      // In a real app, addresses would be fetched from the API
      // For demo, we'll use mock data
      setAddresses([
        {
          id: '1',
          label: 'Home',
          addressLine1: '123 Main St',
          addressLine2: 'Apt 4B',
          city: 'Brooklyn',
          state: 'NY',
          zipCode: '11201',
          isDefault: true,
        },
        {
          id: '2',
          label: 'Work',
          addressLine1: '456 Park Ave',
          addressLine2: 'Floor 8',
          city: 'New York',
          state: 'NY',
          zipCode: '10022',
          isDefault: false,
        },
      ]);
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
  
  const handleNewAddressChange = (e) => {
    const { name, value } = e.target;
    setNewAddress(prev => ({ ...prev, [name]: value }));
    
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
  
  const handleDefaultAddressChange = (e, addressId) => {
    const isDefault = e.target.checked;
    
    if (isDefault) {
      // Update addresses to set the selected one as default and others as not default
      setAddresses(prev => 
        prev.map(address => ({
          ...address,
          isDefault: address.id === addressId,
        }))
      );
    }
  };
  
  const handleDefaultNewAddressChange = (e) => {
    setNewAddress(prev => ({ ...prev, isDefault: e.target.checked }));
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
  
  const validateNewAddress = () => {
    const newErrors = {};
    
    if (!newAddress.label.trim()) {
      newErrors.label = 'Address label is required';
    }
    
    if (!newAddress.addressLine1.trim()) {
      newErrors.addressLine1 = 'Address line 1 is required';
    }
    
    if (!newAddress.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!newAddress.state.trim()) {
      newErrors.state = 'State is required';
    }
    
    if (!newAddress.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
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
  
  const handleAddAddress = async (e) => {
    e.preventDefault();
    
    if (!validateNewAddress()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // In a real app, you would send the new address to the API
      // For demo, we'll just update the local state
      const newAddressWithId = {
        ...newAddress,
        id: `address-${Date.now()}`,
      };
      
      if (newAddress.isDefault) {
        // Set all other addresses as not default
        setAddresses(prev => 
          prev.map(address => ({ ...address, isDefault: false }))
        );
      }
      
      setAddresses(prev => [...prev, newAddressWithId]);
      
      // Reset form
      setNewAddress({
        label: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        zipCode: '',
        isDefault: false,
      });
      
      setShowAddressForm(false);
      setSuccessMessage('Address added successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to add address:', error);
      setErrors(prev => ({ 
        ...prev, 
        general: error.message || 'Failed to add address'
      }));
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteAddress = (addressId) => {
    // In a real app, you would send a delete request to the API
    // For demo, we'll just update the local state
    setAddresses(prev => prev.filter(address => address.id !== addressId));
    
    setSuccessMessage('Address deleted successfully');
    setTimeout(() => setSuccessMessage(''), 3000);
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
    <div className="profile-page">
      <div className="page-header">
        <h1>My Profile</h1>
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
          <div className="user-info">
            <div className="user-avatar">
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
            <div className="user-details">
              <h2>{currentUser?.name || 'User'}</h2>
              <p className="user-email">{currentUser?.email || 'user@example.com'}</p>
            </div>
          </div>
          
          <div className="profile-tabs">
            <button
              className={`tab-button ${activeTab === 'personal' ? 'active' : ''}`}
              onClick={() => setActiveTab('personal')}
            >
              <span className="tab-icon">👤</span>
              Personal Information
            </button>
            
            <button
              className={`tab-button ${activeTab === 'addresses' ? 'active' : ''}`}
              onClick={() => setActiveTab('addresses')}
            >
              <span className="tab-icon">📍</span>
              Addresses
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
          
          {activeTab === 'addresses' && (
            <div className="tab-content">
              <div className="section-header">
                <h2 className="section-title">Delivery Addresses</h2>
                <Button 
                  variant={showAddressForm ? 'outline' : 'primary'}
                  size="sm"
                  onClick={() => setShowAddressForm(!showAddressForm)}
                >
                  {showAddressForm ? 'Cancel' : 'Add New Address'}
                </Button>
              </div>
              
              {showAddressForm && (
                <form onSubmit={handleAddAddress} className="address-form">
                  <div className="form-group">
                    <Input
                      label="Address Label (e.g., Home, Work)"
                      name="label"
                      value={newAddress.label}
                      onChange={handleNewAddressChange}
                      error={errors.label}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <Input
                      label="Address Line 1"
                      name="addressLine1"
                      value={newAddress.addressLine1}
                      onChange={handleNewAddressChange}
                      error={errors.addressLine1}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <Input
                      label="Address Line 2 (Optional)"
                      name="addressLine2"
                      value={newAddress.addressLine2}
                      onChange={handleNewAddressChange}
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-column">
                      <Input
                        label="City"
                        name="city"
                        value={newAddress.city}
                        onChange={handleNewAddressChange}
                        error={errors.city}
                        required
                      />
                    </div>
                    
                    <div className="form-column">
                      <Input
                        label="State"
                        name="state"
                        value={newAddress.state}
                        onChange={handleNewAddressChange}
                        error={errors.state}
                        required
                      />
                    </div>
                    
                    <div className="form-column">
                      <Input
                        label="ZIP Code"
                        name="zipCode"
                        value={newAddress.zipCode}
                        onChange={handleNewAddressChange}
                        error={errors.zipCode}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-checkbox">
                    <input
                      type="checkbox"
                      id="isDefault"
                      name="isDefault"
                      checked={newAddress.isDefault}
                      onChange={handleDefaultNewAddressChange}
                    />
                    <label htmlFor="isDefault">Set as default address</label>
                  </div>
                  
                  <div className="form-actions">
                    <Button 
                      type="submit" 
                      variant="primary"
                      isLoading={loading}
                    >
                      Save Address
                    </Button>
                  </div>
                </form>
              )}
              
              <div className="addresses-list">
                {addresses.length === 0 ? (
                  <div className="no-addresses">
                    <p>You don't have any addresses yet.</p>
                  </div>
                ) : (
                  addresses.map(address => (
                    <div key={address.id} className="address-card">
                      <div className="address-header">
                        <h3 className="address-label">{address.label}</h3>
                        <div className="address-actions">
                          <button 
                            className="edit-button"
                            onClick={() => {}}
                          >
                            Edit
                          </button>
                          <button 
                            className="delete-button"
                            onClick={() => handleDeleteAddress(address.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      
                      <div className="address-content">
                        <p>{address.addressLine1}</p>
                        {address.addressLine2 && <p>{address.addressLine2}</p>}
                        <p>{address.city}, {address.state} {address.zipCode}</p>
                      </div>
                      
                      <div className="address-footer">
                        <div className="default-checkbox">
                          <input
                            type="checkbox"
                            id={`default-${address.id}`}
                            checked={address.isDefault}
                            onChange={(e) => handleDefaultAddressChange(e, address.id)}
                          />
                          <label htmlFor={`default-${address.id}`}>Default address</label>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
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

export default Profile;