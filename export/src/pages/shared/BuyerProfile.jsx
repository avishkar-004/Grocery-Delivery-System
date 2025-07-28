import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Edit, Save, X, Trash2, Eye, EyeOff, AlertTriangle,
    UserCircle, CheckCircle, AlertCircle, Loader2, Home
} from "lucide-react";

const BuyerProfile = () => {
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

    const API_BASE = 'http://localhost:3000/api'; // Adjust your API base if different

    useEffect(() => {
        fetchProfile();
    }, []);

    // Function to display toast notifications
    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type: "" }), 7000);
    };

    // Function to get the buyer's authentication token from local storage
    const getAuthToken = () => {
        return localStorage.getItem('buyer_token');
    };

    // Function to fetch buyer profile data
    const fetchProfile = async () => {
        setLoading(true);
        try {
            const token = getAuthToken();
            if (!token) {
                showToast("Authentication token not found. Please log in.", "error");
                navigate('/buyer/login'); // Redirect to buyer login page
                return;
            }

            const response = await fetch(`${API_BASE}/profile/me`, { // Updated endpoint
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
                });
                setEditFormData({
                    ...data.data,
                    gender: data.data.gender || '',
                    date_of_birth: data.data.date_of_birth ? new Date(data.data.date_of_birth).toISOString().split('T')[0] : '', // Format for date input
                });
            } else {
                showToast(data.message || "Failed to fetch profile", "error");
                if (response.status === 401) {
                    localStorage.removeItem('buyer_token'); // Clear invalid token
                    navigate('/buyer/login'); // Redirect to buyer login
                }
            }
        } catch (error) {
            console.error('Fetch buyer profile error:', error);
            showToast("Failed to fetch profile data", "error");
        } finally {
            setLoading(false);
        }
    };

    // Function to toggle between view and edit modes
    const handleEditToggle = () => {
        if (isEditing) {
            setEditFormData(profileData); // Reset form data if canceling edit
        }
        setIsEditing(!isEditing);
        setShowPasswordForm(false); // Close password form when toggling edit mode
    };

    // Handler for input changes in the edit form
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handler for password input changes
    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Function to save updated buyer profile
    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            const token = getAuthToken();
            // Define allowed fields for buyer, matching backend logic
            const allowedFields = ["name", "phone", "gender", "date_of_birth"];
            const filteredEditFormData = {};

            // Filter editFormData to include only allowed fields
            allowedFields.forEach(field => {
                if (editFormData[field] !== undefined) {
                    filteredEditFormData[field] = editFormData[field];
                }
            });

            // Special handling for date_of_birth: send null if empty string
            if (filteredEditFormData.date_of_birth === '') {
                filteredEditFormData.date_of_birth = null;
            }

            const response = await fetch(`${API_BASE}/profile/update`, { // Updated endpoint
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(filteredEditFormData) // Send filtered data
            });
            const data = await response.json();

            if (response.ok && data.success) {
                await fetchProfile(); // Re-fetch profile to update UI
                setIsEditing(false); // Exit edit mode
                showToast("Profile updated successfully", "success");
            } else {
                showToast(data.message || "Failed to update profile", "error");
            }
        } catch (error) {
            console.error('Update buyer profile error:', error);
            showToast("Failed to update profile", "error");
        } finally {
            setLoading(false);
        }
    };

    // Function to handle password change
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
            const response = await fetch(`${API_BASE}/profile/change-password`, { // Updated endpoint
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ current_password: passwordForm.current_password, new_password: passwordForm.new_password })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                await fetchProfile(); // Re-fetch profile (optional, but good for consistency)
                setPasswordForm({ current_password: '', new_password: '', confirm_password: '' }); // Clear form
                setShowPasswordForm(false); // Hide password form
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

    // Function to handle account deletion
    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            showToast("Please enter your password", "error");
            return;
        }

        setLoading(true);
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE}/profile/delete-account`, { // Updated endpoint
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ password: deletePassword })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                localStorage.removeItem("buyer_token"); // Clear buyer token
                localStorage.removeItem("buyer_user"); // Clear buyer user data
                showToast("Account deleted successfully", "success");
                navigate("/buyer/login"); // Redirect to buyer login after deletion
            } else {
                showToast(data.message || "Failed to delete account", "error");
            }
        } catch (error) {
            console.error('Delete account error:', error);
            showToast("Failed to delete account", "error");
        } finally {
            setLoading(false);
            setShowDeleteConfirm(false); // Hide confirmation modal
            setDeletePassword(''); // Clear password field
        }
    };

    // Function to toggle password visibility in input fields
    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

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
                        {isEditing ? 'Edit Buyer Profile' : 'My Buyer Profile'}
                    </h2>
                    <div className="flex gap-2">
                         {/* Home Button */}
                        <button
                            onClick={() => navigate('/buyer/dashboard')}
                            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            {/* Navigate to buyer dashboard */}
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
                                            profileData.profile_pic ?
                                            (profileData.profile_pic.startsWith('http') ? profileData.profile_pic : `http://localhost:3000${profileData.profile_pic}`)
                                            : `https://placehold.co/100x100/E0F2F1/000?text=${profileData.name ? profileData.name.charAt(0).toUpperCase() : 'B'}`
                                        }
                                        alt="Profile"
                                        className="w-24 h-24 rounded-full object-cover"
                                    />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                                        {profileData.name || 'Buyer User'}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        {profileData.email}
                                    </p>
                                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                        Buyer
                                    </span>
                                </div>
                            </div>

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
                                            type="text"
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
                            </div>

                            {/* Change Password Section */}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                                    Change Password
                                </h3>
                                {!showPasswordForm ? (
                                    <button
                                        onClick={() => setShowPasswordForm(true)}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                                    >
                                        Change Password
                                    </button>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Current Password
                                            </label>
                                            <input
                                                id="current_password"
                                                type={showPasswords.current ? "text" : "password"}
                                                name="current_password"
                                                value={passwordForm.current_password}
                                                onChange={handlePasswordChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility('current')}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 mt-8"
                                            >
                                                {showPasswords.current ? (
                                                    <EyeOff className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                                ) : (
                                                    <Eye className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                                )}
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                New Password
                                            </label>
                                            <input
                                                id="new_password"
                                                type={showPasswords.new ? "text" : "password"}
                                                name="new_password"
                                                value={passwordForm.new_password}
                                                onChange={handlePasswordChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility('new')}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 mt-8"
                                            >
                                                {showPasswords.new ? (
                                                    <EyeOff className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                                ) : (
                                                    <Eye className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                                )}
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Confirm New Password
                                            </label>
                                            <input
                                                id="confirm_password"
                                                type={showPasswords.confirm ? "text" : "password"}
                                                name="confirm_password"
                                                value={passwordForm.confirm_password}
                                                onChange={handlePasswordChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility('confirm')}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 mt-8"
                                            >
                                                {showPasswords.confirm ? (
                                                    <EyeOff className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                                ) : (
                                                    <Eye className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                                )}
                                            </button>
                                        </div>
                                        <div className="flex space-x-3 justify-end">
                                            <button
                                                onClick={() => {
                                                    setShowPasswordForm(false);
                                                    setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
                                                }}
                                                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleChangePassword}
                                                disabled={loading}
                                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                                            >
                                                {loading ? 'Saving...' : 'Save New Password'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Delete Account Section */}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                                    Delete Account
                                </h3>
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                                >
                                    Delete My Account
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center border-b pb-3 mb-4 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Confirm Account Deletion</h3>
                            <button
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setDeletePassword('');
                                }}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="text-gray-700 dark:text-gray-300 mb-4">
                            <p className="mb-2">
                                Are you sure you want to delete your account? This action cannot be undone.
                            </p>
                            <p className="mb-4 font-semibold">
                                Please enter your password to confirm:
                            </p>
                            <input
                                type="password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                placeholder="Enter your password"
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

export default BuyerProfile;
