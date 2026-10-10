import React from 'react';
import './Card.css';

export const Card = ({ title, subtitle, children, className = '', footer, style = {}, onClick }) => {
  const interactiveClass = onClick ? 'interactive-3d cursor-pointer' : '';
  
  return (
    <div 
      className={`card ${interactiveClass} ${className}`} 
      style={style}
      onClick={onClick}
    >
      {(title || subtitle) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      )}
      
      <div className="card-body">
        {children}
      </div>

      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}
    </div>
  );
};
