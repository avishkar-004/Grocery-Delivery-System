import React, { useState } from 'react';
import '../../styles/input.css';

const Input = ({
  label,
  type = 'text',
  name,
  value,
  placeholder,
  onChange,
  onBlur,
  error,
  helperText,
  required = false,
  disabled = false,
  icon = null,
  iconPosition = 'left',
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === 'password';
  const actualType = isPasswordType ? (showPassword ? 'text' : 'password') : type;
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={`input-wrapper ${className}`}>
      {label && (
        <label htmlFor={name} className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      
      <div className={`input-container ${error ? 'input-error' : ''} ${disabled ? 'input-disabled' : ''} ${icon || isPasswordType ? 'input-with-icon' : ''} ${iconPosition === 'right' ? 'input-icon-right' : ''}`}>
        {icon && iconPosition === 'left' && (
          <span className="input-icon input-icon-left">{icon}</span>
        )}
        
        <input
          type={actualType}
          id={name}
          name={name}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          className="input-field"
          {...props}
        />
        
        {icon && iconPosition === 'right' && !isPasswordType && (
          <span className="input-icon input-icon-right">{icon}</span>
        )}
        
        {isPasswordType && (
          <button
            type="button"
            className="input-password-toggle"
            onClick={togglePasswordVisibility}
          >
            {showPassword ? '👁️‍🗨️' : '👁️'}
          </button>
        )}
      </div>
      
      {(error || helperText) && (
        <div className={`input-feedback ${error ? 'input-feedback-error' : ''}`}>
          {error || helperText}
        </div>
      )}
    </div>
  );
};

export default Input;