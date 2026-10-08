import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { setAccessToken } from '../utils/api';
import Toastify from 'toastify-js';
import "toastify-js/src/toastify.css";

const Login = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [currentRole, setCurrentRole] = useState('client');
  const [formData, setFormData] = useState({
    fullName: '', profession: '', email: '', mobile: '', password: '', experience: ''
  });
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    if (!isLoginMode && currentRole === 'admin') setCurrentRole('client');
    setError('');
  };

  const showToast = (msg, type) => {
    Toastify({
      text: msg,
      duration: 3000,
      close: true,
      gravity: "top", 
      position: "right",
      className: type === 'success' ? 'Toastify__toast--success' : 'Toastify__toast--error'
    }).showToast();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (!isLoginMode) {
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

        await api.post('/auth/register', payload);
        showToast('Registration successful! Please login.', 'success');
        setIsLoginMode(true);

      } else {
        const { data } = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password,
          role: currentRole
        });

        if (data.accessToken) setAccessToken(data.accessToken);

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

        showToast(`Welcome back, ${user.name}.`, 'success');

        setTimeout(() => {
          if (user.role === 'professional') navigate('/worker');
          else if (user.role === 'admin') navigate('/admin');
          else navigate('/client');
        }, 1000);
      }
    } catch (err) {
      const msg = err.response?.data?.msg || err.response?.data?.message || err.message;
      setError(msg);
      showToast(msg, 'error');
    }
  };

  return (
    <div className="auth-layout">
      {/* Brand Panel */}
      <aside className="auth-brand">
        <div className="auth-brand__logo">
          <i className="fas fa-tools"></i> DutyFix IT
        </div>
        <h1 className="auth-brand__quote">
          {isLoginMode ? "Welcome back to the workbench." : "Start building your reputation."}
        </h1>
        <p style={{marginTop: '24px', opacity: 0.8, maxWidth: '400px'}}>
          The premier network for verified tradespeople and households.
        </p>
      </aside>

      {/* Form Panel */}
      <main className="auth-form-panel">
        <div className="auth-form-container">
          <h2 className="auth-title">
            {isLoginMode ? "Login" : "Register"}
          </h2>

          <div className="segmented-control u-mb-6">
            <label>
              <input type="radio" name="role" checked={currentRole === 'client'} onChange={() => {setCurrentRole('client'); setError('');}} />
              <span>Client</span>
            </label>
            <label>
              <input type="radio" name="role" checked={currentRole === 'professional'} onChange={() => {setCurrentRole('professional'); setError('');}} />
              <span>Professional</span>
            </label>
            {isLoginMode && (
              <label>
                <input type="radio" name="role" checked={currentRole === 'admin'} onChange={() => {setCurrentRole('admin'); setError('');}} />
                <span>Admin</span>
              </label>
            )}
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            {!isLoginMode && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" name="fullName" className="form-input" required value={formData.fullName} onChange={handleInputChange} />
              </div>
            )}

            {!isLoginMode && currentRole === 'professional' && (
              <div className="auth-professional-fields">
                <div className="form-group">
                  <label className="form-label">Profession</label>
                  <select name="profession" className="form-select" required value={formData.profession} onChange={handleInputChange}>
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
                <div className="form-group">
                  <label className="form-label">Experience</label>
                  <input type="text" name="experience" className="form-input" placeholder="e.g. 5 years" value={formData.experience} onChange={handleInputChange} />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="text" name="email" className="form-input" required value={formData.email} onChange={handleInputChange} />
            </div>

            {!isLoginMode && (
              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <input type="tel" name="mobile" className="form-input" required value={formData.mobile} onChange={handleInputChange} />
              </div>
            )}

            <div className="form-group u-mb-8">
              <label className="form-label">Password</label>
              <input type="password" name="password" className="form-input" required value={formData.password} onChange={handleInputChange} />
            </div>

            <button type="submit" className="btn btn--primary" style={{width: '100%'}}>
              {isLoginMode ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="auth-toggle">
            {isLoginMode ? "New to DutyFix? " : "Already have an account? "}
            <button type="button" onClick={toggleMode}>
              {isLoginMode ? "Sign Up" : "Login"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
