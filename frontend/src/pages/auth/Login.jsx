import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const { login, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
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
      const user = await login(formData.email, formData.password);
      
      user.role = 'owner'
      // Redirect based on user role
      if (user.role === 'owner') {
        navigate('/owner');
      } else {
        navigate('/buyer');
      }
    } catch (err) {
      setErrors({ 
        general: err.message || 'Failed to login. Please check your credentials.'
      });
    }
  };

  return (
    <div className="auth-form-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2 className="auth-title">Welcome Back</h2>
        
        {errors.general && (
          <div className="alert alert-danger mb-md">{errors.general}</div>
        )}
        
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
            label="Password"
            type="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            required
          />
          <div className="text-right mt-sm">
            <Link to="/forgot-password" className="text-sm">Forgot password?</Link>
          </div>
        </div>
        
        <div className="form-submit">
          <Button 
            type="submit" 
            variant="primary" 
            fullWidth 
            isLoading={loading}
          >
            Login
          </Button>
        </div>
        
        <div className="auth-form-footer">
          <p>Don't have an account? <Link to="/register">Create Account</Link></p>
        </div>
      </form>
    </div>
  );
};

export default Login;