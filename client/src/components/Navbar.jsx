import React from 'react';
import { Search, Bell, User, LogOut, Menu } from 'lucide-react';
import { Input } from './Input';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './Navbar.css';

export const Navbar = ({ title = 'Dashboard', toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && e.target.value.trim() !== '') {
      navigate(`/search?q=${encodeURIComponent(e.target.value)}`);
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="mobile-menu-btn" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
        <h1 className="navbar-title">{title}</h1>
      </div>
      
      <div className="navbar-right">
        <div className="navbar-search">
          <Input 
            placeholder="Search resources..." 
            icon={Search} 
            className="search-input"
            onKeyDown={handleSearch}
          />
        </div>
        
        <button className="icon-btn" onClick={() => toast('No new notifications', { icon: '🔔' })}>
          <Bell size={20} />
          <span className="notification-badge"></span>
        </button>
        
        <div className="user-avatar" title="Logout" onClick={handleLogout} style={{ display: 'flex', gap: '0.5rem', padding: '0 1rem', width: 'auto', borderRadius: '20px', cursor: 'pointer', alignItems: 'center' }}>
          <img 
            src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=3B82F6&color=fff&rounded=true`} 
            alt="Avatar" 
            style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} 
          />
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.name || 'Log Out'}</span>
        </div>
      </div>
    </header>
  );
};
