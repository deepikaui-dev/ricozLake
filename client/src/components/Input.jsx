import React, { forwardRef } from 'react';
import './Input.css';

export const Input = forwardRef(({ 
  label, 
  error, 
  id,
  className = '', 
  fullWidth = true,
  icon: Icon,
  ...props 
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const widthClass = fullWidth ? 'input-full' : '';
  const errorClass = error ? 'input-error' : '';

  return (
    <div className={`input-wrapper ${widthClass} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <div className="input-container">
        {Icon && <span className="input-icon"><Icon size={18} /></span>}
        <input
          id={inputId}
          ref={ref}
          className={`input-field ${Icon ? 'input-with-icon' : ''} ${errorClass}`}
          {...props}
        />
      </div>
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';
