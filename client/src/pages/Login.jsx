import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Toastify from 'toastify-js';
import "toastify-js/src/toastify.css";

// Create an API instance pointing to backend (same domain, different port if in dev)
// By default, since backend is running concurrently, we'll hit absolute URL or configure proxy
const api = axios.create({
  baseURL: '/api'
});

const Login = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [currentRole, setCurrentRole] = useState('client');
  const [formData, setFormData] = useState({
    fullName: '',
    profession: '',
    email: '',
    mobile: '',
    password: '',
    experience: ''
  });
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    if (!isLoginMode && currentRole === 'admin') setCurrentRole('client');
    setError('');
  };

  const handleRoleChange = (role) => {
    setCurrentRole(role);
    setError('');
  };

  const showToast = (msg, type) => {
    Toastify({
      text: msg,
      duration: 3000,
      close: true,
      gravity: "top", 
      position: "right",
      style: {
        background: type === 'success' ? '#10b981' : '#ef4444',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '600'
      }
    }).showToast();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (!isLoginMode) {
        // Register Mode
        const payload = {
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          role: currentRole,
          mobile: formData.mobile,
          ...(currentRole === 'professional' && {
            profession: formData.profession,
            experience: formData.experience
          })
        };

        const { data } = await api.post('/auth/register', payload);
        showToast('Registration successful! Please login.', 'success');
        setIsLoginMode(true);

      } else {
        // Login Mode
        const { data } = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password,
          role: currentRole
        });

        const user = data.user;
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('userRole', user.role);
        localStorage.setItem('userName', user.name);
        localStorage.setItem('userMobile', user.mobile || '');
        localStorage.setItem('userId', user.id);

        if (user.role === 'professional') {
          localStorage.setItem('userProfession', user.profession || '');
          localStorage.setItem('userExperience', user.experience || '');
          if (user.workerId) localStorage.setItem('workerId', user.workerId);
        }

        showToast(`Login successful! Welcome back, ${user.name}.`, 'success');

        setTimeout(() => {
          if (user.role === 'professional') navigate('/worker');
          else if (user.role === 'admin') navigate('/admin');
          else navigate('/client');
        }, 1000);
      }
    } catch (err) {
      const msg = err.response?.data?.msg || err.message;
      setError(msg);
      showToast(msg, 'error');
    }
  };

  return (
    <>
      <header className="header">
        <div className="logo-container" onClick={() => navigate('/client')}>
          <img src="/images/logo.jpg" alt="DutyFix IT" className="logo-image" />
        </div>
      </header>

      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-icon-header">
            <i className={isLoginMode ? "fas fa-tools" : "fas fa-user-plus"}></i>
          </div>

          <h2 className="auth-title">
            {isLoginMode ? "Login to your account" : "Join DutyFix IT today"}
          </h2>

          <div className="role-switch-container">
            <button 
              type="button"
              className={`role-btn ${currentRole === 'client' ? 'active' : ''}`}
              onClick={() => handleRoleChange('client')}
            >
              Client
            </button>
            <button 
              type="button"
              className={`role-btn ${currentRole === 'professional' ? 'active' : ''}`}
              onClick={() => handleRoleChange('professional')}
            >
              Professional
            </button>
            {isLoginMode && (
              <button 
                type="button"
                className={`role-btn ${currentRole === 'admin' ? 'active' : ''}`}
                onClick={() => handleRoleChange('admin')}
              >
                Admin
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            {!isLoginMode && (
              <div className="input-group">
                <i className="fas fa-user input-icon"></i>
                <input 
                  type="text" 
                  name="fullName"
                  className="form-input" 
                  placeholder="Full Name" 
                  required 
                  value={formData.fullName}
                  onChange={handleInputChange}
                />
              </div>
            )}

            {!isLoginMode && currentRole === 'professional' && (
              <div className="input-group">
                <i className="fas fa-briefcase input-icon"></i>
                <select 
                  name="profession"
                  className="form-input select-custom" 
                  required 
                  value={formData.profession}
                  onChange={handleInputChange}
                >
                  <option value="" disabled>Select Profession</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Painting">Painting</option>
                  <option value="Carpentry">Carpentry</option>
                  <option value="AC Service">AC Service</option>
                  <option value="CCTV Service">CCTV Service</option>
                  <option value="Interior Design">Interior Design</option>
                  <option value="Civil Service">Civil Service</option>
                  <option value="RO Purifier">RO Purifier</option>
                </select>
              </div>
            )}

            <div className="input-group">
              <i className="fas fa-envelope input-icon"></i>
              <input 
                type="text" 
                name="email"
                className="form-input" 
                placeholder="Email / Username" 
                required 
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            {!isLoginMode && (
              <div className="input-group">
                <i className="fas fa-phone input-icon"></i>
                <input 
                  type="tel" 
                  name="mobile"
                  className="form-input" 
                  placeholder="Mobile Number" 
                  required
                  value={formData.mobile}
                  onChange={handleInputChange}
                />
              </div>
            )}

            <div className="input-group">
              <i className="fas fa-lock input-icon"></i>
              <input 
                type="password" 
                name="password"
                className="form-input" 
                placeholder="Password" 
                required 
                value={formData.password}
                onChange={handleInputChange}
              />
            </div>

            {!isLoginMode && currentRole === 'professional' && (
              <div className="input-group">
                <i className="fas fa-medal input-icon"></i>
                <input 
                  type="text" 
                  name="experience"
                  className="form-input" 
                  placeholder="Experience (e.g. 5 years)" 
                  value={formData.experience}
                  onChange={handleInputChange}
                />
              </div>
            )}

            {error && <div style={{ color: '#dc2626', marginTop: '10px', textAlign: 'center', fontSize: '0.9rem' }}>{error}</div>}

            <button type="submit" className="submit-btn" style={{marginTop: '15px'}}>
              {isLoginMode ? 'Login' : `Register as ${currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}`}
            </button>
          </form>

          <div className="toggle-auth-mode" style={{marginTop: '15px'}}>
            <p>
              {isLoginMode ? "New to DutyFix? " : "Already have an account? "}
              <span className="toggle-link font-bold-pointer" onClick={toggleMode} style={{color:'#0f172a', fontWeight:700, cursor:'pointer'}}>
                {isLoginMode ? "Sign Up" : "Login"}
              </span>
            </p>
          </div>
        </div>
      </main>
    </>
  );
};

export default Login;
