import { useState, useEffect, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';
import '../../styles/navbar.css';

const Navbar = ({ role = 'buyer' }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useContext(AuthContext);
  const { cartItems } = useContext(CartContext);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.navbar-menu') && 
          !event.target.closest('.menu-toggle')) {
        setIsMenuOpen(false);
      }
      
      if (isProfileDropdownOpen && !event.target.closest('.profile-dropdown') && 
          !event.target.closest('.profile-toggle')) {
        setIsProfileDropdownOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen, isProfileDropdownOpen]);
  
  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileDropdownOpen(false);
  }, [pathname]);
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };
  
  const getNavLinks = () => {
    if (role === 'buyer') {
      return [
        { name: 'Home', path: '/buyer' },
        { name: 'Orders', path: '/buyer/orders' },
      ];
    } else {
      return [
        { name: 'Dashboard', path: '/owner' },
        { name: 'Products', path: '/owner/products' },
        { name: 'Nearby Orders', path: '/owner/nearby-orders' },
        { name: 'My Orders', path: '/owner/my-orders' },
        { name: 'Analytics', path: '/owner/analytics' },
      ];
    }
  };
  
  const navLinks = getNavLinks();
  
  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <div className="navbar-brand">
          <Link to={role === 'buyer' ? '/buyer' : '/owner'} className="navbar-logo">
            <span className="text-primary">Quick</span>Grocery
          </Link>
          
          <button className="menu-toggle" onClick={toggleMenu}>
            <span className="menu-icon">☰</span>
          </button>
        </div>
        
        <div className={`navbar-menu ${isMenuOpen ? 'is-active' : ''}`}>
          <ul className="navbar-nav">
            {navLinks.map((link) => (
              <li key={link.path} className="nav-item">
                <Link
                  to={link.path}
                  className={`nav-link ${pathname === link.path ? 'active' : ''}`}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="navbar-actions">
          {role === 'buyer' && (
            <Link to="/buyer/cart" className="cart-icon">
              <span className="icon">🛒</span>
              {cartItems.length > 0 && (
                <span className="cart-badge">{cartItems.length}</span>
              )}
            </Link>
          )}
          
          <div className="profile-dropdown">
            <button className="profile-toggle" onClick={toggleProfileDropdown}>
              <div className="avatar">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : '?'}
              </div>
            </button>
            
            {isProfileDropdownOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <div className="avatar">
                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className="user-info">
                    <p className="user-name">{currentUser?.name}</p>
                    <p className="user-email">{currentUser?.email}</p>
                  </div>
                </div>
                
                <div className="dropdown-divider"></div>
                
                <Link 
                  to={role === 'buyer' ? '/buyer/profile' : '/owner/profile'} 
                  className="dropdown-item"
                >
                  <span className="dropdown-icon">👤</span>
                  My Profile
                </Link>
                
                <button className="dropdown-item" onClick={handleLogout}>
                  <span className="dropdown-icon">🚪</span>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;