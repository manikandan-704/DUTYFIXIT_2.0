import React from 'react';
import { useNavigate } from 'react-router-dom';

const Footer = ({ role = 'client' }) => {
  const navigate = useNavigate();

  return (
    <footer className="footer">
      <div className="l-container footer__inner">
        
        <div style={{display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start'}}>
           <button className="nav__brand" onClick={() => navigate(role === 'worker' ? '/worker' : '/client')} style={{padding: 0}}>
             <i className="fas fa-tools"></i>
             <span>DutyFix IT</span>
           </button>
           <p className="footer__copyright">© 2026 DutyFixIT. The Workbench model.</p>
        </div>

        <nav className="footer__nav">
          <a href="#" className="footer__link">Privacy Policy</a>
          <a href="#" className="footer__link">Terms of Service</a>
          <a href="#" className="footer__link">Contact Us</a>
        </nav>

      </div>
    </footer>
  );
};

export default Footer;
