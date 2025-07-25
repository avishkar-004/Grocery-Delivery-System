import React, { useState, useEffect } from 'react';
import { User, Edit3, Camera, Lock, Trash2, Save, X, MapPin, Phone, Calendar, Mail } from 'lucide-react';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [deletePassword, setDeletePassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Replace with your actual API base URL
  const API_BASE = 'http://localhost:3000/api';

  // Get auth token from localStorage (adjust based on your auth implementation)
  const getAuthToken = () => {
    return localStorage.getItem('buyer_token') || '';
  };

  // API call helper - matches your backend response structure
  const apiCall = async (endpoint, options = {}) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'API call failed');
    }
    return data;
  };

  // Load user profile
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await apiCall('/profile/me');
      setUser(response.data);
      setFormData(response.data);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const handleUpdateProfile = async () => {
    if (!editMode) return;
    
    try {
      // Only send fields that have values
      const updateData = {};
      if (formData.name && formData.name.trim()) updateData.name = formData.name.trim();
      if (formData.phone && formData.phone.trim()) updateData.phone = formData.phone.trim();
      if (formData.gender) updateData.gender = formData.gender;
      if (formData.date_of_birth) updateData.date_of_birth = formData.date_of_birth;
      if (formData.address && formData.address.trim()) updateData.address = formData.address.trim();
      if (formData.latitude !== undefined && formData.latitude !== '') updateData.latitude = formData.latitude;
      if (formData.longitude !== undefined && formData.longitude !== '') updateData.longitude = formData.longitude;

      await apiCall('/profile/update', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      
      setUser({ ...user, ...updateData });
      setEditMode(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  // Change password
  const handleChangePassword = async () => {
  // Basic frontend validation
  if (passwordData.new_password !== passwordData.confirm_password) {
    setMessage({ type: 'error', text: 'New passwords do not match' });
    return;
  }
  
  if (passwordData.new_password.length < 6) {
    setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
    return;
  }
  
  // Check if current password is provided
  if (!passwordData.current_password) {
    setMessage({ type: 'error', text: 'Current password is required' });
    return;
  }
  
  try {
    // Get the appropriate token based on user role
    const token = localStorage.getItem('buyer_token') || 
                  localStorage.getItem('seller_token') || 
                  localStorage.getItem('admin_token');
    
    if (!token) {
      setMessage({ type: 'error', text: 'Please log in again' });
      return;
    }
    
    const response = await fetch('http://localhost:3000/api/profile/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    
    // Reset form and show success
    setShowPasswordModal(false);
    setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    setMessage({ type: 'success', text: 'Password changed successfully!' });
    
  } catch (error) {
    console.error('Password change error:', error);
    setMessage({ type: 'error', text: error.message || 'Failed to change password' });
  }
};

  // Upload avatar
 const handleAvatarUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('avatar', file);

  try {
    const token = getAuthToken(); // Ensure this returns the correct token (buyer/seller/admin)
    
    const response = await fetch(`${API_BASE}/profile/upload-avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // ✅ Do NOT set 'Content-Type' when using FormData — the browser will handle it
      },
      body: formData
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) throw new Error(data.message);

    // ✅ Update profile_pic in user state
    setUser(prev => ({ ...prev, profile_pic: data.data.profilePic }));
    setMessage({ type: 'success', text: 'Profile picture updated!' });
  } catch (error) {
    console.error('Avatar upload error:', error);
    setMessage({ type: 'error', text: error.message });
  }
};

  // Delete account
  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setMessage({ type: 'error', text: 'Password is required' });
      return;
    }

    try {
      await apiCall('/profile/delete-account', {
        method: 'DELETE',
        body: JSON.stringify({ password: deletePassword })
      });
      
      // Clear auth token and redirect to login
      localStorage.removeItem('authToken');
      setMessage({ type: 'success', text: 'Account deleted successfully' });
      
      // Redirect after short delay to show success message
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Lock size={16} />
                Change Password
              </button>
              <button
                onClick={() => setEditMode(!editMode)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Edit3 size={16} />
                {editMode ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>
        </div>

        {/* Message with auto-dismiss */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-center justify-between ${message.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
            <span>{message.text}</span>
            <button 
              onClick={() => setMessage({ type: '', text: '' })}
              className="ml-4 text-sm underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Picture */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                    {user?.profile_pic ? (
                      <img
                        src={
                          user?.profile_pic
                            ? user.profile_pic.startsWith('http')
                              ? user.profile_pic
                              : `http://localhost:3000${user.profile_pic}`
                            : undefined
                        }
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={48} className="text-gray-400" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                    <Camera size={16} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{user?.name}</h3>
                <p className="text-gray-600">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name - always shown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        disabled={!editMode}
                        className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                  </div>

                  {/* Email - only for admin */}
                  {user?.role === 'admin' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="pl-10 w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                    </div>
                  )}

                  {/* Phone - all roles */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        disabled={!editMode}
                        className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                  </div>

                  {/* Gender - all roles */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                    <select
                      value={formData.gender || ''}
                      onChange={(e) => setFormData({...formData, gender: e.target.value})}
                      disabled={!editMode}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Date of Birth - all roles */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="date"
                        value={formData.date_of_birth || ''}
                        onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                        disabled={!editMode}
                        className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                  </div>

                  {/* Address, Latitude, Longitude - only for seller */}
                  {user?.role === 'seller' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <textarea
                            value={formData.address || ''}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            disabled={!editMode}
                            rows={3}
                            className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                        <input
                          type="number"
                          step="any"
                          value={formData.latitude || ''}
                          onChange={(e) => setFormData({...formData, latitude: parseFloat(e.target.value)})}
                          disabled={!editMode}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                        <input
                          type="number"
                          step="any"
                          value={formData.longitude || ''}
                          onChange={(e) => setFormData({...formData, longitude: parseFloat(e.target.value)})}
                          disabled={!editMode}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                        />
                      </div>
                    </>
                  )}
                </div>

                {editMode && (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleUpdateProfile}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Save size={16} />
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditMode(false);
                        setFormData(user);
                      }}
                      className="flex items-center gap-2 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-lg shadow-sm p-6 mt-6 border-l-4 border-red-500">
              <h3 className="text-lg font-semibold text-red-600 mb-3">Danger Zone</h3>
              <p className="text-gray-600 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 size={16} />
                Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Change Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Change Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-red-600 mb-4">Delete Account</h3>
              <p className="text-gray-600 mb-4">This action cannot be undone. Please enter your password to confirm.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;