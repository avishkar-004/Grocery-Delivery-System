import React from 'react';
import '../../styles/button.css';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  disabled = false,
  icon = null,
  iconPosition = 'left',
  onClick,
  className = '',
  ...props
}) => {
  const baseClass = 'btn';
  const variantClass = variant ? `btn-${variant}` : '';
  const sizeClass = size ? `btn-${size}` : '';
  const widthClass = fullWidth ? 'btn-block' : '';
  const loadingClass = isLoading ? 'btn-loading' : '';
  const iconOnlyClass = icon && !children ? 'btn-icon-only' : '';
  
  const buttonClasses = [
    baseClass,
    variantClass,
    sizeClass,
    widthClass,
    loadingClass,
    iconOnlyClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading && <span className="btn-spinner"></span>}
      
      {icon && iconPosition === 'left' && !isLoading && (
        <span className="btn-icon btn-icon-left">{icon}</span>
      )}
      
      {children && <span className="btn-text">{children}</span>}
      
      {icon && iconPosition === 'right' && !isLoading && (
        <span className="btn-icon btn-icon-right">{icon}</span>
      )}
    </button>
  );
};

export default Button;