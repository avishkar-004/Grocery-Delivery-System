import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Edit, Save, X, Trash2, Eye, EyeOff, AlertTriangle,
    UserCircle, CheckCircle, AlertCircle, Loader2, Home // Removed Camera import
} from "lucide-react";

const ProfilePage = () => {
    const navigate = useNavigate();
    const [toast, setToast] = useState({ show: false, message: "", type: "" });
    const [profileData, setProfileData] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState({});
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Removed fileInputRef as avatar upload functionality is being removed
    // const fileInputRef = useRef(null);
    const API_BASE = 'http://localhost:3000/api';

    useEffect(() => {
        fetchProfile();
    }, []);

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type: "" }), 7000);
    };

    const getAuthToken = () => {
        return localStorage.getItem('admin_token');
    };

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const token = getAuthToken();
            if (!token) {
                showToast("Authentication token not found. Please log in.", "error");
                navigate('/admin/login');
                return;
            }

            const response = await fetch(`${API_BASE}/profile/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();

            if (response.ok && data.success) {
                // Initialize new fields with default values if they don't exist
                setProfileData({
                    ...data.data,
                    gender: data.data.gender || '',
                    date_of_birth: data.data.date_of_birth ? new Date(data.data.date_of_birth).toISOString().split('T')[0] : '', // Format for date input
                    address: data.data.address || '',
                    latitude: data.data.latitude || '',
                    longitude: data.data.longitude || '',
                });
                setEditFormData({
                    ...data.data,
                    gender: data.data.gender || '',
                    date_of_birth: data.data.date_of_birth ? new Date(data.data.date_of_birth).toISOString().split('T')[0] : '', // Format for date input
                    address: data.data.address || '',
                    latitude: data.data.latitude || '',
                    longitude: data.data.longitude || '',
                });
            } else {
                showToast(data.message || "Failed to fetch profile", "error");
                if (response.status === 401) {
                    localStorage.removeItem('admin_token');
                    navigate('/admin/login');
                }
            }
        } catch (error) {
            console.error('Fetch profile error:', error);
            showToast("Failed to fetch profile data", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleEditToggle = () => {
        if (isEditing) {
            setEditFormData(profileData);
        }
        setIsEditing(!isEditing);
        setShowPasswordForm(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            const token = getAuthToken();
            const currentRole = profileData.role; // Get the current user's role

            // Define allowed fields based on role, matching backend logic
            const allowedFieldsByRole = {
                buyer: ["name", "phone", "gender", "date_of_birth"],
                seller: [
                    "name",
                    "phone",
                    "gender",
                    "date_of_birth",
                    "address",
                    "latitude",
                    "longitude",
                ],
                admin: ["name", "email", "phone"],
            };

            const allowedFields = allowedFieldsByRole[currentRole] || [];
            const filteredEditFormData = {};

            // Filter editFormData to include only allowed fields
            allowedFields.forEach(field => {
                if (editFormData[field] !== undefined) {
                    filteredEditFormData[field] = editFormData[field];
                }
            });

            // If the role is admin, ensure 'email' is included even if not explicitly in editFormData initially,
            // as it's part of the admin's profile but often read-only on frontend.
            if (currentRole === 'admin' && profileData.email !== undefined) {
                filteredEditFormData.email = profileData.email;
            }


            const response = await fetch(`${API_BASE}/profile/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(filteredEditFormData) // Send filtered data
            });
            const data = await response.json();

            if (response.ok && data.success) {
                await fetchProfile();
                setIsEditing(false);
                showToast("Profile updated successfully", "success");
            } else {
                showToast(data.message || "Failed to update profile", "error");
            }
        } catch (error) {
            console.error('Update profile error:', error);
            showToast("Failed to update profile", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordForm.new_password !== passwordForm.confirm_password) {
            showToast("New passwords don't match", "error");
            return;
        }
        if (passwordForm.new_password.length < 6) {
            showToast("New password must be at least 6 characters", "error");
            return;
        }
        setLoading(true);
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE}/profile/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ current_password: passwordForm.current_password, new_password: passwordForm.new_password })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                await fetchProfile();
                setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
                setShowPasswordForm(false);
                showToast("Password changed successfully", "success");
            } else {
                showToast(data.message || "Failed to change password", "error");
            }
        } catch (error) {
            console.error('Change password error:', error);
            showToast("Failed to change password", "error");
        } finally {
            setLoading(false);
        }
    };

    // Removed handleAvatarUpload function as functionality is removed
    /*
    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        setLoading(true);
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE}/profile/upload-avatar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setProfileData(prev => ({ ...prev, profile_pic: data.data.profilePic }));
                showToast("Profile picture updated successfully", "success");
            } else {
                showToast(data.message || "Failed to upload profile picture", "error");
            }
        } catch (error) {
            console.error('Upload avatar error:', error);
            showToast("Failed to upload profile picture", "error");
        } finally {
            setLoading(false);
        }
    };
    */

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            showToast("Please enter your password", "error");
            return;
        }

        setLoading(true);
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE}/profile/delete-account`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ password: deletePassword })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                localStorage.removeItem("admin_token");
                localStorage.removeItem("admin_user");
                showToast("Account deleted successfully", "success");
                navigate("/admin/login");
            } else {
                showToast(data.message || "Failed to delete account", "error");
            }
        } catch (error) {
            console.error('Delete account error:', error);
            showToast("Failed to delete account", "error");
        } finally {
            setLoading(false);
            setShowDeleteConfirm(false);
            setDeletePassword('');
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    // Determine if the current user is an admin
    const isAdmin = profileData.role === 'admin';

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
            {/* Toast Notification */}
            {toast.show && (
                <div
                    className={`fixed top-5 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 transition-all duration-300 ease-out animate-slideInDown
                        ${toast.type === "success" ? "bg-purple-500 text-white" : toast.type === "warning" ? "bg-yellow-500 text-white" : "bg-red-500 text-white"}`}
                >
                    {toast.type === "success" ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : toast.type === "warning" ? (
                        <AlertTriangle className="w-5 h-5" />
                    ) : (
                        <AlertCircle className="w-5 h-5" />
                    )}
                    <span className="font-semibold">{toast.message}</span>
                </div>
            )}

            {/* Profile Content */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                        {isEditing ? 'Edit Profile' : 'My Profile'}
                    </h2>
                    <div className="flex gap-2">
                         {/* Home Button */}
                        <button
                            onClick={() => navigate('/admin/dashboard')}
                            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            <Home className="w-4 h-4" />
                            <span>Home</span>
                        </button>
                        {!isEditing ? (
                            <button
                                onClick={handleEditToggle}
                                className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                            >
                                <Edit className="w-4 h-4" />
                                <span>Edit Profile</span>
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={loading}
                                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>Save</span>
                                </button>
                                <button
                                    onClick={handleEditToggle}
                                    disabled={loading}
                                    className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                    <span>Cancel</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="p-6 space-y-6">
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
                        </div>
                    )}

                    {!loading && (
                        <>
                            {/* Profile Picture Section */}
                            <div className="flex items-center space-x-6">
                                <div className="relative">
                                    <img
                                        src={
                                            profileData.profile_pic
                                                ? profileData.profile_pic.startsWith('http')
                                                    ? profileData.profile_pic
                                                    : `http://localhost:3000${profileData.profile_pic}`
                                                : '/api/placeholder/100/100'
                                        }
                                        alt="Profile"
                                        className="w-24 h-24 rounded-full object-cover" // Removed border classes here
                                    />
                                    {/* Removed Camera button */}
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                                        {profileData.name || 'Admin User'}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        {profileData.email}
                                    </p>
                                    <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                                        {profileData.role || 'admin'}
                                    </span>
                                </div>
                            </div>

                            {/* Removed file input */}
                            {/*
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarUpload}
                                accept="image/*"
                                className="hidden"
                            />
                            */}

                            {/* Profile Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Name
                                    </label>
                                    {isEditing ? (
                                        <input
                                            id="name"
                                            type="text"
                                            name="name"
                                            value={editFormData.name || ''}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    ) : (
                                        <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-800 dark:text-white">
                                            {profileData.name || 'Not provided'}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Email
                                    </label>
                                    {isEditing ? (
                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={editFormData.email || ''}
                                            onChange={handleInputChange}
                                            readOnly={true} // Email is typically not editable
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    ) : (
                                        <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-800 dark:text-white">
                                            {profileData.email || 'Not provided'}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Phone
                                    </label>
                                    {isEditing ? (
                                        <input
                                            id="phone"
                                            type="tel"
                                            name="phone"
                                            value={editFormData.phone || ''}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    ) : (
                                        <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-800 dark:text-white">
                                            {profileData.phone || 'Not provided'}
                                        </p>
                                    )}
                                </div>

                                {/* Conditionally render fields not needed for admin */}
                                {!isAdmin && (
                                    <>
                                        <div>
                                            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Gender
                                            </label>
                                            {isEditing ? (
                                                <select
                                                    id="gender"
                                                    name="gender"
                                                    value={editFormData.gender || ''}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                >
                                                    <option value="">Select Gender</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            ) : (
                                                <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-800 dark:text-white">
                                                    {profileData.gender || 'Not provided'}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Date of Birth
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    id="date_of_birth"
                                                    type="date"
                                                    name="date_of_birth"
                                                    value={editFormData.date_of_birth || ''}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                />
                                            ) : (
                                                <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-800 dark:text-white">
                                                    {profileData.date_of_birth || 'Not provided'}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Address
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    id="address"
                                                    type="text"
                                                    name="address"
                                                    value={editFormData.address || ''}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                />
                                            ) : (
                                                <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-800 dark:text-white">
                                                    {profileData.address || 'Not provided'}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Latitude
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    id="latitude"
                                                    type="number"
                                                    name="latitude"
                                                    value={editFormData.latitude || ''}
                                                    onChange={handleInputChange}
                                                    step="any"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                />
                                            ) : (
                                                <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-800 dark:text-white">
                                                    {profileData.latitude || 'Not provided'}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Longitude
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    id="longitude"
                                                    type="number"
                                                    name="longitude"
                                                    value={editFormData.longitude || ''}
                                                    onChange={handleInputChange}
                                                    step="any"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                />
                                            ) : (
                                                <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-800 dark:text-white">
                                                    {profileData.longitude || 'Not provided'}
                                                </p>
                                            )}
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Role
                                    </label>
                                    <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-800 dark:text-white">
                                        {profileData.role || 'admin'}
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    <span>Change Password</span>
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Delete Account</span>
                                </button>
                            </div>

                            {/* Change Password Form */}
                            {showPasswordForm && (
                                <div className="border-t pt-6 space-y-4">
                                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white">Change Password</h4>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.current ? "text" : "password"}
                                            name="current_password"
                                            placeholder="Current Password"
                                            value={passwordForm.current_password}
                                            onChange={handlePasswordChange}
                                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility('current')}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400"
                                        >
                                            {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.new ? "text" : "password"}
                                            name="new_password"
                                            placeholder="New Password"
                                            value={passwordForm.new_password}
                                            onChange={handlePasswordChange}
                                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility('new')}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400"
                                        >
                                            {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.confirm ? "text" : "password"}
                                            name="confirm_password"
                                            placeholder="Confirm New Password"
                                            value={passwordForm.confirm_password}
                                            onChange={handlePasswordChange}
                                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility('confirm')}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400"
                                        >
                                            {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={handleChangePassword}
                                            disabled={loading}
                                            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
                                        >
                                            Update Password
                                        </button>
                                        <button
                                            onClick={() => setShowPasswordForm(false)}
                                            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Delete Account Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <div className="flex items-center space-x-3 mb-4">
                                <AlertTriangle className="w-8 h-8 text-red-600" />
                                <h3 className="text-xl font-bold text-red-600">Delete Account</h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                This action cannot be undone. This will permanently delete your account and remove all associated data.
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                Please enter your password to confirm deletion:
                            </p>
                            <input
                                type="password"
                                placeholder="Enter your password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-4"
                            />
                            <div className="flex space-x-3 justify-end">
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setDeletePassword('');
                                    }}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={loading || !deletePassword}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Deleting...' : 'Delete Account'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;