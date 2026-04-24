import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { clearAccessToken } from '../utils/api';

const Navbar = ({ role = 'client' }) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    setUserEmail(localStorage.getItem('userEmail') || 'user@example.com');
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = async () => {
    try {
      // Tell the server to invalidate the refresh token cookie
      await api.post('/auth/logout');
    } catch {
      // Proceed with local logout even if server call fails
    } finally {
      clearAccessToken();
      localStorage.clear();
      navigate('/login');
    }
  };

  const isWorker = role === 'worker';
  const logoHref = isWorker ? '/worker' : '/client';

  return (
    <header className={`header ${role === 'worker' ? 'worker-header' : 'client-header'}`}>
      <div className="logo-container" onClick={() => navigate(logoHref)}>
        <i className="fas fa-tools logo-icon" style={{marginRight: '8px', color: '#1e293b', fontSize: '1.5rem'}}></i>
        <span className="logo-text" style={{fontWeight: 700, fontSize: '1.25rem', color: '#1e293b'}}>DutyFix IT</span>
      </div>

      <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
        <i className="fas fa-bars"></i>
      </button>

      <div className={`nav-menu-wrapper ${mobileMenuOpen ? 'active' : ''}`} id="navMenu">
        <span className="user-email">{userEmail}</span>
        <nav className="client-nav-links">
          <a href="#" onClick={(e) => { 
            e.preventDefault(); 
            navigate(isWorker ? '/worker' : '/client-profile'); 
          }} className="client-nav-link">
            Profile
          </a>
          <a href="#" onClick={(e) => { 
            e.preventDefault(); 
            navigate(isWorker ? '/request' : '/mybooking'); 
          }} className="client-nav-link">
            {isWorker ? 'Requests' : 'My Bookings'}
          </a>
          {isWorker && (
            <a href="#" onClick={(e) => { 
              e.preventDefault(); 
              navigate('/worker-verify'); 
            }} className="client-nav-link">
              Verification
            </a>
          )}
        </nav>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
    </header>
  );
};

export default Navbar;
