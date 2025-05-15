import { Link } from 'react-router-dom';
import '../../styles/footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section about">
            <h3 className="footer-logo">
              <span className="text-primary">Quick</span>Grocery
            </h3>
            <p>
              Fast, fresh groceries delivered to your doorstep. We connect customers 
              with local grocery stores for the best shopping experience.
            </p>
            <div className="social-links">
              <a href="#" className="social-link">
                <span className="social-icon">📱</span>
              </a>
              <a href="#" className="social-link">
                <span className="social-icon">📷</span>
              </a>
              <a href="#" className="social-link">
                <span className="social-icon">🐦</span>
              </a>
              <a href="#" className="social-link">
                <span className="social-icon">👍</span>
              </a>
            </div>
          </div>
          
          <div className="footer-section links">
            <h3>Quick Links</h3>
            <ul>
              <li><Link to="/buyer">Home</Link></li>
              <li><Link to="/buyer/orders">My Orders</Link></li>
              <li><Link to="/buyer/cart">Shopping Cart</Link></li>
              <li><Link to="/buyer/profile">My Account</Link></li>
            </ul>
          </div>
          
          <div className="footer-section partners">
            <h3>For Shop Owners</h3>
            <ul>
              <li><Link to="/register">Register Your Shop</Link></li>
              <li><Link to="/owner">Shop Owner Dashboard</Link></li>
              <li><Link to="/owner/analytics">Business Analytics</Link></li>
              <li><a href="#">Support Center</a></li>
            </ul>
          </div>
          
          <div className="footer-section contact">
            <h3>Contact Us</h3>
            <p>
              <span className="contact-icon">📍</span>
              123 Grocery St, New York, NY 10001
            </p>
            <p>
              <span className="contact-icon">✉️</span>
              support@quickgrocery.com
            </p>
            <p>
              <span className="contact-icon">📞</span>
              +1 (123) 456-7890
            </p>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="copyright">
            &copy; {currentYear} QuickGrocery. All rights reserved.
          </div>
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;