import React, { useState, useEffect } from 'react';
import { User, Edit3, Lock, Trash2, Save, X, MapPin, Phone, Calendar, Mail, Loader2, AlertCircle, CheckCircle, LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

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
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertType, setAlertType] = useState('');

  const API_BASE = 'http://localhost:3000/api';

  const getAuthToken = () => {
    return localStorage.getItem('seller_token') || localStorage.getItem('buyer_token') || '';
  };

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
      const errorMessage = data.message || 'API call failed';
      setAlertMessage(errorMessage);
      setAlertType('destructive');
      throw new Error(errorMessage);
    }
    return data;
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setAlertMessage(null);
    setAlertType('');
    try {
      const response = await apiCall('/profile/me');
      const userData = response.data;
      if (userData.date_of_birth) {
        userData.date_of_birth = format(new Date(userData.date_of_birth), 'yyyy-MM-dd');
      }
      const { profile_pic, ...restUserData } = userData;
      setUser(restUserData);
      setFormData(restUserData);
    } catch (error) {
      // Alert message is already set by apiCall
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editMode) return;

    setAlertMessage(null);
    setAlertType('');

    try {
      const updateData = {};
      if (formData.name && formData.name.trim()) updateData.name = formData.name.trim();
      if (formData.phone && formData.phone.trim()) updateData.phone = formData.phone.trim();
      if (formData.gender) updateData.gender = formData.gender;

      if (formData.date_of_birth) {
        updateData.date_of_birth = formData.date_of_birth;
      } else {
        updateData.date_of_birth = null;
      }

      if (formData.address && formData.address.trim()) updateData.address = formData.address.trim();

      if (formData.latitude !== undefined && formData.latitude !== null && formData.latitude !== '') {
        const parsedLat = parseFloat(formData.latitude);
        if (!isNaN(parsedLat)) {
          updateData.latitude = parsedLat;
        } else {
          setAlertMessage("Latitude must be a valid number.");
          setAlertType('destructive');
          setTimeout(() => setAlertMessage(null), 5000);
          return;
        }
      } else {
        updateData.latitude = null;
      }

      if (formData.longitude !== undefined && formData.longitude !== null && formData.longitude !== '') {
        const parsedLon = parseFloat(formData.longitude);
        if (!isNaN(parsedLon)) {
          updateData.longitude = parsedLon;
        } else {
          setAlertMessage("Longitude must be a valid number.");
          setAlertType('destructive');
          setTimeout(() => setAlertMessage(null), 5000);
          return;
        }
      } else {
        updateData.longitude = null;
      }

      await apiCall('/profile/update', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      const updatedUser = { ...user, ...updateData };
      if (updatedUser.date_of_birth) {
        updatedUser.date_of_birth = format(new Date(updatedUser.date_of_birth), 'yyyy-MM-dd');
      }
      setUser(updatedUser);
      setEditMode(false);
      setAlertMessage("Profile updated successfully!");
      setAlertType('success');
      setTimeout(() => setAlertMessage(null), 5000);
    } catch (error) {
      // Error message is already set by apiCall or client-side validation
    }
  };

  const handleChangePassword = async () => {
    setAlertMessage(null);
    setAlertType('');

    if (passwordData.new_password !== passwordData.confirm_password) {
      setAlertMessage("New passwords do not match.");
      setAlertType('destructive');
      setTimeout(() => setAlertMessage(null), 5000);
      return;
    }

    if (passwordData.new_password.length < 6) {
      setAlertMessage("New password must be at least 6 characters.");
      setAlertType('destructive');
      setTimeout(() => setAlertMessage(null), 5000);
      return;
    }

    if (!passwordData.current_password) {
      setAlertMessage("Current password is required.");
      setAlertType('destructive');
      setTimeout(() => setAlertMessage(null), 5000);
      return;
    }

    try {
      const token = getAuthToken();

      if (!token) {
        setAlertMessage("Authentication Error: Please log in again.");
        setAlertType('destructive');
        setTimeout(() => setAlertMessage(null), 5000);
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

      if (!response.ok || !data.success) {
        setAlertMessage(data.message || 'Failed to change password.');
        setAlertType('destructive');
        setTimeout(() => setAlertMessage(null), 5000);
        throw new Error(data.message || 'Something went wrong');
      }

      setShowPasswordModal(false);
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      setAlertMessage("Password changed successfully!");
      setAlertType('success');
      setTimeout(() => setAlertMessage(null), 5000);

    } catch (error) {
      console.error('Password change error:', error);
    }
  };

  const handleDeleteAccount = async () => {
    setAlertMessage(null);
    setAlertType('');

    if (!deletePassword.trim()) {
      setAlertMessage("Password is required to delete account.");
      setAlertType('destructive');
      setTimeout(() => setAlertMessage(null), 5000);
      return;
    }

    try {
      await apiCall('/profile/delete-account', {
        method: 'DELETE',
        body: JSON.stringify({ password: deletePassword })
      });

      localStorage.removeItem('seller_token');
      localStorage.removeItem('user');
      setAlertMessage("Account deleted successfully.");
      setAlertType('success');

      setTimeout(() => {
        window.location.href = '/seller/login';
      }, 2000);
    } catch (error) {
      // Alert message is already set by apiCall
    }
  };

  // --- Geolocation and Reverse Geocoding Functionality ---
  const getCurrentLocation = () => {
    setAlertMessage(null); // Clear any previous alerts
    setAlertType('');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Update latitude and longitude in formData immediately
          setFormData(prevData => ({
            ...prevData,
            latitude: latitude,
            longitude: longitude
          }));

          setAlertMessage("Fetching address...");
          setAlertType('success');

          try {
            // Nominatim API for reverse geocoding
            // Usage Policy: https://operations.osmfoundation.org/policies/nominatim/
            const nominatimApiUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
            const geoResponse = await fetch(nominatimApiUrl, {
              headers: {
                'User-Agent': 'YourAppName/1.0 (your-email@example.com)' // Required by Nominatim policy
              }
            });

            if (!geoResponse.ok) {
              throw new Error(`HTTP error! status: ${geoResponse.status}`);
            }

            const geoData = await geoResponse.json();

            if (geoData.display_name) {
              setFormData(prevData => ({ ...prevData, address: geoData.display_name }));
              setAlertMessage("Location and address fetched successfully!");
              setAlertType('success');
            } else {
              setAlertMessage("Location fetched, but address could not be found. Please enter manually.");
              setAlertType('destructive');
            }
          } catch (geoError) {
            console.error("Reverse geocoding failed:", geoError);
            setAlertMessage("Failed to get address from coordinates. Please enter manually.");
            setAlertType('destructive');
          } finally {
            setTimeout(() => setAlertMessage(null), 5000); // Clear message after 5 seconds
          }
        },
        (error) => {
          let errorMessage = "Failed to fetch location.";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Permission denied: Please allow location access in your browser settings.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage = "The request to get user location timed out.";
              break;
            case error.UNKNOWN_ERROR:
              errorMessage = "An unknown error occurred while fetching location.";
              break;
          }
          setAlertMessage(errorMessage);
          setAlertType('destructive');
          setTimeout(() => setAlertMessage(null), 8000);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setAlertMessage("Geolocation is not supported by your browser.");
      setAlertType('destructive');
      setTimeout(() => setAlertMessage(null), 5000);
    }
  };
  // --- End Geolocation and Reverse Geocoding Functionality ---


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 text-gray-800 dark:text-gray-200">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              My Profile
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowPasswordModal(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Lock size={16} />
                  Change Password
                </Button>
                <Button
                  onClick={() => {
                    setEditMode(!editMode);
                    if (editMode) {
                      const userToSet = { ...user };
                      if (userToSet.date_of_birth) {
                        userToSet.date_of_birth = format(new Date(userToSet.date_of_birth), 'yyyy-MM-dd');
                      }
                      setFormData(userToSet);
                    }
                    setAlertMessage(null);
                    setAlertType('');
                  }}
                  className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white"
                >
                  <Edit3 size={16} />
                  {editMode ? 'Cancel' : 'Edit Profile'}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Picture (now just a placeholder/icon) */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="relative inline-block">
                  <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                    <User size={48} className="text-gray-400 dark:text-gray-500" />
                  </div>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">{user?.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
              </CardContent>
            </Card>
          </div>

          {/* Profile Information */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {/* In-page Alert Display */}
                {alertMessage && (
                  <div className={`p-3 rounded-lg flex items-center gap-2 mb-4 ${
                    alertType === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {alertType === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {alertMessage}
                  </div>
                )}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name - always shown */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <Input
                          type="text"
                          value={formData.name || ''}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          disabled={!editMode}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email - only for admin (kept as per original logic) */}
                  {user?.role === 'admin' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <Input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="pl-10 bg-gray-50 dark:bg-gray-800"
                        />
                      </div>
                    </div>
                  )}

                  {/* Phone - all roles */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        disabled={!editMode}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Gender - all roles */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gender</label>
                    <select
                      value={formData.gender || ''}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      disabled={!editMode}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:disabled:bg-gray-900"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Date of Birth - all roles */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date of Birth</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        type="date"
                        value={formData.date_of_birth || ''}
                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                        disabled={!editMode}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Address, Latitude, Longitude - only for seller */}
                  {user?.role === 'seller' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <Textarea
                            value={formData.address || ''}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            disabled={!editMode}
                            rows={3}
                            className="pl-10"
                          />
                        </div>
                        {editMode && (
                          <Button
                            type="button"
                            onClick={getCurrentLocation}
                            className="mt-2 flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm px-3 py-2"
                          >
                            <LocateFixed size={16} />
                            Get Current Location
                          </Button>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Latitude</label>
                        <Input
                          type="number"
                          step="any"
                          value={formData.latitude === null ? '' : formData.latitude}
                          onChange={(e) => setFormData({ ...formData, latitude: e.target.value === '' ? null : parseFloat(e.target.value) })}
                          disabled={!editMode}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Longitude</label>
                        <Input
                          type="number"
                          step="any"
                          value={formData.longitude === null ? '' : formData.longitude}
                          onChange={(e) => setFormData({ ...formData, longitude: e.target.value === '' ? null : parseFloat(e.target.value) })}
                          disabled={!editMode}
                        />
                      </div>
                    </>
                  )}
                </div>

                {editMode && (
                  <div className="flex gap-3 mt-6">
                    <Button
                      type="button"
                      onClick={handleUpdateProfile}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Save size={16} />
                      Save Changes
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setEditMode(false);
                        const userToSet = { ...user };
                        if (userToSet.date_of_birth) {
                          userToSet.date_of_birth = format(new Date(userToSet.date_of_birth), 'yyyy-MM-dd');
                        }
                        setFormData(userToSet);
                        setAlertMessage(null);
                        setAlertType('');
                      }}
                      className="flex items-center gap-2 px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                    >
                      <X size={16} />
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="mt-6 border-l-4 border-red-500">
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-600 dark:text-gray-400 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                <Button
                  onClick={() => {
                    setShowDeleteModal(true);
                    setAlertMessage(null);
                    setAlertType('');
                  }}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 size={16} />
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* Alert for password modal */}
                {alertMessage && (
                  <div className={`p-3 rounded-lg flex items-center gap-2 mb-4 ${
                    alertType === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {alertType === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {alertMessage}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
                  <Input
                    type="password"
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                  <Input
                    type="password"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
                  <Input
                    type="password"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={handleChangePassword}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Change Password
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setAlertMessage(null);
                      setAlertType('');
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400">Delete Account</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* Alert for delete modal */}
                {alertMessage && (
                  <div className={`p-3 rounded-lg flex items-center gap-2 mb-4 ${
                    alertType === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {alertType === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {alertMessage}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
                  <Input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    Delete Account
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setAlertMessage(null);
                      setAlertType('');
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;