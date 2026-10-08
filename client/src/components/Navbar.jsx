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
      await api.post('/auth/logout');
    } catch {
      // Proceed with local logout
    } finally {
      clearAccessToken();
      localStorage.clear();
      navigate('/login');
    }
  };

  const isWorker = role === 'worker';
  const logoHref = isWorker ? '/worker' : '/client';

  return (
    <header className="nav">
      <div className="l-container nav__inner">
        <button className="nav__brand" onClick={() => navigate(logoHref)}>
          <i className="fas fa-tools"></i>
          <span>DutyFix IT</span>
        </button>

        <button 
          className="nav__mobile-toggle" 
          onClick={toggleMobileMenu}
          aria-expanded={mobileMenuOpen}
        >
          <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </button>

        <nav className="nav__links">
          <span className="nav__user">{userEmail}</span>
          <button onClick={() => navigate(isWorker ? '/worker' : '/client-profile')} className="nav__link">
            Profile
          </button>
          <button onClick={() => navigate(isWorker ? '/request' : '/mybooking')} className="nav__link">
            {isWorker ? 'Requests' : 'My Bookings'}
          </button>
          {isWorker && (
            <button onClick={() => navigate('/worker-verify')} className="nav__link">
              Verification
            </button>
          )}
          <button className="btn btn--ghost" style={{borderColor: 'var(--paper)', color: 'var(--paper)'}} onClick={handleLogout}>
            Logout
          </button>
        </nav>

        {/* Mobile Menu */}
        <nav className={`nav__mobile-menu ${mobileMenuOpen ? 'nav__mobile-menu--open' : ''}`}>
          <span className="nav__user">{userEmail}</span>
          <button onClick={() => { toggleMobileMenu(); navigate(isWorker ? '/worker' : '/client-profile'); }} className="nav__link">
            Profile
          </button>
          <button onClick={() => { toggleMobileMenu(); navigate(isWorker ? '/request' : '/mybooking'); }} className="nav__link">
            {isWorker ? 'Requests' : 'My Bookings'}
          </button>
          {isWorker && (
            <button onClick={() => { toggleMobileMenu(); navigate('/worker-verify'); }} className="nav__link">
              Verification
            </button>
          )}
          <button className="btn btn--danger" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
