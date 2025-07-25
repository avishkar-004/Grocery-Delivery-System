import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    Home,
    LogOut,
    Sun,
    Moon,
    Users,
    Package,
    UserCircle,
    CheckCircle,
    AlertCircle,
    LayoutDashboard,
    Edit,
    Save,
    X,
    Camera,
    Trash2,
    Eye,
    EyeOff,
    AlertTriangle,
} from "lucide-react";

const AdminLayout = ({ children }) => {
    const navigate = useNavigate();
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedMode = localStorage.getItem("theme");
        return savedMode === "dark" ? true : false;
    });
    const [toast, setToast] = useState({ show: false, message: "", type: "" });
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
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

    const profileDropdownRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }, [isDarkMode]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
                setIsProfileDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type: "" }), 7000);
    };

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/profile/me', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                }
            });
            const data = await response.json();

            if (data.success) {
                setProfileData(data.data);
                setEditFormData(data.data);
            } else {
                showToast(data.message || "Failed to fetch profile", "error");
            }
        } catch (error) {
            console.error('Fetch profile error:', error);
            showToast("Failed to fetch profile data", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleProfileEdit = () => {
        setIsProfileDropdownOpen(false);
        fetchProfile();
        setShowProfileModal(true);
        setIsEditing(false);
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
        try {
            setLoading(true);
            const response = await fetch('/api/profile/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                },
                body: JSON.stringify(editFormData)
            });

            const data = await response.json();

            if (data.success) {
                setProfileData(editFormData);
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

        try {
            setLoading(true);
            const response = await fetch('/api/profile/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                },
                body: JSON.stringify({
                    current_password: passwordForm.current_password,
                    new_password: passwordForm.new_password
                })
            });

            const data = await response.json();

            if (data.success) {
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

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            setLoading(true);
            const response = await fetch('/api/profile/upload-avatar', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                },
                body: formData
            });

            const data = await response.json();

            if (data.success) {
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

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            showToast("Please enter your password", "error");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('/api/profile/delete-account', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                },
                body: JSON.stringify({ password: deletePassword })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.removeItem("admin_token");
                localStorage.removeItem("admin_user");
                navigate("/admin/login");
                showToast("Account deleted successfully", "success");
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

    const handleLogout = async () => {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                },
            });

            const data = await response.json();

            if (data.success) {
                localStorage.removeItem("admin_token");
                localStorage.removeItem("admin_user");
                navigate("/admin/login");
                showToast("Logged out successfully.", "success");
            } else {
                showToast(data.message || "Logout failed.", "error");
            }
        } catch (error) {
            console.error('Logout error:', error);
            showToast("Logout failed due to network error.", "error");
        } finally {
            setIsProfileDropdownOpen(false);
        }
    };

    const childrenWithProps = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            return React.cloneElement(child, { isDarkMode, showToast, handleLogout });
        }
        return child;
    });

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 to-purple-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300 relative">
            {/* Toast Notification */}
            {toast.show && (
                <div
                    className={`fixed top-5 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 transition-all duration-300 ease-out animate-slideInDown
                        ${toast.type === "success" ? "bg-purple-500 text-white" : "bg-red-500 text-white"}`}
                >
                    {toast.type === "success" ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : (
                        <AlertCircle className="w-5 h-5" />
                    )}
                    <span className="font-semibold">{toast.message}</span>
                </div>
            )}

            {/* Top Navbar */}
            <nav className="bg-purple-700 dark:bg-gray-900 shadow-xl p-4 flex items-center justify-between sticky top-0 z-40 transition-colors duration-300">
                {/* Left Section: Dashboard Title */}
                <div className="flex items-center space-x-4">
                    <h1 className="text-2xl font-extrabold text-white">
                        Admin Panel
                    </h1>
                </div>

                {/* Center Section: Nav Items */}
                <div className="flex space-x-8">
                    <button
                        onClick={() => navigate("/admin/dashboard")}
                        className="flex items-center space-x-2 text-white text-lg font-medium hover:text-purple-200 transition-colors duration-200 group"
                    >
                        <LayoutDashboard className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>Dashboard</span>
                    </button>
                    <button
                        onClick={() => navigate("/admin/products")}
                        className="flex items-center space-x-2 text-white text-lg font-medium hover:text-purple-200 transition-colors duration-200 group"
                    >
                        <Package className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>Products</span>
                    </button>
                    <button
                        onClick={() => navigate("/admin/users")}
                        className="flex items-center space-x-2 text-white text-lg font-medium hover:text-purple-200 transition-colors duration-200 group"
                    >
                        <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>Users</span>
                    </button>
                </div>

                {/* Right Section: Utility Buttons and Profile Dropdown */}
                <div className="flex items-center space-x-4 relative">
                    {/* Dark/Light Mode Toggle */}
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="p-2 rounded-full text-white hover:bg-purple-600 dark:hover:bg-gray-700 transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        aria-label="Toggle dark mode"
                    >
                        {isDarkMode ? <Sun className="w-6 h-6 animate-spinOnce" /> : <Moon className="w-6 h-6 animate-spinOnce" />}
                    </button>
                    {/* Go to Home */}
                    <button
                        onClick={() => navigate("/")}
                        className="p-2 rounded-full text-white hover:bg-purple-600 dark:hover:bg-gray-700 transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        aria-label="Go to Home"
                    >
                        <Home className="w-6 h-6" />
                    </button>

                    {/* Profile Icon and Dropdown */}
                    <div className="relative" ref={profileDropdownRef}>
                        <button
                            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                            className="p-2 rounded-full text-white hover:bg-purple-600 dark:hover:bg-gray-700 transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            aria-label="Profile menu"
                        >
                            <UserCircle className="w-6 h-6" />
                        </button>
                        {isProfileDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 transform origin-top-right transition-all duration-200 scale-95 opacity-0 animate-scaleIn">
                                <button
                                    onClick={() => navigate("/admin/profile")}
                                    className="flex items-center w-full px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Profile

                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center w-full px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Profile Modal */}
            {showProfileModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                                {isEditing ? 'Edit Profile' : 'Profile'}
                            </h2>
                            <button
                                onClick={() => setShowProfileModal(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                disabled={loading}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {loading && (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                                </div>
                            )}

                            {!loading && (
                                <>
                                    {/* Profile Picture Section */}
                                    <div className="flex items-center space-x-6">
                                        <div className="relative">
                                            <img
                                                src={profileData.profile_pic || '/api/placeholder/100/100'}
                                                alt="Profile"
                                                className="w-24 h-24 rounded-full object-cover border-4 border-purple-200"
                                            />
                                            {isEditing && (
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 transition-colors"
                                                >
                                                    <Camera className="w-4 h-4" />
                                                </button>
                                            )}
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

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleAvatarUpload}
                                        accept="image/*"
                                        className="hidden"
                                    />

                                    {/* Profile Information */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Name
                                            </label>
                                            {isEditing ? (
                                                <input
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
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Email
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={editFormData.email || ''}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                />
                                            ) : (
                                                <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-800 dark:text-white">
                                                    {profileData.email || 'Not provided'}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Phone
                                            </label>
                                            {isEditing ? (
                                                <input
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

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Role
                                            </label>
                                            <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-800 dark:text-white">
                                                {profileData.role || 'admin'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap gap-3">
                                        {!isEditing ? (
                                            <>
                                                <button
                                                    onClick={handleEditToggle}
                                                    className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                    <span>Edit Profile</span>
                                                </button>
                                                <button
                                                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                                                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                                                >
                                                    <span>Change Password</span>
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={handleSaveProfile}
                                                    disabled={loading}
                                                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                                                >
                                                    <Save className="w-4 h-4" />
                                                    <span>Save Changes</span>
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
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
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
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
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
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
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
                </div>
            )}

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

            {/* Main content area */}
            <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                {childrenWithProps}
            </main>

            {/* Tailwind CSS keyframes for animations */}
            <style jsx>{`
                @keyframes slideInDown {
                    from {
                        transform: translate(-50%, -100px);
                        opacity: 0;
                    }
                    to {
                        transform: translate(-50%, 0);
                        opacity: 1;
                    }
                }
                .animate-slideInDown {
                    animation: slideInDown 0.5s ease-out forwards;
                }

                @keyframes scaleIn {
                    from {
                        transform: scale(0.95);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                .animate-scaleIn {
                    animation: scaleIn 0.2s ease-out forwards;
                }

                @keyframes spinOnce {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
                .animate-spinOnce {
                    animation: spinOnce 0.5s ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default AdminLayout;