import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});
  const { register, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const setRole = (role) => {
    setFormData({ ...formData, role });
    if (errors.role) {
      setErrors({ ...errors, role: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.phone) {
      newErrors.phone = 'Phone is required';
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be 10 digits';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const user = await register(formData);
      
      // Redirect based on user role
      if (user.role === 'owner') {
        navigate('/owner');
      } else {
        navigate('/buyer');
      }
    } catch (err) {
      setErrors({ 
        general: err.message || 'Failed to register. Please try again.'
      });
    }
  };

  return (
    <div className="auth-form-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2 className="auth-title">Create Account</h2>
        
        {errors.general && (
          <div className="alert alert-danger mb-md">{errors.general}</div>
        )}
        
        <div className="form-group">
          <Input
            label="Full Name"
            type="text"
            name="name"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
          />
        </div>
        
        <div className="form-group">
          <Input
            label="Email"
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
          />
        </div>
        
        <div className="form-group">
          <Input
            label="Phone Number"
            type="tel"
            name="phone"
            placeholder="Enter your phone number"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
            required
          />
        </div>
        
        <div className="form-group">
          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="Create a password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            required
          />
        </div>
        
        <div className="form-group">
          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            required
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Register as</label>
          {errors.role && <div className="form-error">{errors.role}</div>}
          <div className="auth-options">
            <div 
              className={`role-option ${formData.role === 'buyer' ? 'active' : ''}`}
              onClick={() => setRole('buyer')}
            >
              <div className="role-option-icon">🛒</div>
              <div className="role-option-title">Buyer</div>
              <div className="role-option-desc">Browse and order groceries</div>
            </div>
            
            <div 
              className={`role-option ${formData.role === 'owner' ? 'active' : ''}`}
              onClick={() => setRole('owner')}
            >
              <div className="role-option-icon">🏪</div>
              <div className="role-option-title">Shop Owner</div>
              <div className="role-option-desc">Sell groceries online</div>
            </div>
          </div>
        </div>
        
        <div className="form-submit">
          <Button 
            type="submit" 
            variant="primary" 
            fullWidth 
            isLoading={loading}
          >
            Create Account
          </Button>
        </div>
        
        <div className="auth-form-footer">
          <p>Already have an account? <Link to="/login">Login</Link></p>
        </div>
      </form>
    </div>
  );
};

export default Register;