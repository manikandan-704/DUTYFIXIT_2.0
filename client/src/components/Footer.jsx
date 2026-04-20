import React from 'react';
import { useNavigate } from 'react-router-dom';

const Footer = ({ role = 'client' }) => {
  const navigate = useNavigate();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="logo-container" onClick={() => navigate(role === 'worker' ? '/worker' : '/client')}>
          <img src="/images/logo.jpg" alt="DutyFix IT" className="logo-image" />
        </div>

        <div className="social-links">
          <a href="https://www.instagram.com/duty_fixit" aria-label="Instagram">
            <i className="fab fa-instagram social-icon"></i>
          </a>
          <a href="#" aria-label="X">
             <i className="fab fa-twitter social-icon"></i>
          </a>
          <a href="https://www.facebook.com" aria-label="Facebook">
             <i className="fab fa-facebook social-icon"></i>
          </a>
        </div>

        <div className="footer-nav">
          <a href="#" className="footer-link">Privacy Policy</a>
          <a href="#" className="footer-link">Terms of Service</a>
          <a href="#" className="footer-link">Contact Us</a>
        </div>

        <p className="copyright">© 2025 DutyFixit. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
