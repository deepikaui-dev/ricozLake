import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Database, Activity, Settings, LogOut, FilePlus, Server, Bookmark, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

export const Sidebar = ({ isOpen, setIsOpen }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (setIsOpen) setIsOpen(false);
  };

  const handleNavClick = () => {
    if (setIsOpen && window.innerWidth <= 768) {
      setIsOpen(false);
    }
  };

  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem('ricoz_theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('ricoz_theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('ricoz_theme', 'light');
    }
  }, [isDark]);

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <Database className="logo-icon" size={24} />
          <span className="logo-text">RicozLake</span>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <div className="nav-section">
          <span className="nav-section-title">Overview</span>
          <NavLink to="/" onClick={handleNavClick} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <Home size={18} />
            <span>Dashboard</span>
          </NavLink>
        </div>

        <div className="nav-section">
          <span className="nav-section-title">Data Management</span>
          <NavLink to="/data-sources" onClick={handleNavClick} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <Server size={18} />
            <span>Data Sources</span>
          </NavLink>
          <NavLink to="/catalog" onClick={handleNavClick} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <Database size={18} />
            <span>Dataset Catalog</span>
          </NavLink>
          <NavLink to="/add-dataset" onClick={handleNavClick} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <FilePlus size={18} />
            <span>Add Dataset</span>
          </NavLink>
        </div>

        <div className="nav-section">
          <span className="nav-section-title">Explore</span>
          <NavLink to="/queries" onClick={handleNavClick} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <Bookmark size={18} />
            <span>Saved Queries</span>
          </NavLink>
        </div>

        <div className="nav-section">
          <span className="nav-section-title">System</span>
          <NavLink to="/activity" onClick={handleNavClick} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <Activity size={18} />
            <span>Activity Center</span>
          </NavLink>
          <NavLink to="/settings" onClick={handleNavClick} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <Settings size={18} />
            <span>Settings</span>
          </NavLink>
        </div>
      </nav>

      <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button className="nav-item" onClick={() => setIsDark(!isDark)} style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left', color: 'var(--text-secondary)' }}>
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
          <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
