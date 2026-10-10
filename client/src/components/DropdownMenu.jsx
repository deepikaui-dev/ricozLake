import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, MoreVertical } from 'lucide-react';
import './DropdownMenu.css';

export const DropdownMenu = ({ options, icon: Icon = MoreHorizontal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="dropdown-container" ref={menuRef} onClick={(e) => e.stopPropagation()}>
      <button 
        className="dropdown-trigger"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        <Icon size={18} />
      </button>

      {isOpen && (
        <div className="dropdown-content">
          {options.map((option, idx) => (
            <button
              key={idx}
              className={`dropdown-item ${option.danger ? 'danger' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                if (option.onClick) option.onClick();
              }}
            >
              {option.icon && <span className="dropdown-icon">{option.icon}</span>}
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
