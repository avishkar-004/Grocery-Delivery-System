import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate hook
import {
    Sun,
    Moon,
    ShoppingCart,
    Menu,
    X,
    ChevronDown,
} from 'lucide-react';

// This component represents the Buyer Dashboard Navbar.
// It includes the FreshMart logo, navigation links, user information,
// a cart icon with a badge, a profile dropdown, and a dark/light mode toggle.
// The design is mobile-responsive, ensuring all elements are accessible
// on smaller screens without disappearing.

const BuyerDashboardNavbar = ({ buyerUser, cartItemCount, theme, toggleTheme }) => {
    // useNavigate hook for programmatic navigation
    const navigate = useNavigate();

    // State to manage the visibility of the mobile navigation menu
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    // State to manage the visibility of the profile dropdown
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

    // Effect to apply the theme class to the document body (already handled in parent, but good to keep for standalone testing)
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    // Function to toggle the mobile menu visibility
    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    // Function to toggle the profile dropdown visibility
    const toggleProfileDropdown = () => {
        setIsProfileDropdownOpen(!isProfileDropdownOpen);
    };

    // Updated navigation function using useNavigate
    const handleNavigation = (path) => {
        navigate(path);
        setIsMobileMenuOpen(false); // Close mobile menu after navigation
        setIsProfileDropdownOpen(false); // Close profile dropdown after navigation
    };

    // Placeholder for user profile image. Replace with actual image URL.
    const userProfileImage = "https://placehold.co/40x40/E0F2F1/000?text=JD"; // Example placeholder image

    return (
        <nav className="bg-white dark:bg-gray-800 shadow-md p-4 sticky top-0 z-50 font-inter transition-colors duration-300">
            <div className="container mx-auto flex justify-between items-center flex-wrap">
                {/* Logo Section */}
                <div className="flex items-center flex-shrink-0 mr-6">
                    <span
                        className="font-bold text-2xl text-green-600 dark:text-green-400 cursor-pointer hover:text-green-700 dark:hover:text-green-300 transition-colors duration-200"
                        onClick={() => handleNavigation('/')} // Navigate to home page
                    >
                       🌿FreshMart
                    </span>
                </div>

                {/* Mobile menu button (Hamburger icon) */}
                <div className="block lg:hidden">
                    <button
                        onClick={toggleMobileMenu}
                        className="flex items-center px-3 py-2 rounded text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
                        aria-label="Toggle navigation"
                    >
                        {isMobileMenuOpen ? (
                            <X className="h-6 w-6" /> // X icon when menu is open
                        ) : (
                            <Menu className="h-6 w-6" /> // Hamburger icon when menu is closed
                        )}
                    </button>
                </div>

                {/* Main Navigation Links (hidden on mobile by default, shown when menu is open) */}
                <div
                    className={`${
                        isMobileMenuOpen ? 'block' : 'hidden'
                    } w-full lg:flex lg:items-center lg:w-auto`}
                >
                    <div className="text-sm lg:flex-grow lg:flex lg:justify-start lg:ml-8">
                        <button
                            onClick={() => handleNavigation('/buyer/dashboard')}
                            className="block mt-4 lg:inline-block lg:mt-0 text-gray-700 dark:text-gray-300 mr-4 p-2 rounded-md transition duration-300 ease-in-out
                            hover:bg-gradient-to-r hover:from-green-400 hover:to-green-500 hover:text-white
                            dark:hover:from-green-600 dark:hover:to-green-700 dark:hover:text-white"
                        >
                            Products
                        </button>
                        <button
                            onClick={() => handleNavigation('/buyer/orders')}
                            className="block mt-4 lg:inline-block lg:mt-0 text-gray-700 dark:text-gray-300 mr-4 p-2 rounded-md transition duration-300 ease-in-out
                            hover:bg-gradient-to-r hover:from-green-400 hover:to-green-500 hover:text-white
                            dark:hover:from-green-600 dark:hover:to-green-700 dark:hover:text-white"
                        >
                            My Orders
                        </button>
                        <button
                            onClick={() => handleNavigation('/buyer/address')}
                            className="block mt-4 lg:inline-block lg:mt-0 text-gray-700 dark:text-gray-300 mr-4 p-2 rounded-md transition duration-300 ease-in-out
                            hover:bg-gradient-to-r hover:from-green-400 hover:to-green-500 hover:text-white
                            dark:hover:from-green-600 dark:hover:to-green-700 dark:hover:text-white"
                        >
                            Address
                        </button>
                        {/* Cart Icon with Badge */}
                        <div className="relative block mt-4 lg:inline-block lg:mt-0 mr-4">
                            <button
                                className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 p-2 rounded-md transition duration-300 ease-in-out hover:bg-gray-100 dark:hover:bg-gray-700"
                                aria-label="Shopping cart"
                                onClick={() => handleNavigation('/buyer/cart')}
                            >
                                <ShoppingCart className="w-6 h-6" /> {/* Lucide React ShoppingCart icon */}
                            </button>
                            {/* Cart badge */}
                            <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                                {cartItemCount || 0} {/* Use prop for dynamic count */}
                            </span>
                        </div>
                    </div>

                    {/* Right-side Icons and Profile Dropdown */}
                    <div className="flex items-center mt-4 lg:mt-0 space-x-4 ml-auto">
                        {/* Dark Mode Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-300 ease-in-out"
                            aria-label="Toggle dark mode"
                        >
                            {theme === 'light' ? (
                                <Moon className="w-6 h-6" /> // Moon icon for light mode (to switch to dark)
                            ) : (
                                <Sun className="w-6 h-6" /> // Sun icon for dark mode (to switch to light)
                            )}
                        </button>

                        {/* User Name, Profile Image, and Icon (clickable for dropdown) - Rightmost */}
                        <div className="relative">
                            <button
                                onClick={toggleProfileDropdown}
                                className="flex items-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
                            >
                                {/* Profile Image */}
                                <img
                                    src={userProfileImage}
                                    alt="User Profile"
                                    className="w-8 h-8 rounded-full mr-2 object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null; // Prevents infinite loop if fallback also fails
                                        e.target.src = "https://placehold.co/40x40/E0F2F1/000?text=JD"; // Fallback to a default placeholder
                                    }}
                                />
                                {/* User Name */}
                                <span className="hidden md:block">
                                    {buyerUser ? buyerUser.name : 'Guest'} {/* Display buyerUser name */}
                                </span>
                                {/* Dropdown arrow icon */}
                                <ChevronDown
                                    className={`w-4 h-4 ml-1 transform ${
                                        isProfileDropdownOpen ? 'rotate-180' : 'rotate-0'
                                    } transition-transform duration-200`}
                                />
                            </button>

                            {/* Profile Dropdown Content */}
                            {isProfileDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg py-1 z-10">
                                    <button
                                        onClick={() => handleNavigation('/buyer/profile')}
                                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left"
                                    >
                                        My Profile
                                    </button>
                                    <button
                                        onClick={() => handleNavigation('/')} // Assuming /login is your login route for logout
                                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left"
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default BuyerDashboardNavbar;
